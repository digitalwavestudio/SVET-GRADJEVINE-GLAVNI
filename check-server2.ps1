$retry = 0;
while($retry -lt 120) {
    $res = (Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue).StatusCode;
    if ($res -eq 200 -or $res -eq 503) {
        Write-Output "SERVER_IS_READY";
        break;
    };
    Start-Sleep -Seconds 5;
    $retry++;
}
