$files = Get-ChildItem -Path src -Recurse -Filter *.tsx
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $newContent = $content -replace 'from-\[#101a26\]/95 to-\[#0b131e\]/95', 'from-surface-container-high/95 to-surface-container-lowest/95' -replace 'from-\[#101a26\] to-\[#0b131e\]', 'from-surface-container-high to-surface-container-lowest' -replace 'from-\[#0c1e3d\]/95 to-\[#071329\]/85', 'from-surface-container-high/95 to-surface-container-lowest/85'
    if ($content -ne $newContent) {
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        Write-Host "Updated $($file.Name)"
    }
}
