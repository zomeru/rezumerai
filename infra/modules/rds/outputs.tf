output "endpoint" {
  value = aws_db_instance.main.endpoint
}

output "connection_string" {
  value     = "postgresql://${var.db_username}:${random_password.db_password.result}@${aws_db_instance.main.endpoint}/${var.db_name}"
  sensitive = true
}

output "db_username" {
  value = var.db_username
}

output "db_password" {
  value     = random_password.db_password.result
  sensitive = true
}