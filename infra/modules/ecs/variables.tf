variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "public_subnet_ids" {
  type = list(string)
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "web_security_group_id" {
  type = string
}

variable "worker_security_group_id" {
  type = string
}

variable "alb_target_group_arn" {
  type = string
}

variable "alb_listener_arn" {
  type = string
}

variable "domain_name" {
  type = string
}

variable "certificate_arn" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "database_secret_arn" {
  type = string
}

variable "better_auth_secret_arn" {
  type = string
}

variable "github_client_id_secret_arn" {
  type = string
}

variable "github_client_secret_secret_arn" {
  type = string
}

variable "openrouter_api_key_secret_arn" {
  type = string
}

variable "better_auth_url_secret_arn" {
  type = string
}