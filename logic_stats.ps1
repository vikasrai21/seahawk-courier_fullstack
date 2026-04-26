$files = Get-ChildItem -Recurse -File -Include *.js,*.jsx,*.css,*.prisma,*.md -Exclude node_modules,dist,build,.git
$totalLines = 0
foreach ($file in $files) {
    $totalLines += (Get-Content $file.FullName -ErrorAction SilentlyContinue).Count
}
Write-Host "Total Logic/Docs Lines: $totalLines"
