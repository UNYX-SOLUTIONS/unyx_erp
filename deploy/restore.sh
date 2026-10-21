#!/usr/bin/env bash
# Restauración de un backup de la base de datos del ERP Unyx.
# Uso: ./restore.sh /backups/unyx_20260930_030000.sql
set -Eeuo pipefail

BACKUP_FILE="${1:?Uso: ./restore.sh /ruta/al/backup.sql}"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-$REPO_DIR/docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-$REPO_DIR/.env.production}"

[ -f "$ENV_FILE" ] || { echo "ERROR: No existe $ENV_FILE." >&2; exit 1; }
[ -f "$BACKUP_FILE" ] || { echo "ERROR: No existe el backup $BACKUP_FILE." >&2; exit 1; }

set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

: "${POSTGRES_USER:?Falta POSTGRES_USER en $ENV_FILE}"
: "${POSTGRES_DB:?Falta POSTGRES_DB en $ENV_FILE}"

echo "ADVERTENCIA: esto reemplaza el contenido actual de la base de datos."
read -r -p "¿Continuar? (escribe SI): " CONFIRM
if [ "$CONFIRM" != "SI" ]; then
  echo "Cancelado."
  exit 1
fi

cat "$BACKUP_FILE" | docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T unyx-postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

echo "Restauración completada desde: $BACKUP_FILE"
