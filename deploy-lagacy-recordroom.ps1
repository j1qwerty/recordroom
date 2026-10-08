<#
.SYNOPSIS
    Deploys the legacy CodeIgniter record-room app to the Contabo VPS on a bare IP + port.

.DESCRIPTION
    Packages jhs_digitization-og-php-app/, uploads it through the configured SSH
    host, and installs it to /var/www/legacy-recordroom/html on the VPS. The
    remote deploy provisions PHP 8.3-FPM and MySQL 8.0 when missing, creates the
    jhs_digitization_db database and jhs_user login, imports the shipped SQL dump
    on first deploy, resets the admin login, writes an nginx server block on the
    chosen port, opens that port in ufw, and reloads nginx.

    Live URL (after deploy): http://147.93.155.185:8080/  (admin / admin123)

.PARAMETER SkipConfirm
    Deploy without the interactive y/N confirmation.

.PARAMETER SkipVerify
    Skip the HTTP checks after deployment.

.PARAMETER SkipProvision
    Skip apt provisioning (use when PHP-FPM and MySQL are already installed).

.PARAMETER Host_
    SSH host alias. Defaults to "contabo".

.PARAMETER Port
    VPS port nginx listens on. Defaults to 8080.

.PARAMETER ServerIp
    VPS public IP used for base_url and the live URL. Defaults to "147.93.155.185".

.EXAMPLE
    .\deploy-lagacy-recordroom.ps1
    .\deploy-lagacy-recordroom.ps1 -SkipConfirm
    .\deploy-lagacy-recordroom.ps1 -SkipProvision -SkipConfirm
#>
[CmdletBinding()]
param(
    [switch] $SkipConfirm,
    [switch] $SkipVerify,
    [switch] $SkipProvision,
    [string] $Host_ = 'contabo',
    [int] $Port = 8080,
    [string] $ServerIp = '147.93.155.185'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$RepoRoot = $PSScriptRoot
$AppDir = Join-Path $RepoRoot 'jhs_digitization-og-php-app'
$RemoteRoot = '/var/www/legacy-recordroom/html'
$RemoteSite = '/etc/nginx/sites-available/legacy-recordroom'
$PublicUrl = "http://${ServerIp}:${Port}/"
$Archive = Join-Path ([System.IO.Path]::GetTempPath()) ("legacy-recordroom-" + [guid]::NewGuid().ToString('N') + '.tar.gz')
$RemoteArchive = '/tmp/legacy-recordroom-deploy.tar.gz'
$DbName = 'jhs_digitization_db'
$DbUser = 'jhs_user'
$DbPass = 'Jhs12345'

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
        [string] $WorkingDirectory
    )

    $previousEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
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
        $ErrorActionPreference = $previousEap
    }

    if ($output) { $output | ForEach-Object { Write-Host "       $_" -ForegroundColor DarkGray } }
    if ($code -ne 0) { Fail "$What failed (exit $code)" }
    return ($output | Out-String)
}

function Test-CommandExists { param([string] $Name) return [bool](Get-Command $Name -ErrorAction SilentlyContinue) }

