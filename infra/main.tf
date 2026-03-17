terraform {
  required_version = ">= 1.6.0"

  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 6.0"
    }
  }

  # Default: Local backend (simplest for single-user setups)
  # For OCI Object Storage backend, see backend-oci.tf.example
  backend "local" {
    path = "terraform.tfstate"
  }
}

provider "oci" {
  tenancy_ocid     = var.tenancy_ocid
  user_ocid        = var.user_ocid
  fingerprint      = var.fingerprint
  private_key_path = var.private_key_path
  region           = var.region
}

# Local values
locals {
  common_tags = {
    Name        = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Networking Module
module "networking" {
  source = "./modules/networking"

  project_name     = var.project_name
  environment      = var.environment
  compartment_ocid = var.compartment_ocid
  vcn_cidr         = var.vcn_cidr
  common_tags      = local.common_tags
}

# Get the latest Ubuntu 24.04 ARM64 image compatible with Ampere A1
data "oci_core_images" "worker_image" {
  compartment_id           = var.compartment_ocid
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "24.04"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"

  filter {
    name   = "display_name"
    values = [".*aarch64.*"]
    regex  = true
  }
}

# Select the first image (most recent Ubuntu 24.04 for ARM64)
locals {
  worker_image_id = data.oci_core_images.worker_image.images[0].id
}

# Worker Compute Instance (ARM64 - Ampere A1, Always Free)
resource "oci_core_instance" "worker" {
  availability_domain = var.availability_domain
  compartment_id      = var.compartment_ocid
  display_name        = "${var.project_name}-${var.environment}-worker"
  shape               = "VM.Standard.A1.Flex"

  shape_config {
    ocpus         = 1
    memory_in_gbs = 6
  }

  source_details {
    source_type = "image"
    source_id   = local.worker_image_id
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
    user_data = base64encode(templatefile("${path.module}/cloud-init-worker.yaml", {
      project_name       = var.project_name
      environment        = var.environment
      database_url       = var.database_url
      openrouter_api_key = var.openrouter_api_key
    }))
  }

  create_vnic_details {
    subnet_id                 = module.networking.subnet_id
    display_name              = "${var.project_name}-${var.environment}-worker-vnic"
    assign_public_ip          = true
    assign_private_dns_record = true
    hostname_label            = "${var.project_name}-worker"
  }

  freeform_tags = local.common_tags

  # Preserve boot volume on termination for debugging
  preserve_boot_volume = false
}
