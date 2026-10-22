#Requires -Version 5.1
<#
.SYNOPSIS
    Runs the Vite dev server for the web frontend from the repository root.

.DESCRIPTION
    Picks the frontend directory automatically: `web/` if it exists, otherwise the
    legacy `record-room-frontend/`. Pass -Dir to override.

.EXAMPLE
    .\run-web.ps1

.EXAMPLE
    .\run-web.ps1 -Install
#>
[CmdletBinding()]
param(
    [string] $Dir,
    [switch] $Install
)

$ErrorActionPreference = 'Stop'

if (-not $Dir) {
    $candidates = @('web', 'record-room-frontend')
    $Dir = $candidates |
        ForEach-Object { Join-Path $PSScriptRoot $_ } |
        Where-Object { Test-Path -LiteralPath (Join-Path $_ 'package.json') } |
        Select-Object -First 1
}

if (-not $Dir -or -not (Test-Path -LiteralPath (Join-Path $Dir 'package.json'))) {
    throw "No frontend found. Expected web/package.json or record-room-frontend/package.json under $PSScriptRoot."
}

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    throw 'pnpm is not on PATH. Run: corepack enable; corepack prepare pnpm@10.15.0 --activate'
}

$relative = Resolve-Path -LiteralPath $Dir -Relative
Write-Host "WEB  -> http://localhost:5173" -ForegroundColor Cyan
Write-Host "      $relative" -ForegroundColor DarkGray

Push-Location $Dir
try {
    if ($Install -or -not (Test-Path -LiteralPath 'node_modules')) {
        & pnpm install
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
    & pnpm dev
} finally {
    Pop-Location
}

exit $LASTEXITCODE
