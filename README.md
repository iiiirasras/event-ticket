# AWS Infrastructure — GitHub Actions CI/CD

Provisions two EC2 instances on AWS using Terraform, triggered automatically via GitHub Actions on push to the `production` branch.

## Architecture

```
                  ┌──────────────────────────────┐
                  │          AWS VPC              │
                  │       10.0.0.0/16             │
                  │                               │
                  │  ┌──────────┐  ┌──────────┐  │
Internet ────────►│  │  App     │  │ MongoDB  │  │
 (HTTP/HTTPS)     │  │ (t2.micro│  │ (t2.micro│  │
                  │  │ Node.js  │  │  Ubuntu) │  │
                  │  │ + React) │──│  Port    │  │
                  │  │ Port 80/ │  │  27017   │  │
                  │  │ 443/3000 │  │          │  │
                  │  └──────────┘  └──────────┘  │
                  └──────────────────────────────┘
```

| Node    | Name    | OS           | Instance | Software          |
|---------|---------|--------------|----------|-------------------|
| MongoDB | MongoDB | Ubuntu 22.04 | t2.micro | MongoDB 7.0       |
| App     | App     | Ubuntu 22.04 | t2.micro | Node.js 20 + Nginx|

## Prerequisites

1. **AWS Account** with permissions to create VPC, EC2, and Security Groups
2. **EC2 Key Pair** already created in `us-east-1`
3. **S3 Bucket** for Terraform remote state
4. **GitHub repository** with Actions enabled

## Repository Layout

```
your-repo/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions pipeline
└── terraform/
    ├── main.tf                 # VPC, Security Groups, EC2 instances
    ├── variables.tf            # Input variables
    ├── outputs.tf              # Outputs (IPs, URLs, SSH commands)
    └── scripts/
        ├── user_data_mongodb.sh  # MongoDB bootstrap script
        └── user_data_app.sh      # Node.js + Nginx bootstrap script
```

## Step-by-Step Setup

### 1. Add GitHub Secrets

Go to your repo → **Settings → Secrets and variables → Actions** and add:

| Secret Name             | Description                                      |
|-------------------------|--------------------------------------------------|
| `AWS_ACCESS_KEY_ID`     | AWS IAM access key (use a dedicated CI user)     |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key                               |
| `AWS_KEY_PAIR_NAME`     | Name of your EC2 key pair (e.g. `my-key`)        |
| `TF_STATE_BUCKET`       | S3 bucket name for Terraform state               |

### 2. Add GitHub Variables (optional)

Go to **Settings → Secrets and variables → Actions → Variables**:

| Variable Name  | Description                      | Default  |
|----------------|----------------------------------|----------|
| `PROJECT_NAME` | Prefix for all AWS resource names | `myapp` |

### 3. Configure Terraform Backend (S3)

Uncomment and fill in the `backend "s3"` block in `main.tf`:

```hcl
backend "s3" {
  bucket         = "your-terraform-state-bucket"
  key            = "infrastructure/terraform.tfstate"
  region         = "us-east-1"
  encrypt        = true
  dynamodb_table = "terraform-state-lock"  # optional, for state locking
}
```

### 4. Push to `production` branch

```bash
git checkout -b production
git add .
git commit -m "chore: initial infrastructure setup"
git push origin production
```

The pipeline will:
1. **On PR** → Run `terraform plan` and post the output as a PR comment
2. **On merge to `production`** → Run `terraform apply` and display outputs

## Pipeline Flow

```
push / PR to production
        │
        ▼
  terraform-plan
  ├── fmt check
  ├── init
  ├── validate
  └── plan  ──► posts comment on PR
        │
        │ (only on push to production)
        ▼
  terraform-apply
  └── apply saved plan
        │
        ▼
  Outputs printed to job summary
  (App IP, MongoDB IP, SSH commands)
```

## Deploying Your App

After `terraform apply` completes, SSH into the App node and deploy:

```bash
# Get the App node's public IP from Terraform outputs
APP_IP=$(terraform output -raw app_public_ip)

# SSH in
ssh -i your-key.pem ubuntu@$APP_IP

# Clone your app
cd /opt/app
git clone https://github.com/your-org/your-app.git .

# Install dependencies and build React
npm install
cd client && npm install && npm run build && cd ..

# Load the .env (already written by user_data)
# Start with PM2
pm2 start server.js --name app --env production
pm2 save
```

## Destroy Infrastructure

To tear everything down, trigger the workflow manually:

1. Go to **Actions → AWS Infrastructure CI/CD → Run workflow**
2. The `terraform-destroy` job runs (requires `production-destroy` environment approval)

## Security Notes

- MongoDB port `27017` is **only accessible from the App node's security group** — not the public internet
- Restrict `allowed_ssh_cidr` in `variables.tf` to your own IP in production (`x.x.x.x/32`)
- Use an IAM user with least-privilege permissions for the CI/CD keys
- Enable S3 bucket versioning and encryption for Terraform state
