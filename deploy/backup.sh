#!/usr/bin/env bash
# Backup diario de la base de datos del ERP Unyx.
# Uso: ./backup.sh [/ruta/de/backups]
set -euo pipefail

BACKUP_DIR="${1:-/backups}"
STAMP="$(date +%Y%m%d_%H%M%S)"
COMPOSE_FILE="${COMPOSE_FILE:-/opt/unyx-erp/docker-compose.prod.yml}"

mkdir -p "$BACKUP_DIR"

docker compose -f "$COMPOSE_FILE" exec -T unyx-postgres \
  pg_dump -U "${POSTGRES_USER:-unyx}" "${POSTGRES_DB:-unyx_erp}" \
  > "$BACKUP_DIR/unyx_${STAMP}.sql"

echo "Backup creado: $BACKUP_DIR/unyx_${STAMP}.sql"

find "$BACKUP_DIR" -name 'unyx_*.sql' -mtime +30 -delete
echo "Backups con más de 30 días eliminados."
