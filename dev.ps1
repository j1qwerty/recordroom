#Requires -Version 5.1
<#
.SYNOPSIS
    Starts the API and the web dev server together from the repository root.

.DESCRIPTION
    The API runs in its own PowerShell window (so its log stays readable), the web
    dev server runs in the current window. Closing the current window or pressing
    Ctrl+C stops the frontend only - close the API window too, or the port stays
    bound.

.EXAMPLE
    .\dev.ps1

.EXAMPLE
    .\dev.ps1 -ApiUrl http://localhost:5200
#>
[CmdletBinding()]
param(
    [string] $ApiUrl = 'http://localhost:5199',
    [switch] $Install
)

$ErrorActionPreference = 'Stop'

$runApi = Join-Path $PSScriptRoot 'run-api.ps1'
$runWeb = Join-Path $PSScriptRoot 'run-web.ps1'
foreach ($script in @($runApi, $runWeb)) {
    if (-not (Test-Path -LiteralPath $script)) {
        throw "Missing $script. Run this script from the repository root."
    }
}

$apiProcess = Start-Process -FilePath 'powershell' `
    -ArgumentList @('-NoExit', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $runApi, '-Url', $ApiUrl) `
    -WorkingDirectory $PSScriptRoot `
    -PassThru

Write-Host "API  started in a separate window (pid $($apiProcess.Id))" -ForegroundColor DarkGray
Write-Host "     stop it by closing that window, or: Stop-Process -Id $($apiProcess.Id)" -ForegroundColor DarkGray

# Give Kestrel a moment so the browser's first /api/health call does not race the boot.
Start-Sleep -Seconds 3
try {
    $health = Invoke-RestMethod -Uri "$ApiUrl/api/health" -TimeoutSec 10
    Write-Host "     /api/health: $($health | ConvertTo-Json -Compress)" -ForegroundColor DarkGray
} catch {
    Write-Warning "API not answering on $ApiUrl yet - check the API window (SQL Server reachable?)."
}

$webArgs = @()
if ($Install) { $webArgs += '-Install' }
& $runWeb @webArgs
