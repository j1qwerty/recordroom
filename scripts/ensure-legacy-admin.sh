#!/bin/bash
# Ensures admin/admin123 exists in the legacy DB. No sudo needed.
set -u
DB_USER="jhs_user"
DB_PASS="Jhs12345"
DB_NAME="jhs_digitization_db"
ADMIN_MD5="0192023a7bbd73250516f069df18b500"  # md5('admin123')
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
  -e "UPDATE drm_login SET password='$ADMIN_MD5', role='0' WHERE user_name='admin';"
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
  -e "INSERT INTO drm_login (user_name, password, role) SELECT 'admin','$ADMIN_MD5','0' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM drm_login WHERE user_name='admin');"
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
  -e "SELECT login_id, user_name, role FROM drm_login WHERE user_name='admin';"
