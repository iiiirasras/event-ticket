# ─────────────────────────────────────────────────────────────────────────────
# Event Ticketing — AWS Deployment Script
# Run from:  D:\QUT\IFQ636_Software_lifecycle_manaement\IFQ636\assignment_1\terraform\
# Usage:     .\deploy.ps1
# ─────────────────────────────────────────────────────────────────────────────

# ── AWS Credentials ──────────────────────────────────────────────────────────
$env:AWS_ACCESS_KEY_ID     = $env:AWS_ACCESS_KEY_ID  # Set this in your environment or AWS CLI config
# Set via: $env:AWS_SECRET_ACCESS_KEY = "YOUR_SECRET"  (never hardcode credentials)
$env:AWS_SECRET_ACCESS_KEY = $env:AWS_SECRET_ACCESS_KEY
$env:AWS_DEFAULT_REGION    = "us-east-1"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Event Ticketing — AWS Deploy Script    " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# ── Verify AWS CLI is available ───────────────────────────────────────────────
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: AWS CLI not found. Install it first:" -ForegroundColor Red
    Write-Host "  winget install --id Amazon.AWSCLI -e" -ForegroundColor Yellow
    exit 1
}

# ── Verify Terraform is available ────────────────────────────────────────────
if (-not (Get-Command terraform -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Terraform not found. Install it first:" -ForegroundColor Red
    Write-Host "  winget install --id Hashicorp.Terraform -e" -ForegroundColor Yellow
    exit 1
}

# ── Step 1: Create EC2 Key Pair (skip if already exists) ─────────────────────
Write-Host "Step 1: Checking EC2 key pair..." -ForegroundColor Yellow

$sshDir = "$env:USERPROFILE\.ssh"
$pemFile = "$sshDir\event-ticketing-key.pem"

if (-not (Test-Path $sshDir)) {
    New-Item -ItemType Directory -Path $sshDir | Out-Null
}

$keyExists = aws ec2 describe-key-pairs --key-names event-ticketing-key --region us-east-1 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Key pair 'event-ticketing-key' already exists in AWS." -ForegroundColor Green
    if (Test-Path $pemFile) {
        Write-Host "  PEM file found at: $pemFile" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: Key pair exists in AWS but PEM file not found locally." -ForegroundColor Yellow
        Write-Host "  You may need to delete the key pair in AWS Console and re-run this script." -ForegroundColor Yellow
    }
} else {
    Write-Host "  Creating key pair 'event-ticketing-key'..." -ForegroundColor Yellow
    aws ec2 create-key-pair `
        --key-name event-ticketing-key `
        --query "KeyMaterial" `
        --output text `
        --region us-east-1 | Out-File -FilePath $pemFile -Encoding ascii

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Key pair created. PEM saved to: $pemFile" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Failed to create key pair." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# ── Step 2: Terraform Init ────────────────────────────────────────────────────
Write-Host "Step 2: Initialising Terraform..." -ForegroundColor Yellow
terraform init
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: terraform init failed." -ForegroundColor Red
    exit 1
}

Write-Host ""

# ── Step 3: Terraform Plan ────────────────────────────────────────────────────
Write-Host "Step 3: Running terraform plan..." -ForegroundColor Yellow
terraform plan -out=tfplan
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: terraform plan failed." -ForegroundColor Red
    exit 1
}

Write-Host ""

# ── Step 4: Terraform Apply ───────────────────────────────────────────────────
Write-Host "Step 4: Applying infrastructure (this takes 3-5 minutes)..." -ForegroundColor Yellow
terraform apply tfplan
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: terraform apply failed." -ForegroundColor Red
    exit 1
}

Write-Host ""

# ── Step 5: Show Outputs ──────────────────────────────────────────────────────
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  Deployment Complete!                   " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
terraform output summary

Write-Host ""
Write-Host "SSH key location: $pemFile" -ForegroundColor Cyan
Write-Host ""
Write-Host "To destroy all resources later:" -ForegroundColor Yellow
Write-Host "  terraform destroy" -ForegroundColor Yellow
Write-Host ""
