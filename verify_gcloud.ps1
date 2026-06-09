# Verify Google Cloud SDK installation
$env:CLOUDSDK_PYTHON = "C:\Users\mijor\AppData\Local\Programs\Python\Python311\python.exe"
$env:Path = $env:Path + ";C:\Users\mijor\AppData\Local\Google Cloud SDK\google-cloud-sdk\bin"
& "C:\Users\mijor\AppData\Local\Google Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" version
