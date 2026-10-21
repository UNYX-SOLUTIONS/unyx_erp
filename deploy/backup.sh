#!/usr/bin/env bash
# Backup de la base de datos del ERP Unyx.
# Uso: ./backup.sh [/ruta/de/backups]
# Requiere .env.production (o ENV_FILE) con POSTGRES_USER / POSTGRES_DB.
set -Eeuo pipefail

BACKUP_DIR="${1:-/backups}"
STAMP="$(date +%Y%m%d_%H%M%S)"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-$REPO_DIR/docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-$REPO_DIR/.env.production}"

[ -f "$ENV_FILE" ] || { echo "ERROR: No existe $ENV_FILE." >&2; exit 1; }
[ -f "$COMPOSE_FILE" ] || { echo "ERROR: No existe $COMPOSE_FILE." >&2; exit 1; }

set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

: "${POSTGRES_USER:?Falta POSTGRES_USER en $ENV_FILE}"
: "${POSTGRES_DB:?Falta POSTGRES_DB en $ENV_FILE}"

mkdir -p "$BACKUP_DIR"

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T unyx-postgres \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" \
  > "$BACKUP_DIR/unyx_${STAMP}.sql"

echo "Backup creado: $BACKUP_DIR/unyx_${STAMP}.sql"

find "$BACKUP_DIR" -name 'unyx_*.sql' -mtime +30 -delete
echo "Backups con más de 30 días eliminados."
