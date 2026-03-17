output "alb_dns_name" {
  value = module.alb.dns_name
}

output "database_endpoint" {
  value = module.rds.endpoint
}

output "web_service_url" {
  value = "https://${var.domain_name}"
}