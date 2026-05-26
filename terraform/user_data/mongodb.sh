#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# EC2 Bootstrap: MongoDB 7.0 on Amazon Linux 2
# Variables injected by Terraform templatefile:
#   mongo_user | mongo_password | mongo_db
# ─────────────────────────────────────────────────────────────────────────────
set -euxo pipefail
exec > >(tee /var/log/user-data.log | logger -t user-data) 2>&1

echo "========================================="
echo " Event Ticketing — MongoDB Server Setup  "
echo "========================================="

# ── 1. System update ──────────────────────────────────────────────────────────
yum update -y

# ── 2. Add MongoDB 7.0 repository ─────────────────────────────────────────────
cat > /etc/yum.repos.d/mongodb-org-7.0.repo << 'REPO'
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/amazon/2/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc
REPO

# ── 3. Install MongoDB ────────────────────────────────────────────────────────
yum install -y mongodb-org

# ── 4. Configure mongod — listen on all interfaces (required for app server) ──
cat > /etc/mongod.conf << 'MONGOCFG'
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

storage:
  dbPath: /var/lib/mongo
  journal:
    enabled: true

processManagement:
  fork: true
  pidFilePath: /var/run/mongodb/mongod.pid
  timeZoneInfo: /usr/share/zoneinfo

net:
  port: 27017
  bindIp: 0.0.0.0     # accept connections from the app server

security:
  authorization: disabled   # disabled initially to create users, re-enabled below
MONGOCFG

# ── 5. Enable & start MongoDB ─────────────────────────────────────────────────
systemctl enable mongod
systemctl start mongod

echo "Waiting for MongoDB to start..."
sleep 15

# ── 6. Create admin + app user ────────────────────────────────────────────────
mongosh --quiet << JSEOF
use admin
db.createUser({
  user: "admin",
  pwd: "${mongo_password}",
  roles: [{ role: "root", db: "admin" }]
})

use ${mongo_db}
db.createUser({
  user: "${mongo_user}",
  pwd: "${mongo_password}",
  roles: [{ role: "readWrite", db: "${mongo_db}" }]
})

print("Users created successfully.")
JSEOF

# ── 7. Enable authentication ──────────────────────────────────────────────────
cat > /etc/mongod.conf << MONGOCFG_AUTH
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

storage:
  dbPath: /var/lib/mongo
  journal:
    enabled: true

processManagement:
  fork: true
  pidFilePath: /var/run/mongodb/mongod.pid
  timeZoneInfo: /usr/share/zoneinfo

net:
  port: 27017
  bindIp: 0.0.0.0

security:
  authorization: enabled
MONGOCFG_AUTH

systemctl restart mongod
echo "MongoDB restarted with authentication enabled."

# ── 8. Verify ─────────────────────────────────────────────────────────────────
sleep 5
mongosh --quiet \
  "mongodb://${mongo_user}:${mongo_password}@localhost:27017/${mongo_db}?authSource=${mongo_db}" \
  --eval "db.runCommand({ connectionStatus: 1 }).ok === 1 ? print('Auth OK') : print('Auth FAILED')"

echo "========================================="
echo " MongoDB setup complete!                 "
echo " DB   : ${mongo_db}                      "
echo " User : ${mongo_user}                    "
echo " Port : 27017                            "
echo "========================================="
