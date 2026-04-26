$files = Get-ChildItem -Recurse -File -Exclude node_modules,dist,build,.git,.next,coverage,test-results
$totalLines = 0
$extStats = @{}

foreach ($file in $files) {
    $c = (Get-Content $file.FullName -ErrorAction SilentlyContinue).Count
    $totalLines += $c
    $ext = $file.Extension.ToLower()
    if (-not $extStats.ContainsKey($ext)) { $extStats[$ext] = 0 }
    $extStats[$ext] += $c
}

Write-Host "Total Files: $($files.Count)"
Write-Host "Total Lines: $totalLines"
Write-Host "--- Breakdown ---"
$extStats.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object { Write-Host "$($_.Key): $($_.Value) lines" }
