$env:CLOUDSDK_PYTHON = 'C:\Users\mijor\AppData\Local\Programs\Python\Python311\python.exe'
$env:PATH = "$env:PATH;C:\Users\mijor\AppData\Local\Programs\Python\Python311\Scripts"
$gcloud = 'C:\Users\mijor\AppData\Local\Google Cloud SDK\google-cloud-sdk\bin\gcloud.cmd'

# Grant public (allUsers) access to Cloud Run service
& $gcloud run services add-iam-policy-binding svet-gra-evine-589710133750 `
    --member=allUsers --role=roles/run.invoker --region=us-west1
