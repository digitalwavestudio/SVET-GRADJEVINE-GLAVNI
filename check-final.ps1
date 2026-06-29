$retry = 0;
while($retry -lt 120) {
    $res = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -ErrorAction SilentlyContinue;
    if ($res) {
        $html = $res.Content;
        if ($html -match "Sistem se pokre") {
            Write-Output "Still booting ($retry)...";
        } elseif ($html -match 'id="root"') {
            Write-Output "APP_READY_AND_LOADED";
            break;
        } else {
            Write-Output "UNKNOWN HTML: $($html.Substring(0, 50))";
        }
    } else {
        Write-Output "Connection failed ($retry)...";
    }
    Start-Sleep -Seconds 5;
    $retry++;
}
