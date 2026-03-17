# Networking Module Variables

variable "project_name" {
  type        = string
  description = "Project name for resource naming"
}

variable "environment" {
  type        = string
  description = "Environment name (e.g., production, staging)"
}

variable "compartment_ocid" {
  type        = string
  description = "Compartment OCID for networking resources"
}

variable "vcn_cidr" {
  type        = string
  description = "CIDR block for the VCN"
  default     = "10.0.0.0/16"
}

variable "common_tags" {
  type        = map(string)
  description = "Common tags to apply to all resources"
}
