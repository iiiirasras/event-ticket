variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "mongodb_instance_type" {
  description = "EC2 instance type for the MongoDB node"
  type        = string
  default     = "t2.micro"
}

variable "app_instance_type" {
  description = "EC2 instance type for the App node (Node.js + React)"
  type        = string
  default     = "t2.micro"
}

variable "ami_id" {
  description = "Ubuntu 22.04 LTS AMI ID for us-east-1"
  type        = string
  default     = "ami-0c7217cdde317cfec" # Ubuntu 22.04 LTS (us-east-1)
}

variable "key_pair_name" {
  description = "Name of the existing AWS EC2 key pair for SSH access"
  type        = string
}

variable "project_name" {
  description = "Project name used as a prefix for all resource names"
  type        = string
  default     = "myapp"
}

variable "environment" {
  description = "Deployment environment (e.g. production, staging)"
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for the public subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed to SSH into the EC2 instances (restrict in production)"
  type        = string
  default     = "0.0.0.0/0"
}

variable "mongodb_port" {
  description = "Port MongoDB listens on"
  type        = number
  default     = 27017
}

variable "app_port" {
  description = "Port the Node.js app listens on"
  type        = number
  default     = 3000
}
