<#
.SYNOPSIS
    Deploys the modern record-room app (dotnet API + React web) to the Contabo VPS on a bare IP + port.

.DESCRIPTION
    Builds dotnet-api/ with `dotnet publish` and record-room-frontend/ with
    `pnpm build`, uploads the artifacts through the configured SSH host, and
    installs them on the VPS:

      /var/www/recordroom/app   published API (systemd: recordroom-api)
      /var/www/recordroom/html  static web build (served by nginx)
      /etc/recordroom/recordroom.env  server-side config (secrets generated once)
      /var/lib/recordroom/data        app data dir

    The remote deploy enables SQL Server SA when disabled (it ships disabled;
    the password lives in /root/pmwds-secrets/sa_password.txt on the VPS),
    creates the RecordRoom database and recordroom_app login idempotently, and
    writes an nginx server block on the chosen web port that serves the SPA and
    proxies /api/ + /hubs/ to the API on localhost. The API applies EF
    migrations and seeds the demo dataset on first boot.

    Live URL (after deploy): http://147.93.155.185:8083/  (admin / Demo@12345)

.PARAMETER Target
    What to deploy: 'api' (dotnet only), 'web' (React only), or 'both'.
    When omitted, an interactive menu offers 1/2/3.

.PARAMETER SkipConfirm
    Deploy without the interactive y/N confirmation.

.PARAMETER SkipVerify
    Skip the HTTP checks after deployment.

.PARAMETER SkipProvision
    Skip apt provisioning (use when nginx/openssl are already installed).

.PARAMETER Host_
    SSH host alias. Defaults to "contabo".

.PARAMETER WebPort
    VPS port nginx listens on for the web app. Defaults to 8083.

.PARAMETER ApiPort
    Localhost port the API listens on (nginx proxies to it). Defaults to 5006.

.PARAMETER ServerIp
    VPS public IP used for the frontend API base URL and the live URL.
    Defaults to "147.93.155.185".

.EXAMPLE
    .\deploy-recordroom.ps1
    .\deploy-recordroom.ps1 -Target both -SkipConfirm
    .\deploy-recordroom.ps1 -Target api -SkipProvision -SkipConfirm
#>
[CmdletBinding()]
param(
    [string] $Target = '',
    [switch] $SkipConfirm,
    [switch] $SkipVerify,
    [switch] $SkipProvision,
    [string] $Host_ = 'contabo',
    [string] $ServerIp = '147.93.155.185',
    [int] $WebPort = 8083,
    [int] $ApiPort = 5006
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$RepoRoot = $PSScriptRoot
$ApiProject = Join-Path $RepoRoot 'dotnet-api/src/RecordRoom.Api/RecordRoom.Api.csproj'
$WebDir = Join-Path $RepoRoot 'record-room-frontend'
$PublicUrl = "http://${ServerIp}:${WebPort}/"
$ApiHealthUrl = "http://${ServerIp}:${WebPort}/api/health"

$StageDir = Join-Path ([System.IO.Path]::GetTempPath()) ("recordroom-deploy-" + [guid]::NewGuid().ToString('N'))
$ApiArchive = Join-Path $StageDir 'recordroom-api.tar.gz'
$WebArchive = Join-Path $StageDir 'recordroom-web.tar.gz'
$RemoteApiArchive = '/tmp/recordroom-api-deploy.tar.gz'
$RemoteWebArchive = '/tmp/recordroom-web-deploy.tar.gz'

$script:StepNo = 0
$script:Start = Get-Date

function Write-Step {
    param([string] $Text)
    $script:StepNo++
    $elapsed = ((Get-Date) - $script:Start).TotalSeconds
    Write-Host ''
    Write-Host ("  [{0,2}] " -f $script:StepNo) -ForegroundColor DarkGray -NoNewline
    Write-Host $Text -ForegroundColor Cyan -NoNewline
    Write-Host ("  ({0,6:N1}s)" -f $elapsed) -ForegroundColor DarkGray
}

function Write-Ok { param([string] $Text) Write-Host "       OK   $Text" -ForegroundColor Green }
function Write-Info { param([string] $Text) Write-Host "       INFO $Text" -ForegroundColor Gray }
function Write-Warn { param([string] $Text) Write-Host "       WARN $Text" -ForegroundColor Yellow }
function Fail {
    param([string] $Text)
    Write-Host "  FAIL  $Text" -ForegroundColor Red
    throw $Text
}

function Invoke-Checked {
    param(
        [Parameter(Mandatory)] [string] $FilePath,
        [Parameter(Mandatory)] [string[]] $Arguments,
        [Parameter(Mandatory)] [string] $What,
        [string] $WorkingDirectory,
        [hashtable] $Environment
    )

    $previousEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $savedEnv = @{}
        if ($Environment) {
            foreach ($key in $Environment.Keys) {
                $savedEnv[$key] = [System.Environment]::GetEnvironmentVariable($key)
                [System.Environment]::SetEnvironmentVariable($key, $Environment[$key])
            }
        }
        try {
            if ($WorkingDirectory) {
                Push-Location $WorkingDirectory
                try { $output = & $FilePath @Arguments 2>&1 }
                finally { Pop-Location }
            } else {
                $output = & $FilePath @Arguments 2>&1
            }
            $code = $LASTEXITCODE
        } finally {
            if ($Environment) {
                foreach ($key in $Environment.Keys) { [System.Environment]::SetEnvironmentVariable($key, $savedEnv[$key]) }
            }
        }
    } finally {
        $ErrorActionPreference = $previousEap
    }

    if ($output) { $output | ForEach-Object { Write-Host "       $_" -ForegroundColor DarkGray } }
    if ($code -ne 0) { Fail "$What failed (exit $code)" }
    return ($output | Out-String)
}

