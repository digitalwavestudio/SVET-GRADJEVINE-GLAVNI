output "deployer_service_account_email" {
  value = google_service_account.deployer.email
}

output "workload_identity_pool_name" {
  value = google_iam_workload_identity_pool.github_pool.name
}
