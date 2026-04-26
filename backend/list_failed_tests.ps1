$json = Get-Content -Raw test-results.json | ConvertFrom-Json
$failedFiles = $json.testResults | Where-Object { $_.status -eq 'failed' } | Select-Object -ExpandProperty name
foreach ($file in $failedFiles) {
    Write-Host $file
}
