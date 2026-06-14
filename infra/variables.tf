variable "project_id" {
  type        = string
  description = "GCP project id"
}

variable "project_number" {
  type        = string
  description = "GCP project number (used for Workload Identity provider resource names)"
  default     = ""
}

variable "region" {
  type    = string
  default = "us-central1"
}

variable "github_repo" {
  type        = string
  description = "GitHub repo in the form org/repo for Workload Identity principal binding"
  default     = ""
}
