$env:CLOUDSDK_PYTHON = 'C:\Users\mijor\AppData\Local\Programs\Python\Python311\python.exe'
$env:PATH = "$env:PATH;C:\Users\mijor\AppData\Local\Programs\Python\Python311\Scripts"
$gcloud = 'C:\Users\mijor\AppData\Local\Google Cloud SDK\google-cloud-sdk\bin\gcloud.cmd'

# Cloud Build role
& $gcloud --% projects add-iam-policy-binding gen-lang-client-0548525213 \
    --member=serviceAccount:firebase-adminsdk-fbsvc@gen-lang-client-0548525213.iam.gserviceaccount.com \
    --role=roles/cloudbuild.builds.editor

# Storage role (object admin)
& $gcloud --% projects add-iam-policy-binding gen-lang-client-0548525213 \
    --member=serviceAccount:firebase-adminsdk-fbsvc@gen-lang-client-0548525213.iam.gserviceaccount.com \
    --role=roles/storage.objectAdmin
