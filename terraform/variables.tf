variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"   # us-east-1 has the widest free-tier coverage
}

variable "project_name" {
  description = "Name prefix for all resources"
  type        = string
  default     = "event-ticketing"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "development"
}

variable "key_pair_name" {
  description = "Name of the existing AWS EC2 Key Pair for SSH access (create one in EC2 → Key Pairs)"
  type        = string
  # No default — must be supplied by the user
}

# ─── MongoDB variables ────────────────────────────────────────────────────────

variable "mongo_username" {
  description = "MongoDB application username"
  type        = string
  default     = "appuser"
}

variable "mongo_password" {
  description = "MongoDB application password"
  type        = string
  sensitive   = true
  default     = "SecurePass2026!"
}

variable "mongo_database" {
  description = "MongoDB database name"
  type        = string
  default     = "event_ticketing"
}

# ─── App variables ────────────────────────────────────────────────────────────

variable "jwt_secret" {
  description = "JWT signing secret for the Node.js backend"
  type        = string
  sensitive   = true
  default     = "ETS_jwt_s3cr3t_IFQ636_2026!"
}

variable "github_repo" {
  description = "GitHub repository URL to clone on the app server (HTTPS format)"
  type        = string
  default     = ""   # e.g. https://github.com/your-username/event-ticketing.git
}
