$files = Get-ChildItem -Path src -Recurse -Filter *.tsx
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $newContent = $content -replace '\[#FEBF0D\]', 'secondary' `
                          -replace '\[#F8A010\]', 'secondary-fixed-dim' `
                          -replace '\[#E58900\]', 'secondary' `
                          -replace '\[#ffad3a\]', 'secondary-fixed-dim' `
                          -replace '\[#ffa424\]', 'secondary' `
                          -replace 'rgba\(254\,191\,13\,', 'rgba(var(--color-secondary-rgb),' `
                          -replace 'text-\[\#0d151c\]', '!text-black' `
                          -replace 'text-\[\#0A0F14\]', '!text-black'

    if ($newContent -cne $content) {
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        Write-Host "Updated $($file.FullName)"
    }
}
