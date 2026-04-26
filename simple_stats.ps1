$backendFiles = (Get-ChildItem -Path backend/src -Recurse -File).Count
$frontendFiles = (Get-ChildItem -Path frontend/src -Recurse -File).Count
$e2eFiles = (Get-ChildItem -Path e2e -Recurse -File).Count

$backendLines = 0
Get-ChildItem -Path backend/src -Recurse -File | ForEach-Object { $backendLines += (Get-Content $_.FullName -ErrorAction SilentlyContinue).Count }

$frontendLines = 0
Get-ChildItem -Path frontend/src -Recurse -File | ForEach-Object { $frontendLines += (Get-Content $_.FullName -ErrorAction SilentlyContinue).Count }

Write-Host "Backend Files: $backendFiles"
Write-Host "Backend Lines: $backendLines"
Write-Host "Frontend Files: $frontendFiles"
Write-Host "Frontend Lines: $frontendLines"
Write-Host "E2E Files: $e2eFiles"
