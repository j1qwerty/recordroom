#!/bin/bash
# Starts the legacy CodeIgniter app (jhs_digitization-og-php-app) inside WSL.
# Usage (from Windows):  start-legacy-app.bat
# Usage (inside WSL):    SUDO_PASS=2106 bash scripts/legacy-wsl-start.sh
# WARNING: the sudo password is stored in plain text in start-legacy-app.bat
# by your request. Anyone with the file can read it. Prefer `sudo -v` caching
# or passwordless sudo for service commands if this machine is shared.
set -u

SUDO_PASS="${SUDO_PASS:-2106}"
APP_DIR="/mnt/e/fusion/recordroom/jhs_digitization-og-php-app"
DOC_LINK="/var/www/html/jhs"
PHP_PORT="8000"
DB_USER="jhs_user"
DB_PASS="Jhs12345"
DB_NAME="jhs_digitization_db"
ADMIN_MD5="0192023a7bbd73250516f069df18b500"  # md5('admin123')

say() { echo "[legacy-start] $*"; }

[ -d "$APP_DIR" ] || { say "ERROR: app dir not found: $APP_DIR"; exit 1; }

say "Starting Apache2 + MySQL (sudo)..."
echo "$SUDO_PASS" | sudo -S service apache2 start
echo "$SUDO_PASS" | sudo -S service mysql start
sleep 2
service apache2 status | head -n 2 || true

say "Linking app into Apache docroot ($DOC_LINK)..."
echo "$SUDO_PASS" | sudo -S ln -sfn "$APP_DIR" "$DOC_LINK"
echo "$SUDO_PASS" | sudo -S chown -R www-data:www-data "$DOC_LINK"
echo "$SUDO_PASS" | sudo -S chmod -R 775 "$DOC_LINK/application/cache" "$DOC_LINK/application/logs"
mkdir -p "$APP_DIR/uploads"
echo "$SUDO_PASS" | sudo -S chown -R www-data:www-data "$DOC_LINK/uploads" 2>/dev/null || true
echo "$SUDO_PASS" | sudo -S chmod -R 775 "$DOC_LINK/uploads" 2>/dev/null || true
echo "$SUDO_PASS" | sudo -S a2enmod rewrite >/dev/null
echo "$SUDO_PASS" | sudo -S service apache2 restart
sleep 1

say "Ensuring admin / admin123 login exists..."
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
  -e "UPDATE drm_login SET password='$ADMIN_MD5', role='0' WHERE user_name='admin';" 2>&1 | grep -v "Using a password" || true
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
  -e "INSERT INTO drm_login (user_name, password, role) SELECT 'admin','$ADMIN_MD5','0' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM drm_login WHERE user_name='admin');" 2>&1 | grep -v "Using a password" || true
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
  -e "SELECT login_id, user_name, role FROM drm_login WHERE user_name='admin';" 2>&1 | grep -v "Using a password" || true

say "Starting PHP server on :$PHP_PORT (base_url in config.php)..."
if command -v fuser >/dev/null 2>&1; then
  echo "$SUDO_PASS" | sudo -S fuser -k "$PHP_PORT/tcp" >/dev/null 2>&1 || true
else
  pkill -f "php -S localhost:$PHP_PORT" >/dev/null 2>&1 || true
fi
cd "$APP_DIR"
nohup php -S "localhost:$PHP_PORT" >/tmp/legacy-php-server.log 2>&1 &
sleep 2
curl -s -o /dev/null -w "PHP server HTTP:%{http_code}\n" "http://localhost:$PHP_PORT/" || say "PHP server not responding yet - check /tmp/legacy-php-server.log"
curl -s -o /dev/null -w "Apache /jhs/ HTTP:%{http_code}\n" "http://localhost/jhs/" || true

say "Done."
say "Open:  http://localhost:$PHP_PORT/  (PHP server)  or  http://localhost/jhs/  (Apache)"
say "Login: username=admin  password=admin123"
