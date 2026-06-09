# Disk usage report
$topDirs = Get-ChildItem C:\ -Directory -ErrorAction SilentlyContinue |
    ForEach-Object {
        $size = (Get-ChildItem $_.FullName -Recurse -File -ErrorAction SilentlyContinue |
                 Measure-Object -Property Length -Sum).Sum
        [PSCustomObject]@{
            Path = $_.FullName
            SizeGB = [math]::Round($size/1GB,2)
        }
    } |
    Sort-Object SizeGB -Descending |
    Select-Object -First 20

$topFiles = Get-ChildItem C:\ -Recurse -File -ErrorAction SilentlyContinue |
    Sort-Object Length -Descending |
    Select-Object -First 20

$report = "Top 20 directories by size (GB):`n"
foreach ($d in $topDirs) {
    $report += "$($d.Path) : $($d.SizeGB) GB`n"
}
$report += "`nTop 20 largest files (GB):`n"
foreach ($f in $topFiles) {
    $gb = [math]::Round($f.Length/1GB,2)
    $report += "$($f.FullName) : $gb GB`n"
}
$report | Set-Content -Path "C:\Users\mijor\.gemini\antigravity-ide\scratch\svet-gradevine\disk_report.txt" -Encoding utf8
