#!/bin/bash
# PostgreSQL Backup Script for GENOBRIDGE

set -e

DATE=date +%Y%m%d_%H%M%S
BACKUP_DIR="./backups/postgresql"
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "Starting PostgreSQL backup at $DATE..."

# Full database dump
docker exec GENOBRIDGE-postgres pg_dump -U genobridge_app -F c -b -v GENOBRIDGE > "$BACKUP_DIR/GENOBRIDGE_$DATE.dump"

# Compress
gzip "$BACKUP_DIR/GENOBRIDGE_$DATE.dump"

echo "✅ Backup completed: GENOBRIDGE_$DATE.dump.gz"

# Remove old backups
find $BACKUP_DIR -name "*.dump.gz" -mtime +$RETENTION_DAYS -delete

echo "✅ Cleaned up backups older than $RETENTION_DAYS days"

# Optional: Upload to S3
# Uncomment and configure if using AWS S3
# aws s3 cp "$BACKUP_DIR/GENOBRIDGE_$DATE.dump.gz" s3://GENOBRIDGE-backups/

echo "Backup process completed successfully"
