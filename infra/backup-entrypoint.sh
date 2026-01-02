#!/bin/sh
set -eu

: "${BACKUP_CRON:=0 3 * * *}"

mkdir -p /var/log
: > /var/log/backup.log

echo "${BACKUP_CRON} /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1" > /etc/crontabs/root

crond -f -l 8
