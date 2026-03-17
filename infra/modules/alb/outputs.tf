output "dns_name" {
  value = aws_lb.main.dns_name
}

output "target_group_arn" {
  value = aws_lb_target_group.web.arn
}

output "listener_arn" {
  value = aws_lb_listener.https.arn
}