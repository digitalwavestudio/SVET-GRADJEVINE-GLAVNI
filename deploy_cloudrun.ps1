powershell -NoProfile -Command {
# Set variables
$gcloudZip = "$env:TEMP\gcloud.zip"
$installDir = "C:/Users/mijor/.gemini/antigravity-ide/gcloud"
$gcloudBin = "$installDir/google-cloud-sdk/bin/gcloud.cmd"

# Expand gcloud SDK if not already extracted
if (-not (Test-Path $installDir)) {
    Write-Host "Extracting gcloud SDK..."
    Expand-Archive -Path $gcloudZip -DestinationPath $installDir -Force
}

# Activate service account
$keyFile = "C:/Users/mijor/.gemini/antigravity-ide/scratch/svet-gradevine/firebase-service-account.json"
& $gcloudBin auth activate-service-account --key-file="$keyFile"

# Set project
& $gcloudBin config set project gen-lang-client-0548525213

# Deploy to Cloud Run using source directory (auto build)
$serviceName = "svet-gra-evine-589710133750-wiw3nb6moa-uw"
& $gcloudBin run deploy $serviceName --source . --region us-west1 --platform managed --allow-unauthenticated
}
