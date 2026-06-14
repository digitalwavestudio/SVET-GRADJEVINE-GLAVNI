Terraform infra skeleton for migrating local `gcloud_iam_*.ps1` bindings.

Usage (local, safe):

1. Copy `terraform.tfvars.example` to `terraform.tfvars` and fill values.
2. Initialize and inspect plan locally (no apply in this repo by default):

```bash
cd infra
terraform init
terraform plan
```

3. To enable CI-driven apply, configure Workload Identity and use the provided GitHub Actions workflow.

Notes:
- This skeleton intentionally uses minimal roles (`cloudbuild.builds.builder`, `storage.objectCreator`). Adjust roles per least privilege.
- Do NOT commit service account keys. Use Workload Identity Federation (WIF) and CI integration.
