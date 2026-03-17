terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "rezumerai-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type    = string
  default = "production"
}

variable "project_name" {
  type    = string
  default = "rezumerai"
}

module "vpc" {
  source = "./modules/vpc"

  project_name = var.project_name
  environment  = var.environment
  vpc_cidr     = "10.0.0.0/16"
}

module "rds" {
  source = "./modules/rds"

  project_name       = var.project_name
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  db_instance_class  = "db.t3.micro"
  db_name            = "rezumerai"
  db_username        = "rezumerai_admin"
  security_group_id  = module.vpc.database_security_group_id
}

module "secrets" {
  source = "./modules/secrets"

  project_name         = var.project_name
  environment          = var.environment
  db_username          = module.rds.db_username
  db_password          = module.rds.db_password
  db_endpoint          = module.rds.endpoint
  db_name              = var.db_name
  better_auth_secret   = var.better_auth_secret
  better_auth_url      = var.better_auth_url
  github_client_id     = var.github_client_id
  github_client_secret = var.github_client_secret
  openrouter_api_key   = var.openrouter_api_key
}

module "alb" {
  source = "./modules/alb"

  project_name      = var.project_name
  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  security_group_id = module.vpc.alb_security_group_id
  certificate_arn   = var.certificate_arn
}

module "ecs" {
  source = "./modules/ecs"

  project_name                    = var.project_name
  environment                     = var.environment
  vpc_id                          = module.vpc.vpc_id
  public_subnet_ids               = module.vpc.public_subnet_ids
  private_subnet_ids              = module.vpc.private_subnet_ids
  web_security_group_id           = module.vpc.web_security_group_id
  worker_security_group_id        = module.vpc.worker_security_group_id
  alb_target_group_arn            = module.alb.target_group_arn
  alb_listener_arn                = module.alb.listener_arn
  domain_name                     = var.domain_name
  certificate_arn                 = var.certificate_arn
  aws_region                      = var.aws_region
  database_secret_arn             = module.secrets.database_secret_arn
  better_auth_secret_arn          = module.secrets.better_auth_secret_arn
  better_auth_url_secret_arn      = module.secrets.better_auth_url_secret_arn
  github_client_id_secret_arn     = module.secrets.github_client_id_secret_arn
  github_client_secret_secret_arn = module.secrets.github_client_secret_secret_arn
  openrouter_api_key_secret_arn   = module.secrets.openrouter_api_key_secret_arn
}




variable "domain_name" {
  type = string
}

variable "certificate_arn" {
  type = string
}

variable "db_name" {
  type    = string
  default = "rezumerai"
}

variable "better_auth_secret" {
  type      = string
  sensitive = true
}

variable "better_auth_url" {
  type = string
}

variable "github_client_id" {
  type      = string
  sensitive = true
}

variable "github_client_secret" {
  type      = string
  sensitive = true
}

variable "openrouter_api_key" {
  type      = string
  sensitive = true
}

output "alb_dns_name" {
  value = module.alb.dns_name
}

output "database_endpoint" {
  value = module.rds.endpoint
}

output "web_service_url" {
  value = "https://${var.domain_name}"
}