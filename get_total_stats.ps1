$files = Get-ChildItem -Recurse -File -Include *.js,*.jsx,*.css,*.json,*.prisma,*.md -Exclude node_modules,dist,build,.git,tmp,test-results
$totalLines = 0
foreach ($file in $files) {
    $totalLines += (Get-Content $file.FullName).Count
}
Write-Host "Total Files: $($files.Count)"
Write-Host "Total Lines: $totalLines"
