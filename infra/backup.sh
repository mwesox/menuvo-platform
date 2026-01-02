#!/bin/sh
set -eu

: "${DB_HOST:?DB_HOST is required}"
: "${DB_PORT:=5432}"
: "${DB_NAME:?DB_NAME is required}"
: "${DB_USER:?DB_USER is required}"
: "${DB_PASSWORD:?DB_PASSWORD is required}"
: "${BACKUP_S3_BUCKET:?BACKUP_S3_BUCKET is required}"
: "${BACKUP_S3_PREFIX:=menuvo}"
: "${BACKUP_KEEP_DAYS:=7}"

backup_dir="/backups"
timestamp="$(date -u +"%Y%m%dT%H%M%SZ")"
backup_file="${backup_dir}/menuvo_${timestamp}.dump"

mkdir -p "$backup_dir"

export PGPASSWORD="$DB_PASSWORD"

echo "Starting backup at ${timestamp}..."

pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -Fc -f "$backup_file"

s3_uri="s3://${BACKUP_S3_BUCKET}/${BACKUP_S3_PREFIX}"
if [ -n "${BACKUP_S3_ENDPOINT:-}" ]; then
  aws --endpoint-url "$BACKUP_S3_ENDPOINT" s3 cp "$backup_file" "$s3_uri/"
else
  aws s3 cp "$backup_file" "$s3_uri/"
fi

echo "Backup uploaded to ${s3_uri}/"

find "$backup_dir" -type f -name "*.dump" -mtime "+$BACKUP_KEEP_DAYS" -delete
