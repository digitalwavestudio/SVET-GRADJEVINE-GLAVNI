$env:CLOUDSDK_PYTHON = 'C:\Users\mijor\AppData\Local\Programs\Python\Python311\python.exe'
$env:PATH = "$env:PATH;C:\Users\mijor\AppData\Local\Programs\Python\Python311\Scripts"
$gcloud = 'C:\Users\mijor\AppData\Local\Google Cloud SDK\google-cloud-sdk\bin\gcloud.cmd'

# Authenticate using service account key
& $gcloud auth activate-service-account --key-file='C:\Users\mijor\.gemini\antigravity-ide\scratch\svet-gradevine\firebase-service-account.json'

# Set project
& $gcloud config set project gen-lang-client-0548525213

# Grant IAM roles (single‑line commands)
& $gcloud projects add-iam-policy-binding gen-lang-client-0548525213 --member=serviceAccount:firebase-adminsdk-fbsvc@gen-lang-client-0548525213.iam.gserviceaccount.com --role=roles/cloudbuild.builds.editor
& $gcloud projects add-iam-policy-binding gen-lang-client-0548525213 --member=serviceAccount:firebase-adminsdk-fbsvc@gen-lang-client-0548525213.iam.gserviceaccount.com --role=roles/storage.objectAdmin

# Build and submit via Cloud Build
& $gcloud builds submit --config cloudbuild.yaml

# Deploy to Cloud Run (use same service name as before)
& $gcloud run deploy svet-gra-evine-589710133750 --source . --region us-west1 --allow-unauthenticated