function Test-CommandExists { param([string] $Name) return [bool](Get-Command $Name -ErrorAction SilentlyContinue) }

try {
    Write-Host ''
    Write-Host '  Modern record-room deploy (dotnet API + React on bare IP + port)' -ForegroundColor Cyan
    Write-Host '  -----------------------------------------------------------------' -ForegroundColor DarkCyan

    # --- target menu: 1 = api only, 2 = web only, 3 = both -----------------
    if ($Target -notin @('api', 'web', 'both')) {
        Write-Host ''
        Write-Host '       What should be deployed?' -ForegroundColor White
        Write-Host '         1  dotnet API only' -ForegroundColor Gray
        Write-Host '         2  web (React) only' -ForegroundColor Gray
        Write-Host '         3  both API + web' -ForegroundColor Gray
        $choice = (Read-Host '       Select [1/2/3]').Trim()
        switch ($choice) {
            '1' { $Target = 'api' }
            '2' { $Target = 'web' }
            '3' { $Target = 'both' }
            default { Fail "unknown choice '$choice' (expected 1, 2 or 3)" }
        }
    }
    $deployApi = $Target -in @('api', 'both')
    $deployWeb = $Target -in @('web', 'both')
    Write-Info "target: $Target (api=$deployApi web=$deployWeb)"

    Write-Step 'Preflight'
    foreach ($command in @('tar', 'ssh', 'scp')) {
        if (-not (Test-CommandExists $command)) { Fail "Required tool not on PATH: $command" }
    }
    if ($deployApi) {
        if (-not (Test-CommandExists 'dotnet')) { Fail 'Required tool not on PATH: dotnet' }
        if (-not (Test-Path $ApiProject)) { Fail "API project not found at $ApiProject" }
    }
    if ($deployWeb) {
        if (-not (Test-CommandExists 'pnpm')) { Fail 'Required tool not on PATH: pnpm' }
        if (-not (Test-Path (Join-Path $WebDir 'package.json'))) { Fail "Web app not found at $WebDir" }
    }
    Write-Ok "tooling present for target '$Target'"

    Invoke-Checked ssh @('-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', $Host_, 'echo ssh-ok') `
        -What "ssh $Host_" | Out-Null
    Write-Ok "$Host_ reachable over SSH"

    New-Item -ItemType Directory -Path $StageDir -Force | Out-Null

    if ($deployApi) {
        Write-Step 'Build + package API (dotnet publish)'
        $publishDir = Join-Path $StageDir 'api-publish'
        Invoke-Checked dotnet @('publish', $ApiProject, '-c', 'Release', '-o', $publishDir) -What 'dotnet publish' | Out-Null
        $dll = Join-Path $publishDir 'RecordRoom.Api.dll'
        if (-not (Test-Path $dll)) { Fail "publish did not produce $dll" }
        Invoke-Checked tar @('-czf', $ApiArchive, '-C', $publishDir, '.') -What 'tar api' | Out-Null
        Write-Ok ("created {0:N2} MB API archive" -f ((Get-Item -LiteralPath $ApiArchive).Length / 1MB))
    }

    if ($deployWeb) {
        Write-Step 'Build + package web (pnpm build against live API origin)'
        Invoke-Checked pnpm @('install') -What 'pnpm install' -WorkingDirectory $WebDir | Out-Null
        $webEnv = @{
            'VITE_API_MODE'     = 'http'
            'VITE_API_BASE_URL' = "http://${ServerIp}:${WebPort}"
        }
        Write-Info "VITE_API_BASE_URL=http://${ServerIp}:${WebPort}"
        Invoke-Checked pnpm @('build') -What 'pnpm build' -WorkingDirectory $WebDir -Environment $webEnv | Out-Null
        $distDir = Join-Path $WebDir 'dist'
        if (-not (Test-Path (Join-Path $distDir 'index.html'))) { Fail "web build did not produce $distDir/index.html" }
        Invoke-Checked tar @('-czf', $WebArchive, '-C', $distDir, '.') -What 'tar web' | Out-Null
        Write-Ok ("created {0:N2} MB web archive" -f ((Get-Item -LiteralPath $WebArchive).Length / 1MB))
    }

    if (-not $SkipConfirm) {
        Write-Host ''
        Write-Host "       Deploy '$Target' to $PublicUrl?" -ForegroundColor White
        if ($deployApi) { Write-Host '         API: dotnet-api/ -> /var/www/recordroom/app (:5006 -> nginx :8083/api)' -ForegroundColor Gray }
        if ($deployWeb) { Write-Host '         Web: record-room-frontend/dist -> /var/www/recordroom/html' -ForegroundColor Gray }
        Write-Host "         Remote DB:  SQL Server RecordRoom + recordroom_app login" -ForegroundColor Gray
        if (-not $SkipProvision) {
            Write-Host '         Provision:  apt install nginx/openssl when missing; SA reset only if disabled' -ForegroundColor Gray
        }
        $answer = Read-Host '       Continue [y/N]'
        if ($answer.Trim() -notin @('y', 'Y', 'yes', 'YES', 'Yes')) {
            Write-Info 'deployment cancelled'
            return
        }
    }

    Write-Step 'Upload archive(s)'
    if ($deployApi) {
        Invoke-Checked scp @('-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', $ApiArchive, "${Host_}:$RemoteApiArchive") -What 'scp api archive' | Out-Null
    }
    if ($deployWeb) {
        Invoke-Checked scp @('-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', $WebArchive, "${Host_}:$RemoteWebArchive") -What 'scp web archive' | Out-Null
    }
    Write-Ok 'upload complete'

    Write-Step "Deploy on VPS ($Target)"
    $provisionFlag = if ($SkipProvision) { '0' } else { '1' }
    $remoteScript = @'
set -eu
MODE="$1"       # api | web | both
WEBPORT="$2"
APIPORT="$3"
SERVER_IP="$4"
PROVISION="$5"
api_archive=/tmp/recordroom-api-deploy.tar.gz
web_archive=/tmp/recordroom-web-deploy.tar.gz
approot=/var/www/recordroom/app
webroot=/var/www/recordroom/html
envfile=/etc/recordroom/recordroom.env
site=/etc/nginx/sites-available/recordroom
dbname=RecordRoom
dblogin=recordroom_app

if [ "$PROVISION" = "1" ]; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  command -v nginx >/dev/null || apt-get install -y -qq nginx curl
  command -v openssl >/dev/null || apt-get install -y -qq openssl curl
  command -v dotnet >/dev/null || { echo "dotnet still missing after provisioning"; exit 1; }
fi
command -v nginx >/dev/null || { echo "nginx missing"; exit 1; }
command -v dotnet >/dev/null || { echo "dotnet missing"; exit 1; }

mkdir -p "$approot" "$webroot" /var/lib/recordroom/data /etc/recordroom

# --- server-side env (secrets generated once, preserved across deploys) ---
# DB passwords are hex + 'Aa9!' so they always satisfy the SQL Server policy
# (upper + lower + digit + symbol, >= 8 chars). Pure-hex failed CHECK_POLICY.
new_db_pw() { printf '%sAa9!' "$(openssl rand -hex 18)"; }
if [ ! -f "$envfile" ]; then
  DB_PW=$(new_db_pw)
  JWT_KEY=$(openssl rand -hex 32)
  {
    echo "ASPNETCORE_ENVIRONMENT=Production"
    echo "ASPNETCORE_URLS=http://127.0.0.1:$APIPORT"
    echo "DOTNET_ENVIRONMENT=Production"
    echo "DB_PASSWORD=$DB_PW"
    echo "ConnectionStrings__Default=Server=127.0.0.1,1433;Database=$dbname;User Id=$dblogin;Password=$DB_PW;TrustServerCertificate=True"
    echo "Jwt__Issuer=record-room-api"
    echo "Jwt__Audience=record-room-frontend"
    echo "Jwt__SigningKey=$JWT_KEY"
    echo "Jwt__ExpiryMinutes=120"
    echo "Database__MigrateOnStartup=true"
    echo "Database__SeedOnStartup=true"
    echo "Redis__ConnectionString="
    echo "Hangfire__Storage=InMemory"
    echo "Hangfire__EnableScheduling=true"
    echo "Swagger__Enabled=true"
    echo "Cors__AllowedOrigins__0=http://$SERVER_IP:$WEBPORT"
  } > "$envfile"
  chmod 640 "$envfile"
  chown root:www-data "$envfile"
  echo "created $envfile"
else
  sed -i "s|^ASPNETCORE_URLS=.*|ASPNETCORE_URLS=http://127.0.0.1:$APIPORT|" "$envfile"
  if grep -q "^Cors__AllowedOrigins__0=" "$envfile"; then
    sed -i "s|^Cors__AllowedOrigins__0=.*|Cors__AllowedOrigins__0=http://$SERVER_IP:$WEBPORT|" "$envfile"
  else
    echo "Cors__AllowedOrigins__0=http://$SERVER_IP:$WEBPORT" >> "$envfile"
  fi
  # Keep the connection string in sync with the stored password (login password
  # is re-applied below, so the two can never drift apart).
  DB_PW=$(sed -n 's/^DB_PASSWORD=//p' "$envfile" | head -n 1)
  # Self-heal: the first deploy wrote a pure-hex password that SQL Server
  # CHECK_POLICY rejects, so the login was never created. Regenerate compliant.
  if ! printf '%s' "$DB_PW" | grep -q '[A-Z]' || ! printf '%s' "$DB_PW" | grep -q '[!]' ; then
    DB_PW=$(new_db_pw)
    grep -v "^DB_PASSWORD=" "$envfile" > "$envfile.tmp"
    echo "DB_PASSWORD=$DB_PW" >> "$envfile.tmp"
    mv "$envfile.tmp" "$envfile"
    echo "regenerated non-compliant DB_PASSWORD"
  fi
  if [ -z "$DB_PW" ]; then echo "DB_PASSWORD missing in $envfile"; exit 1; fi
  grep -v "^ConnectionStrings__Default=" "$envfile" > "$envfile.tmp"
  echo "ConnectionStrings__Default=Server=127.0.0.1,1433;Database=$dbname;User Id=$dblogin;Password=$DB_PW;TrustServerCertificate=True" >> "$envfile.tmp"
  mv "$envfile.tmp" "$envfile"
  chmod 640 "$envfile"
  chown root:www-data "$envfile"
  echo "reused secrets in $envfile"
fi
DB_PW=$(sed -n 's/^DB_PASSWORD=//p' "$envfile" | head -n 1)

if [ "$MODE" = "api" ] || [ "$MODE" = "both" ]; then
  # --- SQL Server: database + login (idempotent) ---
  SA_PW=$(cat /root/pmwds-secrets/sa_password.txt)
  if ! /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$SA_PW" -C -Q "SELECT 1" >/dev/null 2>&1; then
    echo "SA login not usable; resetting SA password (restarts SQL Server)..."
    systemctl stop mssql-server
    export MSSQL_SA_PASSWORD="$SA_PW"
    /opt/mssql/bin/mssql-conf set-sa-password
    unset MSSQL_SA_PASSWORD
    systemctl start mssql-server
    ok=0
    for i in $(seq 1 30); do
      if /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$SA_PW" -C -Q "SELECT 1" >/dev/null 2>&1; then ok=1; break; fi
      sleep 5
    done
    [ "$ok" = "1" ] || { echo "SQL Server did not come back"; exit 1; }
  fi
  cat > /tmp/rr-provision.sql <<EOF
IF DB_ID(N'$dbname') IS NULL CREATE DATABASE [$dbname];
IF NOT EXISTS (SELECT 1 FROM sys.sql_logins WHERE name = N'$dblogin')
  CREATE LOGIN [$dblogin] WITH PASSWORD = N'$DB_PW', CHECK_POLICY = ON;
ELSE
  ALTER LOGIN [$dblogin] WITH PASSWORD = N'$DB_PW';
EOF
  # DB_PASSWORD is hex + Aa9! (no quotes/semicolons), so no quoting hazard below.
  /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$SA_PW" -C -i /tmp/rr-provision.sql
  cat > /tmp/rr-user.sql <<EOF
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'$dblogin')
  CREATE USER [$dblogin] FOR LOGIN [$dblogin];
ALTER ROLE [db_owner] ADD MEMBER [$dblogin];
EOF
  /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$SA_PW" -C -d "$dbname" -i /tmp/rr-user.sql
  rm -f /tmp/rr-provision.sql /tmp/rr-user.sql
  unset SA_PW
  echo "database $dbname + login $dblogin ready"

  # --- API files + service ---
  test -f "$api_archive"
  rm -rf "${approot:?}/"
  mkdir -p "$approot"
  tar -xzf "$api_archive" -C "$approot"
  rm -f "$api_archive"
  test -f "$approot/RecordRoom.Api.dll"
  chown -R www-data:www-data "$approot" /var/lib/recordroom
  cat > /etc/systemd/system/recordroom-api.service <<EOF
[Unit]
Description=Record Room dotnet API (bare IP, port $WEBPORT)
After=network.target mssql-server.service redis-server.service
Wants=mssql-server.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=$approot
EnvironmentFile=$envfile
ExecStart=/usr/bin/dotnet $approot/RecordRoom.Api.dll
Restart=always
RestartSec=10
KillSignal=SIGINT
SyslogIdentifier=recordroom-api

NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true
ReadWritePaths=/var/lib/recordroom

StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
  # $approot/$envfile expand here (unquoted heredoc is intended: no $ in unit file).
  systemctl daemon-reload
  systemctl enable --now recordroom-api
  systemctl restart recordroom-api
  sleep 8
  systemctl is-active --quiet recordroom-api || { journalctl -u recordroom-api --no-pager -n 30; exit 1; }
  # First boot applies migrations + seeds, so allow up to ~2 minutes.
  ok=0
  for i in $(seq 1 24); do
    if curl -fsS "http://127.0.0.1:$APIPORT/api/health" >/dev/null; then ok=1; break; fi
    sleep 5
  done
  [ "$ok" = "1" ] || { journalctl -u recordroom-api --no-pager -n 30; exit 1; }
  curl -fsS "http://127.0.0.1:$APIPORT/api/health"
  echo "api up on 127.0.0.1:$APIPORT"
fi

if [ "$MODE" = "web" ] || [ "$MODE" = "both" ]; then
  test -f "$web_archive"
  rm -rf "${webroot:?}/"
  mkdir -p "$webroot"
  tar -xzf "$web_archive" -C "$webroot"
  rm -f "$web_archive"
  test -f "$webroot/index.html"
  chown -R www-data:www-data "$webroot"

  cat > "$site" <<EOF
# Modern record-room app (React SPA + dotnet API) on the bare server IP.
# HTTP only: a bare IP cannot get a normal TLS certificate, so logins travel
# in clear text. The SPA calls the same origin (/api, /hubs), so no CORS
# preflights are needed in production.
server {
    listen $WEBPORT;
    listen [::]:$WEBPORT;
    server_name _;

    root $webroot;
    index index.html;

    access_log /var/log/nginx/recordroom.access.log;
    error_log /var/log/nginx/recordroom.error.log;

    client_max_body_size 50M;

    location /api/ {
        proxy_pass http://127.0.0.1:$APIPORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    location /hubs/ {
        proxy_pass http://127.0.0.1:$APIPORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    location /swagger/ {
        proxy_pass http://127.0.0.1:$APIPORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable" always;
    }

    location = /index.html {
        add_header Cache-Control "no-store, must-revalidate" always;
    }

    location ~* \.(png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot|svg)$ {
        add_header Cache-Control "public, max-age=2592000" always;
    }
}
EOF
  ln -sfn "$site" /etc/nginx/sites-enabled/recordroom
  nginx -t
  systemctl reload nginx
  if command -v ufw >/dev/null; then
    ufw allow "$WEBPORT/tcp" >/dev/null
  fi
  curl -fsS "http://127.0.0.1:$WEBPORT/" | grep -Fq 'Record Room'
  echo "web up on 127.0.0.1:$WEBPORT"
fi

echo "recordroom $MODE deployed"
'@
    # Send mode/ports/ip/provision as argv so the remote quoting stays intact.
    $previousEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $remoteScript | ssh -o BatchMode=yes $Host_ 'bash -s' -- "$Target" "$WebPort" "$ApiPort" "$ServerIp" "$provisionFlag"
        $deployCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $previousEap
    }
    if ($deployCode -ne 0) { Fail "remote recordroom deploy failed (exit $deployCode)" }
    Write-Ok "app live at $PublicUrl"

    if (-not $SkipVerify) {
        Write-Step 'Verify live site'
        if ($deployApi -or $Target -eq 'both') {
            $health = (Invoke-Checked ssh @('-o', 'BatchMode=yes', $Host_, "curl -fsS 'http://127.0.0.1:$ApiPort/api/health'") -What 'API health check')
            Write-Ok "API /api/health answers (via VPS): $($health.Trim())"
        }
        $homeMark = (Invoke-Checked ssh @('-o', 'BatchMode=yes', $Host_, "curl -fsS 'http://127.0.0.1:$WebPort/' | grep -c 'Record Room'") -What 'web homepage check').Trim()
        if ($homeMark -eq '0') { Fail 'web homepage did not contain the expected markup' }
        Write-Ok "web homepage renders (via VPS)"

        try {
            $public = Invoke-WebRequest -Uri $PublicUrl -UseBasicParsing -TimeoutSec 20
            if ($public.StatusCode -ne 200) { throw "HTTP $($public.StatusCode)" }
            Write-Ok "$PublicUrl reachable from this machine"
        } catch {
            Write-Warn "public check failed ($($_.Exception.Message)) - allow $WebPort in the cloud firewall if needed"
        }

        try {
            $healthPublic = Invoke-WebRequest -Uri $ApiHealthUrl -UseBasicParsing -TimeoutSec 20
            Write-Ok "$ApiHealthUrl answers: $($healthPublic.Content)"
        } catch {
            Write-Warn "public API check failed ($($_.Exception.Message))"
        }

        Write-Step 'Confirm SQL Server database'
        $dbSql = Join-Path $StageDir 'rr-dbcheck.sql'
        Set-Content -LiteralPath $dbSql -Value "SELECT name FROM sys.databases WHERE name='RecordRoom';" -NoNewline
        Invoke-Checked scp @('-o', 'BatchMode=yes', $dbSql, "${Host_}:/tmp/rr-dbcheck.sql") -What 'scp db check sql' | Out-Null
        $dbCheck = (Invoke-Checked ssh @('-o', 'BatchMode=yes', $Host_, 'SA_PW=$(cat /root/pmwds-secrets/sa_password.txt); /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$SA_PW" -C -i /tmp/rr-dbcheck.sql; rm -f /tmp/rr-dbcheck.sql') -What 'RecordRoom database check')
        if ($dbCheck -match 'RecordRoom') {
            Write-Ok 'SQL Server database RecordRoom exists'
        } else {
            Fail 'SQL Server database RecordRoom was not found after deploy'
        }
    }

    Write-Host ''
    Write-Host '  Deploy succeeded.' -ForegroundColor Green
    Write-Host "   Web live   $PublicUrl" -ForegroundColor Gray
    Write-Host "   API health $ApiHealthUrl" -ForegroundColor Gray
    Write-Host '   Demo login admin / Demo@12345' -ForegroundColor Gray
    Write-Host '   Web root   /var/www/recordroom/html' -ForegroundColor Gray
    Write-Host '   API root   /var/www/recordroom/app (service recordroom-api)' -ForegroundColor Gray
} finally {
    if (Test-Path $StageDir) { Remove-Item -LiteralPath $StageDir -Recurse -Force -ErrorAction SilentlyContinue }
}
