# OCI Infrastructure Variables

variable "region" {
  type        = string
  description = "OCI region (e.g., us-ashburn-1 for US East Ashburn)"
  default     = "us-ashburn-1"
}

variable "environment" {
  type        = string
  description = "Environment name"
  default     = "production"
}

variable "project_name" {
  type        = string
  description = "Project name for resource naming"
  default     = "rezumerai"
}

variable "tenancy_ocid" {
  type        = string
  description = "OCI Tenancy OCID"
  sensitive   = true
}

variable "user_ocid" {
  type        = string
  description = "OCI User OCID"
  sensitive   = true
}

variable "fingerprint" {
  type        = string
  description = "API Key Fingerprint"
  sensitive   = true
}

variable "private_key_path" {
  type        = string
  description = "Path to OCI API Private Key"
  sensitive   = true
}

variable "compartment_ocid" {
  type        = string
  description = "Compartment OCID for resources"
  sensitive   = false
}

variable "availability_domain" {
  type        = string
  description = "Availability Domain for compute instance"
}

variable "ssh_public_key" {
  type        = string
  description = "SSH public key for compute instance access"
  sensitive   = false
}

variable "ssh_private_key_path" {
  type        = string
  description = "Path to SSH private key for GitHub Actions deployment"
  sensitive   = true
}

variable "database_url" {
  type        = string
  description = "PostgreSQL connection string"
  sensitive   = true
}

variable "openrouter_api_key" {
  type        = string
  description = "OpenRouter API Key"
  sensitive   = true
}

variable "vcn_cidr" {
  type        = string
  description = "CIDR block for the VCN"
  default     = "10.0.0.0/16"
}
