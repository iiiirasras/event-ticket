#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# EC2 Bootstrap: Node.js 20 + React build tools + GitHub CLI + PM2 + nginx
# Variables injected by Terraform templatefile:
#   mongodb_private_ip | mongo_user | mongo_password | mongo_db
#   jwt_secret | github_repo | node_env
# ─────────────────────────────────────────────────────────────────────────────
set -euxo pipefail
exec > >(tee /var/log/user-data.log | logger -t user-data) 2>&1

echo "========================================="
echo " Event Ticketing — App Server Setup      "
echo "========================================="

# ── 1. System update ──────────────────────────────────────────────────────────
yum update -y
yum install -y git curl wget unzip tar

# ── 2. Install Node.js 20 (LTS) ──────────────────────────────────────────────
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs
echo "Node.js version: $$(node --version)"
echo "npm version:     $$(npm --version)"

# ── 3. Install GitHub CLI (gh) ────────────────────────────────────────────────
# Official GitHub CLI repo for Amazon Linux 2
cat > /etc/yum.repos.d/gh-cli.repo << 'REPO'
[gh-cli]
name=packages for the GitHub CLI
baseurl=https://cli.github.com/packages/rpm
enabled=1
gpgcheck=1
gpgkey=https://keyserver.ubuntu.com/pks/lookup?op=get&search=0x23F3D4EA75716059
REPO

yum install -y gh || {
  # Fallback: install from GitHub releases if repo fails
  echo "Repo install failed, using direct download..."
  GH_VERSION=$$(curl -s https://api.github.com/repos/cli/cli/releases/latest | grep '"tag_name"' | cut -d'"' -f4 | sed 's/v//')
  curl -Lo /tmp/gh.tar.gz "https://github.com/cli/cli/releases/latest/download/gh_$${GH_VERSION}_linux_amd64.tar.gz"
  tar -xzf /tmp/gh.tar.gz -C /tmp
  mv /tmp/gh_$${GH_VERSION}_linux_amd64/bin/gh /usr/local/bin/gh
  chmod +x /usr/local/bin/gh
}
echo "GitHub CLI version: $$(gh --version | head -1)"

# ── 4. Install PM2 (Node.js process manager) ─────────────────────────────────
npm install -g pm2
pm2 startup systemd -u ec2-user --hp /home/ec2-user
echo "PM2 version: $$(pm2 --version)"

# ── 5. Install nginx ──────────────────────────────────────────────────────────
amazon-linux-extras install nginx1 -y
systemctl enable nginx

# ── 6. Create app directory ───────────────────────────────────────────────────
APP_DIR=/home/ec2-user/app
mkdir -p $$APP_DIR
chown ec2-user:ec2-user $$APP_DIR

# ── 7. Clone GitHub repo (if provided) ───────────────────────────────────────
GITHUB_REPO="${github_repo}"
if [ -n "$$GITHUB_REPO" ]; then
  echo "Cloning repository: $$GITHUB_REPO"
  sudo -u ec2-user git clone "$$GITHUB_REPO" "$$APP_DIR"
  echo "Repository cloned successfully."
else
  echo "No GitHub repo specified — skipping clone."
  echo "To clone later: git clone <your-repo-url> ~/app"
fi

# ── 8. Write backend .env ─────────────────────────────────────────────────────
BACKEND_DIR="$$APP_DIR/backend"
if [ -d "$$BACKEND_DIR" ]; then
  cat > "$$BACKEND_DIR/.env" << ENVFILE
PORT=5000
MONGO_URI=mongodb://${mongo_user}:${mongo_password}@${mongodb_private_ip}:27017/${mongo_db}?authSource=${mongo_db}
JWT_SECRET=${jwt_secret}
JWT_EXPIRE=24h
NODE_ENV=${node_env}
ENVFILE
  chown ec2-user:ec2-user "$$BACKEND_DIR/.env"
  echo "Backend .env created."

  # Install backend dependencies
  cd "$$BACKEND_DIR"
  sudo -u ec2-user npm install
  echo "Backend npm install complete."

  # Seed database
  sudo -u ec2-user npm run seed || echo "Seed skipped or failed — run manually if needed."

  # Start backend with PM2
  sudo -u ec2-user pm2 start server.js --name "event-ticketing-api" --cwd "$$BACKEND_DIR"
  sudo -u ec2-user pm2 save
fi

# ── 9. Build React frontend ───────────────────────────────────────────────────
FRONTEND_DIR="$$APP_DIR/frontend"
if [ -d "$$FRONTEND_DIR" ]; then
  # Point the Vite build at the EC2 app server's API
  cat > "$$FRONTEND_DIR/.env.production" << FRONTENV
VITE_API_URL=http://${mongodb_private_ip}:5000/api
FRONTENV

  cd "$$FRONTEND_DIR"
  sudo -u ec2-user npm install
  sudo -u ec2-user npm run build
  echo "React build complete."

  # Copy dist to nginx web root
  cp -r "$$FRONTEND_DIR/dist/"* /usr/share/nginx/html/
fi

# ── 10. Configure nginx as reverse proxy ──────────────────────────────────────
cat > /etc/nginx/conf.d/event-ticketing.conf << 'NGINXCFG'
server {
    listen 80;
    server_name _;

    # Serve React frontend (built static files)
    root /usr/share/nginx/html;
    index index.html;

    # React Router — return index.html for all non-API routes
    location / {
        try_files $$uri $$uri/ /index.html;
    }

    # Proxy API calls to Node.js backend
    location /api/ {
        proxy_pass         http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $$http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $$host;
        proxy_set_header   X-Real-IP $$remote_addr;
        proxy_set_header   X-Forwarded-For $$proxy_add_x_forwarded_for;
        proxy_cache_bypass $$http_upgrade;
    }
}
NGINXCFG

nginx -t && systemctl start nginx
echo "nginx started."

# ── 11. Configure firewall ────────────────────────────────────────────────────
# Allow ports 80, 5000, 5173 through the OS firewall
if command -v firewall-cmd &> /dev/null; then
  firewall-cmd --permanent --add-port=80/tcp
  firewall-cmd --permanent --add-port=5000/tcp
  firewall-cmd --permanent --add-port=5173/tcp
  firewall-cmd --reload
fi

# ── 12. Write a helpful README on the server ─────────────────────────────────
cat > /home/ec2-user/README.txt << HELPFILE
========================================
 Event Ticketing — App Server
========================================

MongoDB private IP : ${mongodb_private_ip}
Node.js API        : http://<this-server-ip>:5000
React Frontend     : http://<this-server-ip>:80

Useful commands:
  pm2 status                     — check Node.js process
  pm2 logs event-ticketing-api   — tail API logs
  pm2 restart event-ticketing-api
  sudo systemctl status nginx
  sudo tail -f /var/log/nginx/error.log

App directory      : ~/app/
Backend env file   : ~/app/backend/.env
Frontend build     : /usr/share/nginx/html/

GitHub CLI:
  gh auth login     — authenticate with GitHub
  gh repo clone     — clone a repository

To rebuild frontend after code changes:
  cd ~/app/frontend && npm run build && sudo cp -r dist/* /usr/share/nginx/html/

To redeploy backend:
  cd ~/app/backend && pm2 restart event-ticketing-api
========================================
HELPFILE

chown ec2-user:ec2-user /home/ec2-user/README.txt

echo "========================================="
echo " App Server setup complete!              "
echo " Node.js : $$(node --version)               "
echo " npm     : $$(npm --version)                "
echo " PM2     : $$(pm2 --version)                "
echo " gh CLI  : $$(gh --version | head -1)       "
echo "========================================="
