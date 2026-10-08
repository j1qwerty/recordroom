#!/bin/bash
set -u
BASE="http://127.0.0.1:8080"
echo "--- homepage ---"
curl -s -o /dev/null -w "GET / HTTP:%{http_code}\n" "$BASE/"
curl -s "$BASE/" | grep -o 'Demo login.*' | head -n 1
echo "--- login flow ---"
curl -s -c /tmp/livecj.txt -d "username=admin&password=admin123" -o /dev/null -w "POST login HTTP:%{http_code} redirect:%{redirect_url}\n" "$BASE/user/login_process"
curl -s -b /tmp/livecj.txt -o /dev/null -w "GET dashboard HTTP:%{http_code}\n" "$BASE/user/dashboard"
echo "--- sql dump must not be public ---"
curl -s -o /dev/null -w "GET dump HTTP:%{http_code}\n" "$BASE/jhs_digitization_db%20(1).sql"
echo "--- database ---"
mysql -N -B -e "SELECT COUNT(*) FROM jhs_digitization_db.drm_login WHERE user_name='admin';"
mysql -N -B -e "SELECT COUNT(*) FROM jhs_digitization_db.file_tbl;"
grep -F "base_url" /var/www/legacy-recordroom/html/application/config/config.php | head -n 1
