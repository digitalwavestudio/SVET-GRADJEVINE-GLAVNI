$env:CLOUDSDK_PYTHON = 'C:\Users\mijor\AppData\Local\Programs\Python\Python311\python.exe'
$env:PATH = "$env:PATH;C:\Users\mijor\AppData\Local\Programs\Python\Python311\Scripts"
& 'C:\Users\mijor\AppData\Local\Google Cloud SDK\google-cloud-sdk\bin\gcloud.cmd' auth activate-service-account --key-file='C:\Users\mijor\.gemini\antigravity-ide\scratch\svet-gradevine\firebase-service-account.json'
& 'C:\Users\mijor\AppData\Local\Google Cloud SDK\google-cloud-sdk\bin\gcloud.cmd' config set project gen-lang-client-0548525213
& 'C:\Users\mijor\AppData\Local\Google Cloud SDK\google-cloud-sdk\bin\gcloud.cmd' builds submit --config cloudbuild.yaml
