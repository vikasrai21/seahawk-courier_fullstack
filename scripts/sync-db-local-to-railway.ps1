$ErrorActionPreference = 'Stop'

function Get-EnvVarOrThrow {
  param([string]$Name)
  $value = [Environment]::GetEnvironmentVariable($Name)
  if ([string]::IsNullOrWhiteSpace($value)) {
    throw "Missing required environment variable: $Name"
  }
  return $value
}

$localDbUrl = Get-EnvVarOrThrow -Name 'LOCAL_DATABASE_URL'
$railwayDbUrl = Get-EnvVarOrThrow -Name 'RAILWAY_DATABASE_URL'
$tempDir = Join-Path $PSScriptRoot '..\tmp'
$dumpFile = Join-Path $tempDir 'seahawk_local_sync.dump'

if (!(Test-Path $tempDir)) {
  New-Item -ItemType Directory -Path $tempDir | Out-Null
}

Write-Host 'Creating local database dump...'
& pg_dump --no-owner --no-privileges --format=custom --file "$dumpFile" "$localDbUrl"

Write-Host 'Dropping and recreating Railway public schema...'
& psql "$railwayDbUrl" -v ON_ERROR_STOP=1 -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"

Write-Host 'Restoring dump into Railway database...'
& pg_restore --no-owner --no-privileges --clean --if-exists --no-acl --dbname "$railwayDbUrl" "$dumpFile"

Write-Host 'Sync complete: Local database -> Railway database'
