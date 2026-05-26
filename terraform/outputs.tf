output "mongodb_instance_id" {
  description = "EC2 Instance ID of the MongoDB server"
  value       = aws_instance.mongodb.id
}

output "mongodb_public_ip" {
  description = "Public IP address of the MongoDB server (use for SSH)"
  value       = aws_instance.mongodb.public_ip
}

output "mongodb_private_ip" {
  description = "Private IP address of the MongoDB server (used by the app server)"
  value       = aws_instance.mongodb.private_ip
}

output "mongodb_ssh_command" {
  description = "SSH command to connect to the MongoDB server"
  value       = "ssh -i ~/.ssh/${var.key_pair_name}.pem ec2-user@${aws_instance.mongodb.public_ip}"
}

output "mongodb_connection_string" {
  description = "MongoDB connection string for the app server (uses private IP)"
  value       = "mongodb://${var.mongo_username}:${var.mongo_password}@${aws_instance.mongodb.private_ip}:27017/${var.mongo_database}?authSource=${var.mongo_database}"
  sensitive   = true
}

# ─────────────────────────────────────────────────────────────────────────────

output "app_instance_id" {
  description = "EC2 Instance ID of the App server"
  value       = aws_instance.app.id
}

output "app_public_ip" {
  description = "Public IP address of the App server"
  value       = aws_instance.app.public_ip
}

output "app_ssh_command" {
  description = "SSH command to connect to the App server"
  value       = "ssh -i ~/.ssh/${var.key_pair_name}.pem ec2-user@${aws_instance.app.public_ip}"
}

output "app_api_url" {
  description = "URL of the Node.js API"
  value       = "http://${aws_instance.app.public_ip}:5000"
}

output "app_frontend_url" {
  description = "URL of the React frontend (served by nginx on port 80)"
  value       = "http://${aws_instance.app.public_ip}"
}

output "summary" {
  description = "Quick reference summary"
  value = <<-EOT
  ╔══════════════════════════════════════════════════════════╗
  ║          Event Ticketing — AWS Infrastructure            ║
  ╠══════════════════════════════════════════════════════════╣
  ║  MongoDB Server                                          ║
  ║    Public IP  : ${aws_instance.mongodb.public_ip}
  ║    SSH        : ssh -i ~/.ssh/${var.key_pair_name}.pem ec2-user@${aws_instance.mongodb.public_ip}
  ╠══════════════════════════════════════════════════════════╣
  ║  App Server (Node.js + React)                            ║
  ║    Public IP  : ${aws_instance.app.public_ip}
  ║    Frontend   : http://${aws_instance.app.public_ip}
  ║    API        : http://${aws_instance.app.public_ip}:5000
  ║    SSH        : ssh -i ~/.ssh/${var.key_pair_name}.pem ec2-user@${aws_instance.app.public_ip}
  ╚══════════════════════════════════════════════════════════╝
  EOT
}
