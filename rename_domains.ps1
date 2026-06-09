Get-ChildItem -Path "C:/Users/mijor/.gemini/antigravity-ide/scratch/svet-gradevine" -Recurse -Include *.ts,*.tsx,*.js,*.jsx,*.html,*.md | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $newContent = $content -replace 'svetgradjevine\.rs', 'svetgradjevine.com'
    if ($content -ne $newContent) {
        Set-Content -Path $_.FullName -Value $newContent -Encoding utf8
        Write-Host "Updated $($_.FullName)"
    }
}
