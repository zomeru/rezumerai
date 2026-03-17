output "database_secret_arn" {
  value = aws_secretsmanager_secret.database.arn
}

output "better_auth_secret_arn" {
  value = aws_secretsmanager_secret.better_auth_secret.arn
}

output "github_client_id_secret_arn" {
  value = aws_secretsmanager_secret.github_client_id.arn
}

output "github_client_secret_secret_arn" {
  value = aws_secretsmanager_secret.github_client_secret.arn
}

output "openrouter_api_key_secret_arn" {
  value = aws_secretsmanager_secret.openrouter_api_key.arn
}

output "better_auth_url_secret_arn" {
  value = aws_secretsmanager_secret.better_auth_url.arn
}