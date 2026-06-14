resource "google_service_account" "deployer" {
  account_id   = "deployer"
  display_name = "Deployment Service Account"
}

// Grant minimal roles to the deployer SA. Adjust roles to principle of least privilege.
resource "google_project_iam_member" "cloudbuild_deployer" {
  project = var.project_id
  role    = "roles/cloudbuild.builds.builder"
  member  = "serviceAccount:${google_service_account.deployer.email}"
}

resource "google_project_iam_member" "storage_uploader" {
  project = var.project_id
  role    = "roles/storage.objectCreator"
  member  = "serviceAccount:${google_service_account.deployer.email}"
}

// Workload Identity Pool + Provider for GitHub Actions (example)
resource "google_iam_workload_identity_pool" "github_pool" {
  provider                 = google
  workload_identity_pool_id = "github-pool"
  display_name             = "GitHub Actions OIDC pool"
}

resource "google_iam_workload_identity_pool_provider" "github_provider" {
  provider                 = google
  workload_identity_pool_id = google_iam_workload_identity_pool.github_pool.workload_identity_pool_id
  provider_id              = "github-provider"
  display_name             = "GitHub Actions provider"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

// Allow principals from the Workload Identity Pool to impersonate the deployer SA
resource "google_service_account_iam_binding" "deployer_wif" {
  service_account_id = google_service_account.deployer.name
  role               = "roles/iam.workloadIdentityUser"
  members = [
    "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github_pool.name}/attribute.repository/${var.github_repo}"
  ]
}
