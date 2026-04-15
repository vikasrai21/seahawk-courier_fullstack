$ErrorActionPreference = 'Stop'

$base = $env:SEAHAWK_BASE_URL
if ([string]::IsNullOrWhiteSpace($base)) {
  $base = 'http://localhost:3001'
}

function Test-Endpoint {
  param(
    [string]$Path
  )
  $uri = "$base$Path"
  try {
    $response = Invoke-WebRequest -Uri $uri -Method GET -UseBasicParsing -TimeoutSec 20
    if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
      Write-Host "OK  $uri"
      return $true
    }
    Write-Host "FAIL $uri status=$($response.StatusCode)"
    return $false
  } catch {
    Write-Host "FAIL $uri error=$($_.Exception.Message)"
    return $false
  }
}

$results = @(
  Test-Endpoint -Path '/api/health'
  Test-Endpoint -Path '/api/docs/openapi.json'
)

if ($results -contains $false) {
  throw "Smoke API checks failed for $base"
}

Write-Host "Smoke API checks passed for $base"
