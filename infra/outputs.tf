# OCI Infrastructure Outputs

output "worker_public_ip" {
  description = "Public IP address of the worker compute instance"
  value       = oci_core_instance.worker.public_ip
}

output "ssh_connection_command" {
  description = "SSH command to connect to the worker instance"
  value       = "ssh -i <your-private-key-path> ubuntu@${oci_core_instance.worker.public_ip}"
}

output "instance_ocid" {
  description = "OCID of the worker compute instance"
  value       = oci_core_instance.worker.id
}

output "vcn_id" {
  description = "OCID of the Virtual Cloud Network"
  value       = module.networking.vcn_id
}

output "subnet_id" {
  description = "OCID of the public subnet"
  value       = module.networking.subnet_id
}

output "instance_availability_domain" {
  description = "Availability Domain where the instance is running"
  value       = oci_core_instance.worker.availability_domain
}

output "worker_image_id" {
  description = "OCID of the Ubuntu image used for the worker instance"
  value       = local.worker_image_id
}

output "worker_image_name" {
  description = "Name of the Ubuntu image used (should be ARM64/aarch64)"
  value       = data.oci_core_images.worker_image.images[0].display_name
}
