#!/usr/bin/env bash
# Restauración de un backup de la base de datos del ERP Unyx.
# Uso: ./restore.sh /backups/unyx_20260930_030000.sql
set -euo pipefail

BACKUP_FILE="${1:?Uso: ./restore.sh /ruta/al/backup.sql}"
COMPOSE_FILE="${COMPOSE_FILE:-/opt/unyx-erp/docker-compose.prod.yml}"

echo "ADVERTENCIA: esto reemplaza el contenido actual de la base de datos."
read -r -p "¿Continuar? (escribe SI): " CONFIRM
if [ "$CONFIRM" != "SI" ]; then
  echo "Cancelado."
  exit 1
fi

cat "$BACKUP_FILE" | docker compose -f "$COMPOSE_FILE" exec -T unyx-postgres \
  psql -U "${POSTGRES_USER:-unyx}" -d "${POSTGRES_DB:-unyx_erp}"

echo "Restauración completada desde: $BACKUP_FILE"
