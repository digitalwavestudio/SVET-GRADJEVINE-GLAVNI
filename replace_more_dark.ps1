$files = Get-ChildItem -Path src -Recurse -Filter *.tsx
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $newContent = $content -replace 'bg-\[#0c1e3d\]', 'bg-surface-container-high' `
                           -replace 'from-\[#10274f\] to-\[#0c1e3d\]', 'from-surface-container-highest to-surface-container-high' `
                           -replace 'bg-\[#050f1a\]', 'bg-surface' `
                           -replace 'text-\[#050f1a\]', 'text-on-secondary' `
                           -replace 'bg-\[#1a2f4c\]', 'bg-surface-container' `
                           -replace 'from-\[#101a26\] to-\[#0b131e\]', 'from-surface-container-high to-surface-container' `
                           -replace 'from-\[#0c1e3d\] to-\[#071329\]', 'from-surface-container-high to-surface'
                           
    if ($content -ne $newContent) {
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        Write-Host "Updated $($file.Name)"
    }
}
