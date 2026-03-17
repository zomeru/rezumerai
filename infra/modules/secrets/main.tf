resource "aws_secretsmanager_secret" "database" {
  name = "${var.project_name}-${var.environment}-database-url"

  tags = {
    Name = "${var.project_name}-${var.environment}-database-url"
  }
}

resource "aws_secretsmanager_secret_version" "database" {
  secret_id     = aws_secretsmanager_secret.database.id
  secret_string = "postgresql://${var.db_username}:${var.db_password}@${var.db_endpoint}/${var.db_name}"
}

resource "aws_secretsmanager_secret" "better_auth_secret" {
  name = "${var.project_name}-${var.environment}-better-auth-secret"

  tags = {
    Name = "${var.project_name}-${var.environment}-better-auth-secret"
  }
}

resource "aws_secretsmanager_secret_version" "better_auth_secret" {
  secret_id     = aws_secretsmanager_secret.better_auth_secret.id
  secret_string = var.better_auth_secret
}

resource "aws_secretsmanager_secret" "github_client_id" {
  name = "${var.project_name}-${var.environment}-github-client-id"

  tags = {
    Name = "${var.project_name}-${var.environment}-github-client-id"
  }
}

resource "aws_secretsmanager_secret_version" "github_client_id" {
  secret_id     = aws_secretsmanager_secret.github_client_id.id
  secret_string = var.github_client_id
}

resource "aws_secretsmanager_secret" "github_client_secret" {
  name = "${var.project_name}-${var.environment}-github-client-secret"

  tags = {
    Name = "${var.project_name}-${var.environment}-github-client-secret"
  }
}

resource "aws_secretsmanager_secret_version" "github_client_secret" {
  secret_id     = aws_secretsmanager_secret.github_client_secret.id
  secret_string = var.github_client_secret
}

resource "aws_secretsmanager_secret" "openrouter_api_key" {
  name = "${var.project_name}-${var.environment}-openrouter-api-key"

  tags = {
    Name = "${var.project_name}-${var.environment}-openrouter-api-key"
  }
}

resource "aws_secretsmanager_secret_version" "openrouter_api_key" {
  secret_id     = aws_secretsmanager_secret.openrouter_api_key.id
  secret_string = var.openrouter_api_key
}

resource "aws_secretsmanager_secret" "better_auth_url" {
  name = "${var.project_name}-${var.environment}-better-auth-url"

  tags = {
    Name = "${var.project_name}-${var.environment}-better-auth-url"
  }
}

resource "aws_secretsmanager_secret_version" "better_auth_url" {
  secret_id     = aws_secretsmanager_secret.better_auth_url.id
  secret_string = var.better_auth_url
}