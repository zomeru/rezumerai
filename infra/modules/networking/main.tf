# OCI Networking Module for Worker Deployment
# Creates VCN, Subnet, Internet Gateway, Route Table, and Security List

# Virtual Cloud Network (VCN)
resource "oci_core_virtual_network" "worker_vcn" {
  compartment_id = var.compartment_ocid
  cidr_block     = var.vcn_cidr
  display_name   = "${var.project_name}-${var.environment}-vcn"
  dns_label      = "${var.project_name}vcn"

  freeform_tags = var.common_tags
}

# Internet Gateway
resource "oci_core_internet_gateway" "worker_igw" {
  compartment_id = var.compartment_ocid
  display_name   = "${var.project_name}-${var.environment}-igw"
  vcn_id         = oci_core_virtual_network.worker_vcn.id
  enabled        = "true"

  freeform_tags = var.common_tags
}

# Route Table for public subnet (directs traffic to Internet Gateway)
resource "oci_core_route_table" "worker_public_rt" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_virtual_network.worker_vcn.id
  display_name   = "${var.project_name}-${var.environment}-public-rt"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.worker_igw.id
  }

  freeform_tags = var.common_tags
}

# Security List for worker instance
resource "oci_core_security_list" "worker_security_list" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_virtual_network.worker_vcn.id
  display_name   = "${var.project_name}-${var.environment}-worker-sg"

  # Ingress: Allow SSH (port 22) from anywhere
  ingress_security_rules {
    protocol    = "6"  # TCP
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"
    description = "SSH access"

    tcp_options {
      min = 22
      max = 22
    }
  }

  # Ingress: Allow all ICMP (for ping diagnostics)
  ingress_security_rules {
    protocol    = "1"  # ICMP
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"
    description = "ICMP for diagnostics"

  }

  # Egress: Allow all outbound traffic
  egress_security_rules {
    protocol    = "all"
    destination = "0.0.0.0/0"
    destination_type = "CIDR_BLOCK"
    description = "Allow all outbound traffic"
  }

  freeform_tags = var.common_tags
}

# Public Subnet
resource "oci_core_subnet" "worker" {
  compartment_id      = var.compartment_ocid
  vcn_id              = oci_core_virtual_network.worker_vcn.id
  cidr_block          = cidrsubnet(var.vcn_cidr, 8, 0)
  display_name        = "${var.project_name}-${var.environment}-public-subnet"
  dns_label           = "${var.project_name}sn"
  security_list_ids   = [oci_core_security_list.worker_security_list.id]
  route_table_id      = oci_core_route_table.worker_public_rt.id
  prohibit_public_ip_on_vnic = false

  freeform_tags = var.common_tags
}