try {
    Write-Host ''
    Write-Host '  Legacy record-room deploy (CodeIgniter on bare IP + port)' -ForegroundColor Cyan
    Write-Host '  ----------------------------------------------------------' -ForegroundColor DarkCyan

    Write-Step 'Preflight'
    foreach ($command in @('tar', 'ssh', 'scp')) {
        if (-not (Test-CommandExists $command)) { Fail "Required tool not on PATH: $command" }
    }
    foreach ($file in @('index.php', 'application', 'system')) {
        if (-not (Test-Path (Join-Path $AppDir $file))) { Fail "Legacy app not found at $AppDir ($file missing)" }
    }
    $dumps = @(Get-ChildItem -LiteralPath $AppDir -Filter 'jhs_digitization_db*.sql')
    if ($dumps.Count -eq 0) { Fail "SQL dump not found in $AppDir (jhs_digitization_db*.sql)" }
    Write-Ok 'tar, ssh, and scp are available; legacy app and SQL dump found'

    Invoke-Checked ssh @('-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', $Host_, 'echo ssh-ok') `
        -What "ssh $Host_" | Out-Null
    Write-Ok "$Host_ reachable over SSH"

    Write-Step 'Package legacy app'
    if (Test-Path $Archive) { Remove-Item -LiteralPath $Archive -Force }
    Invoke-Checked tar @('-czf', $Archive, '-C', $RepoRoot, 'jhs_digitization-og-php-app') -What 'tar app' | Out-Null
    Write-Ok ("created {0:N2} MB archive" -f ((Get-Item -LiteralPath $Archive).Length / 1MB))

    if (-not $SkipConfirm) {
        Write-Host ''
        Write-Host "       Deploy legacy app to $PublicUrl?" -ForegroundColor White
        Write-Host "         Local app:   $AppDir" -ForegroundColor Gray
        Write-Host "         Remote root: $RemoteRoot" -ForegroundColor Gray
        if (-not $SkipProvision) {
            Write-Host '         Provision:   apt install PHP 8.3-FPM + MySQL 8.0 when missing' -ForegroundColor Gray
        }
        $answer = Read-Host '       Continue [y/N]'
        if ($answer.Trim() -notin @('y', 'Y', 'yes', 'YES', 'Yes')) {
            Write-Info 'deployment cancelled'
            return
        }
    }

    Write-Step 'Upload archive'
    Invoke-Checked scp @('-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', $Archive, "${Host_}:$RemoteArchive") -What 'scp app archive' | Out-Null

    Write-Step 'Deploy on VPS (provision, extract, database, nginx)'
    $provisionFlag = if ($SkipProvision) { '0' } else { '1' }
    $remoteScript = @'
set -eu
PORT="$1"
SERVER_IP="$2"
PROVISION="$3"
archive=/tmp/legacy-recordroom-deploy.tar.gz
root=/var/www/legacy-recordroom/html
site=/etc/nginx/sites-available/legacy-recordroom
dbname=jhs_digitization_db
dbuser=jhs_user
dbpass=Jhs12345
admin_md5=0192023a7bbd73250516f069df18b500

if [ "$PROVISION" = "1" ]; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq php8.3-fpm php8.3-mysqli php8.3-mbstring php8.3-gd php8.3-curl php8.3-xml php8.3-zip mysql-server rsync curl
fi
command -v php >/dev/null || { echo "php still missing after provisioning"; exit 1; }
command -v mysql >/dev/null || { echo "mysql still missing after provisioning"; exit 1; }

stage=$(mktemp -d /tmp/legacy-recordroom-stage.XXXXXX)
trap 'rm -rf "$stage"; rm -f "$archive"' EXIT
tar -xzf "$archive" -C "$stage"
app="$stage/jhs_digitization-og-php-app"
test -f "$app/index.php"
test -d "$app/application"
test -d "$app/system"
dump=$(ls "$app"/jhs_digitization_db*.sql | head -n 1)
test -s "$dump"

mkdir -p "$root"
rsync -a --delete --chown=www-data:www-data "$app/" "$root/"
mkdir -p "$root/application/cache" "$root/application/logs" "$root/uploads"
chown -R www-data:www-data "$root"
chmod -R 775 "$root/application/cache" "$root/application/logs" "$root/uploads"

mysql -e "CREATE DATABASE IF NOT EXISTS \`$dbname\` CHARACTER SET utf8 COLLATE utf8_general_ci;"
mysql -e "CREATE USER IF NOT EXISTS '$dbuser'@'localhost' IDENTIFIED BY '$dbpass'; GRANT ALL PRIVILEGES ON \`$dbname\`.* TO '$dbuser'@'localhost'; FLUSH PRIVILEGES;"
tables=$(mysql -N -B -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$dbname' AND table_name='drm_login';")
if [ "$tables" -eq 0 ]; then
  mysql "$dbname" < "$dump"
fi
rm -f "$root"/jhs_digitization_db*.sql "$root"/books.sql
mysql "$dbname" -e "UPDATE drm_login SET password='$admin_md5', role='0' WHERE user_name='admin';"
mysql "$dbname" -e "INSERT INTO drm_login (user_name, password, role) SELECT 'admin','$admin_md5','0' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM drm_login WHERE user_name='admin');"

sed -i "s|^\$config\['base_url'\].*|\$config['base_url'] = 'http://$SERVER_IP:$PORT/';|" "$root/application/config/config.php"
grep -Fq "http://$SERVER_IP:$PORT/" "$root/application/config/config.php"

cat > "$site" <<EOF
# Legacy CodeIgniter record-room app on the bare server IP (HTTP only - a bare
# IP cannot get a normal TLS certificate, so logins travel in clear text).
server {
    listen $PORT;
    listen [::]:$PORT;
    server_name _;

    root $root;
    index index.php;

    access_log /var/log/nginx/legacy-recordroom.access.log;
    error_log /var/log/nginx/legacy-recordroom.error.log;

    client_max_body_size 50M;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param CI_ENV production;
    }

    location ~ /\.ht { deny all; }
    location ~* \.sql$ { deny all; }
}
EOF
ln -sfn "$site" /etc/nginx/sites-enabled/legacy-recordroom
nginx -t
systemctl reload nginx

if command -v ufw >/dev/null; then
  ufw allow "$PORT/tcp" >/dev/null
fi

curl -fsS "http://127.0.0.1:$PORT/" | grep -Fq 'JHS Digitization'
curl -fsS "http://127.0.0.1:$PORT/" | grep -Fq 'Demo login'
echo 'legacy app deployed'
'@
    # Send port/ip/provision as argv so the remote quoting stays intact.
    $previousEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $remoteScript | ssh -o BatchMode=yes $Host_ 'bash -s' -- "$Port" "$ServerIp" "$provisionFlag"
        $deployCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $previousEap
    }
    if ($deployCode -ne 0) { Fail "remote legacy deploy failed (exit $deployCode)" }
    Write-Ok "app live at $PublicUrl (nginx 8080 -> php-fpm -> MySQL)"

    if (-not $SkipVerify) {
        Write-Step 'Verify live site'
        $response = (Invoke-Checked ssh @('-o', 'BatchMode=yes', $Host_, "curl -fsS -o /dev/null -w 'home-ok' 'http://127.0.0.1:$Port/'") -What 'homepage HTTP check').Trim()
        if ($response -ne 'home-ok') { Fail 'homepage did not return the expected response' }
        Write-Ok "$PublicUrl returns HTML (via VPS)"

        try {
            $public = Invoke-WebRequest -Uri $PublicUrl -UseBasicParsing -TimeoutSec 20
            if ($public.StatusCode -ne 200) { throw "HTTP $($public.StatusCode)" }
            Write-Ok "$PublicUrl reachable from this machine"
        } catch {
            Write-Warn "public check failed ($($_.Exception.Message)) - allow $Port in the cloud firewall if needed"
        }
    }

    Write-Host ''
    Write-Host '  Deploy succeeded.' -ForegroundColor Green
    Write-Host "   Legacy live  $PublicUrl  (admin / admin123)" -ForegroundColor Gray
    Write-Host "   Web root     $RemoteRoot" -ForegroundColor Gray
} finally {
    if (Test-Path $Archive) { Remove-Item -LiteralPath $Archive -Force -ErrorAction SilentlyContinue }
}
