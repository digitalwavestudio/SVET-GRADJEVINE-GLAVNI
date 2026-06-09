# Automated Cleanup & Ollama Relocation
# Destination for Ollama data
$ollamaDest = 'D:\OllamaData\ollama'

# Log file (in user profile)
$logPath = "$env:USERPROFILE\cleanup_log.txt"
Start-Transcript -Path $logPath -Append -Force

Write-Host "=== Starting cleanup at $(Get-Date) ==="

# 1. Docker prune (remove all unused images, containers, volumes)
Write-Host "Pruning Docker..."
try {
    docker system prune -a -f --volumes
    Write-Host "Docker prune completed."
} catch {
    Write-Warning "Docker prune failed: $_"
}

# 2. Chrome cache cleanup
Write-Host "Cleaning Chrome cache..."
$chromeCache = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache"
if (Test-Path $chromeCache) {
    try {
        Remove-Item -Recurse -Force -LiteralPath $chromeCache\* -ErrorAction Stop
        Write-Host "Chrome cache cleared."
    } catch {
        Write-Warning "Failed to clear Chrome cache: $_"
    }
}

# 3. Windows Update Download folder cleanup
Write-Host "Cleaning Windows Update downloads..."
$wuFolder = 'C:\Windows\SoftwareDistribution\Download'
if (Test-Path $wuFolder) {
    try {
        Remove-Item -Recurse -Force -LiteralPath $wuFolder\* -ErrorAction Stop
        Write-Host "Windows Update download folder cleared."
    } catch {
        Write-Warning "Failed to clean Windows Update folder (requires admin): $_"
    }
}

# 4. Temp folder cleanup
Write-Host "Cleaning temporary files..."
$tempFolder = $env:TEMP
if (Test-Path $tempFolder) {
    try {
        Remove-Item -Recurse -Force -LiteralPath $tempFolder\* -ErrorAction Stop
        Write-Host "Temp folder cleared."
    } catch {
        Write-Warning "Failed to clear Temp folder: $_"
    }
}

# 5. Move Ollama data
Write-Host "Moving Ollama data..."
$ollamaSource = "$env:LOCALAPPDATA\Ollama\lib\ollama"
# Ensure destination exists
if (-not (Test-Path $ollamaDest)) {
    try {
        New-Item -ItemType Directory -Path $ollamaDest -Force | Out-Null
        Write-Host "Created destination folder $ollamaDest"
    } catch {
        Write-Warning "Failed to create destination folder: $_"
    }
}
# Stop Ollama if running
try {
    Get-Process -Name ollama -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "Stopped Ollama process."
} catch {}
# Copy data
if (Test-Path $ollamaSource) {
    try {
        robocopy "$ollamaSource" "$ollamaDest" /MIR /R:2 /W:5 | Out-Null
        Write-Host "Ollama data copied to $ollamaDest"
        # Rename original folder to indicate migration (optional)
        Rename-Item -Path $ollamaSource -NewName "ollama_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')" -Force
        Write-Host "Original Ollama folder renamed as backup."
        # Set environment variable for current session
        $env:OLLAMA_ROOT = $ollamaDest
        Write-Host "OLLAMA_ROOT set for this session."
    } catch {
        Write-Warning "Failed to move Ollama data: $_"
    }
} else {
    Write-Warning "Ollama source folder not found at $ollamaSource"
}

Write-Host "=== Cleanup completed at $(Get-Date) ==="
Stop-Transcript
