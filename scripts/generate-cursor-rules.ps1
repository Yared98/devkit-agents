param(
  [string]$MapFilePath = "scripts/cursor-agent-map.json",
  [string]$OutputDir = ".cursor/rules"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$map = Get-Content -Raw -Path $MapFilePath | ConvertFrom-Json
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

foreach ($agent in $map.agents) {
  $content = @"
---
description: $($agent.description)
alwaysApply: false
---

# $($agent.rule)

$($agent.body)
"@
  $outPath = Join-Path $OutputDir "$($agent.rule).mdc"
  Set-Content -Path $outPath -Value $content -Encoding UTF8
  Write-Host "Generated $outPath"
}

Write-Host "Done: $($map.agents.Count) rules"
