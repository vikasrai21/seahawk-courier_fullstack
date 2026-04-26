$excludeDirs = @("node_modules", "dist", "build", ".git", ".next", "coverage", "test-results")
$extensions = @("*.js", "*.jsx", "*.css", "*.json", "*.prisma", "*.md", "*.html", "*.py", "*.sh", "*.ps1")

$stats = @{}
$totalLines = 0
$totalFiles = 0

$files = Get-ChildItem -Path . -Recurse -File -Include $extensions | Where-Object { 
    $fullName = $_.FullName
    $exclude = $false
    foreach ($dir in $excludeDirs) {
        if ($fullName -like "*\$dir\*") { $exclude = $true; break }
    }
    -not $exclude
}

foreach ($file in $files) {
    $ext = $file.Extension.ToLower()
    if (-not $stats.ContainsKey($ext)) {
        $stats[$ext] = @{ count = 0; lines = 0 }
    }
    
    $lines = (Get-Content $file.FullName -ErrorAction SilentlyContinue).Count
    $stats[$ext].count += 1
    $stats[$ext].lines += $lines
    
    $totalFiles += 1
    $totalLines += $lines
}

Write-Host "--- CODEBASE STATS ---"
Write-Host "Total Files: $totalFiles"
Write-Host "Total Lines: $totalLines"
Write-Host ""
Write-Host "Breakdown by Extension:"
$stats.GetEnumerator() | Sort-Object Value.lines -Descending | ForEach-Object {
    $ext = $_.Key
    $count = $_.Value.count
    $lines = $_.Value.lines
    Write-Host "$ext : $count files, $lines lines"
}

Write-Host ""
Write-Host "--- DIRECTORY BREAKDOWN ---"
$topDirs = @("backend\src", "frontend\src", "e2e")
foreach ($dir in $topDirs) {
    if (Test-Path $dir) {
        $dirFiles = Get-ChildItem -Path $dir -Recurse -File -Include $extensions
        $dirLines = 0
        foreach ($f in $dirFiles) { $dirLines += (Get-Content $f.FullName -ErrorAction SilentlyContinue).Count }
        Write-Host "$dir : $($dirFiles.Count) files, $dirLines lines"
    }
}
