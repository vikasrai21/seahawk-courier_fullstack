$exts = @('.js', '.jsx', '.css', '.json', '.prisma', '.md')
$results = @()
$totalFiles = 0
$totalLines = 0
foreach ($ext in $exts) {
    $files = Get-ChildItem -Path . -Recurse -File -Include "*$ext" -Exclude node_modules,dist,build,.git,tmp,test-results
    if ($files) {
        $count = $files.Count
        $lines = 0
        foreach ($file in $files) {
            $lines += (Get-Content $file.FullName | Measure-Object -Line).Lines
        }
        $results += [PSCustomObject]@{ Extension = $ext; Files = $count; Lines = $lines }
        $totalFiles += $count
        $totalLines += $lines
    }
}
$results | Sort-Object Lines -Descending | Format-Table -AutoSize
Write-Host "Total Files: $totalFiles"
Write-Host "Total Lines: $totalLines"
