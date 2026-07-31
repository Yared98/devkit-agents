param(
  [string]$SourceDir = ".github/skills",
  [string]$TargetDir = ".cursor/skills",
  [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $SourceDir)) {
  throw "Source directory not found: $SourceDir"
}

New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null

Get-ChildItem -LiteralPath $SourceDir -Directory | ForEach-Object {
  $dest = Join-Path $TargetDir $_.Name
  if ((Test-Path -LiteralPath $dest) -and -not $Force) {
    Write-Host "Skipped (exists): $($_.Name)"
    return
  }
  Copy-Item -LiteralPath $_.FullName -Destination $dest -Recurse -Force
  Write-Host "Synced: $($_.Name)"
}

Write-Host "Skills synced from $SourceDir to $TargetDir"
