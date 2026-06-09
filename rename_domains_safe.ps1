# Safe domain rename script
$targetPath = "C:/Users/mijor/.gemini/antigravity-ide/scratch/svet-gradevine"
Get-ChildItem -Path $targetPath -Recurse -Include *.ts,*.tsx,*.js,*.jsx,*.html,*.md -File | ForEach-Object {
    try {
        $content = Get-Content -Path $_.FullName -Raw -ErrorAction Stop
        $newContent = $content -replace 'svetgradjevine\.rs', 'svetgradjevine.com'
        if ($content -ne $newContent) {
            Set-Content -Path $_.FullName -Value $newContent -Encoding utf8 -Force -ErrorAction Stop
            Write-Host "Updated $($_.FullName)"
        }
    } catch {
        Write-Warning "Failed to update $($_.FullName): $($_.Exception.Message)"
    }
}
