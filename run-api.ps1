#Requires -Version 5.1
<#
.SYNOPSIS
    Runs the .NET API from the repository root.

.EXAMPLE
    .\run-api.ps1

.EXAMPLE
    .\run-api.ps1 -Url http://localhost:5200 -NoBuild

.EXAMPLE
    .\run-api.ps1 -NoBuild -Configuration Release
#>
[CmdletBinding()]
param(
    [string] $Url = 'http://localhost:5199',
    [ValidateSet('Debug', 'Release')]
    [string] $Configuration = 'Debug',
    [switch] $NoBuild
)

$ErrorActionPreference = 'Stop'

$project = Join-Path $PSScriptRoot 'dotnet-api/RecordRoom.Api.csproj'
if (-not (Test-Path -LiteralPath $project)) {
    throw "API project not found at $project. Run this script from the repository root."
}

$dotnetArgs = @('run', '--project', $project, '--urls', $Url, '-c', $Configuration)
if ($NoBuild) { $dotnetArgs += '--no-build' }

Write-Host "API  -> $Url" -ForegroundColor Cyan
Write-Host "      dotnet-api/RecordRoom.Api.csproj ($Configuration)" -ForegroundColor DarkGray

Push-Location $PSScriptRoot
try {
    & dotnet @dotnetArgs
} finally {
    Pop-Location
}

exit $LASTEXITCODE
