#!/bin/bash
# PostgreSQL Restore Script for Helix

set -e

if [ -z "$1" ]; then
  echo "Usage: ./restore-postgres.sh <backup_file.dump.gz>"
  echo "Example: ./restore-postgres.sh ./backups/postgresql/helix_20240115_020000.dump.gz"
  exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "WARNING: This will DROP and recreate the database!"
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Restore cancelled"
  exit 0
fi

# Decompress if needed
TEMP_DUMP="/tmp/helix_restore.dump"
if [[ $BACKUP_FILE == *.gz ]]; then
  echo "Decompressing backup..."
  gunzip -c "$BACKUP_FILE" > $TEMP_DUMP
else
  cp "$BACKUP_FILE" $TEMP_DUMP
fi

# Stop application
echo "Stopping Next.js application..."
docker-compose stop nextjs

# Drop and recreate database
echo "Dropping existing database..."
docker exec helix-postgres psql -U helix_app -d postgres -c "DROP DATABASE IF EXISTS helix;"
docker exec helix-postgres psql -U helix_app -d postgres -c "CREATE DATABASE helix;"

# Restore from dump
echo "Restoring database..."
docker exec -i helix-postgres pg_restore -U helix_app -d helix -v < $TEMP_DUMP

# Cleanup temp file
rm $TEMP_DUMP

# Restart application
echo "Starting Next.js application..."
docker-compose start nextjs

echo "✅ Restore completed successfully"
