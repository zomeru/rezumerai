# Networking Module Outputs

output "vcn_id" {
  description = "OCID of the VCN"
  value       = oci_core_virtual_network.worker_vcn.id
}

output "subnet_id" {
  description = "OCID of the public subnet"
  value       = oci_core_subnet.worker.id
}

output "internet_gateway_id" {
  description = "OCID of the Internet Gateway"
  value       = oci_core_internet_gateway.worker_igw.id
}

output "route_table_id" {
  description = "OCID of the route table"
  value       = oci_core_route_table.worker_public_rt.id
}

output "security_list_id" {
  description = "OCID of the security list"
  value       = oci_core_security_list.worker_security_list.id
}
