param(
  [string]$SourceRepoPath = ".tmp/antigravity-awesome-skills",
  [string]$MapFilePath = "scripts/antigravity-skill-map.json",
  [ValidateSet("Agents", "Github", "Both")]
  [string]$TargetScope = "Both",
  [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-TargetPaths {
  param([string]$Scope)

  $paths = @()
  if ($Scope -eq "Agents" -or $Scope -eq "Both") {
    $paths += ".agents/skills"
  }
  if ($Scope -eq "Github" -or $Scope -eq "Both") {
    $paths += ".github/skills"
  }

  return $paths
}

function New-DirectoryIfMissing {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path | Out-Null
  }
}

function Copy-Skill {
  param(
    [string]$SkillName,
    [string]$SourceSkillsRoot,
    [string]$DestinationSkillsRoot,
    [bool]$Overwrite
  )

  $source = Join-Path $SourceSkillsRoot $SkillName
  $dest = Join-Path $DestinationSkillsRoot $SkillName

  if (-not (Test-Path -LiteralPath $source)) {
    return [pscustomobject]@{
      Skill = $SkillName
      Target = $DestinationSkillsRoot
      Status = "missing-source"
      Detail = "Skill not found in source repository"
    }
  }

  if (Test-Path -LiteralPath $dest) {
    if (-not $Overwrite) {
      return [pscustomobject]@{
        Skill = $SkillName
        Target = $DestinationSkillsRoot
        Status = "skipped-existing"
        Detail = "Use -Force to overwrite"
      }
    }

    Remove-Item -LiteralPath $dest -Recurse -Force
  }

  Copy-Item -LiteralPath $source -Destination $dest -Recurse

  return [pscustomobject]@{
    Skill = $SkillName
    Target = $DestinationSkillsRoot
    Status = "imported"
    Detail = "OK"
  }
}

if (-not (Test-Path -LiteralPath $MapFilePath)) {
  throw "Map file not found: $MapFilePath"
}

$map = Get-Content -LiteralPath $MapFilePath -Raw | ConvertFrom-Json
$skills = @($map.selectedSkills)
if ($skills.Count -eq 0) {
  throw "Map file has no selectedSkills entries"
}

$sourceSkillsRoot = Join-Path $SourceRepoPath $map.sourceSkillsPath
if (-not (Test-Path -LiteralPath $sourceSkillsRoot)) {
  throw "Source skills path not found: $sourceSkillsRoot"
}

$targetPaths = Resolve-TargetPaths -Scope $TargetScope
$results = @()

foreach ($target in $targetPaths) {
  New-DirectoryIfMissing -Path $target

  foreach ($skill in $skills) {
    $result = Copy-Skill -SkillName $skill -SourceSkillsRoot $sourceSkillsRoot -DestinationSkillsRoot $target -Overwrite:$Force.IsPresent
    $results += $result
  }
}

$summary = $results | Group-Object Status | Sort-Object Name
Write-Host ""
Write-Host "=== Import Summary ==="
foreach ($item in $summary) {
  Write-Host ("{0}: {1}" -f $item.Name, $item.Count)
}

Write-Host ""
Write-Host "=== Details ==="
$results | Sort-Object Target, Skill | Format-Table -AutoSize

Write-Host ""
Write-Host "Agent mapping source:" $MapFilePath
Write-Host "Next step: update .github/agents/*.agent.md and .agents/workflows/*.md using workflowMappings + agentMappings."
