#!/usr/bin/env bash
# UNYX ERP - despliegue de producción. No realiza git pull ni elimina volúmenes.
# Uso: sudo bash deploy/deploy-prod.sh [--seed] [--demo] [--no-backup] [--skip-build]
set -Eeuo pipefail
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-$REPO_DIR/docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-$REPO_DIR/.env.production}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
TRAEFIK_CONTAINER="${TRAEFIK_CONTAINER:-traefik-traefik-1}"
RUN_SEED=0; RUN_DEMO=0; SKIP_BACKUP=0; SKIP_BUILD=0
log() { printf '\n==> %s\n' "$*"; }
warn() { printf '\nAVISO: %s\n' "$*" >&2; }
fail() { printf '\nERROR: %s\n' "$*" >&2; exit 1; }
trap 'warn "Despliegue interrumpido (línea $LINENO). No se han eliminado volúmenes."' ERR
for arg in "$@"; do
  case "$arg" in
    --seed) RUN_SEED=1 ;;
    --demo) RUN_DEMO=1; RUN_SEED=1 ;;
    --no-backup) SKIP_BACKUP=1 ;;
    --skip-build) SKIP_BUILD=1 ;;
    -h|--help) sed -n '1,3p' "$0"; exit 0 ;;
    *) fail "Opción desconocida: $arg" ;;
  esac
done
cd "$REPO_DIR"
command -v docker >/dev/null || fail "Docker no está instalado."
docker compose version >/dev/null || fail "Docker Compose no está disponible."
docker info >/dev/null || fail "No hay acceso a Docker."
command -v python3 >/dev/null || fail "Python 3 es necesario para validar las reglas de Traefik."
[ -f "$ENV_FILE" ] || fail "No existe $ENV_FILE"
[ -f "$COMPOSE_FILE" ] || fail "No existe $COMPOSE_FILE"
set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a
require_var() { [ -n "${!1:-}" ] || fail "Falta $1 en $ENV_FILE"; }
for key in UNYX_DOMAIN POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB JWT_ACCESS_SECRET JWT_REFRESH_SECRET ALTOSA_API_URL ALTOSA_API_KEY CONTIFICO_API_KEY; do
  require_var "$key"
done
: "${CONTIFICO_API_URL:=https://api.contifico.com/sistema/api/v1}"
export CONTIFICO_API_URL
[ "${#POSTGRES_PASSWORD}" -ge 16 ] || fail "POSTGRES_PASSWORD debe tener al menos 16 caracteres."
[ "${#JWT_ACCESS_SECRET}" -ge 32 ] || fail "JWT_ACCESS_SECRET debe tener al menos 32 caracteres."
[ "${#JWT_REFRESH_SECRET}" -ge 32 ] || fail "JWT_REFRESH_SECRET debe tener al menos 32 caracteres."
[ "$JWT_ACCESS_SECRET" != "$JWT_REFRESH_SECRET" ] || fail "Los JWT secrets deben ser distintos."
[ "${#ALTOSA_API_KEY}" -ge 16 ] || fail "ALTOSA_API_KEY debe tener al menos 16 caracteres."
for key in POSTGRES_PASSWORD JWT_ACCESS_SECRET JWT_REFRESH_SECRET ALTOSA_API_KEY CONTIFICO_API_KEY; do
  value="${!key}"
  case "${value,,}" in
    *cambia*|*change_me*|*placeholder*) fail "$key sigue siendo un placeholder." ;;
  esac
done
case "$UNYX_DOMAIN" in
  *example.com*|*localhost*|*127.0.0.1*|*/*|*:*|*' '*) fail "UNYX_DOMAIN no es un dominio válido." ;;
esac
[[ "$ALTOSA_API_URL" =~ ^https:// ]] || fail "ALTOSA_API_URL debe utilizar HTTPS."
case "$ALTOSA_API_URL" in
  *localhost*|*127.0.0.1*) fail "ALTOSA_API_URL no puede apuntar a localhost." ;;
esac
[ -z "${DATABASE_URL_ALTOSA:-}" ] || warn "DATABASE_URL_ALTOSA configurada: comprueba si el ETL legado la requiere."
if [ "$RUN_SEED" = 1 ]; then
  require_var SEED_ADMIN_PASSWORD
  [ "${#SEED_ADMIN_PASSWORD}" -ge 16 ] || fail "SEED_ADMIN_PASSWORD debe tener al menos 16 caracteres."
  case "${SEED_ADMIN_PASSWORD,,}" in
    *cambia*|*change_me*|*placeholder*|admin123\!*) fail "SEED_ADMIN_PASSWORD no es segura." ;;
  esac
fi
if [ "$RUN_DEMO" = 1 ] && [ "${ALLOW_DEMO_IN_PROD:-false}" != true ]; then
  fail "El catálogo demo está bloqueado en producción."
fi
[ "$(docker inspect "$TRAEFIK_CONTAINER" --format '{{.State.Running}}' 2>/dev/null || true)" = true ] || fail "Traefik no está ejecutándose."
[ "$(docker inspect "$TRAEFIK_CONTAINER" --format '{{.HostConfig.NetworkMode}}')" = host ] || fail "Traefik no está en modo host."
COMPOSE=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")
log "Validando Docker Compose y reglas de Traefik..."
"${COMPOSE[@]}" config --quiet
for service in unyx-postgres unyx-backend unyx-frontend; do
  "${COMPOSE[@]}" config --services | grep -Fxq "$service" || fail "Falta servicio $service."
done
"${COMPOSE[@]}" config --format json | python3 -c '
import json,sys
c=json.load(sys.stdin)
for service, router, expected in [
  ("unyx-backend","unyx-erp-api", "Host(\""+sys.argv[1]+"\") && PathPrefix(\"/api\")"),
  ("unyx-frontend","unyx-erp-web", "Host(\""+sys.argv[1]+"\")")
]:
  rule=c["services"][service]["labels"].get("traefik.http.routers."+router+".rule")
  if rule!=expected:
    sys.exit("Regla Traefik inválida en "+service+": "+repr(rule)+"; se esperaba "+repr(expected))
if "traefik-public" in c.get("networks",{}):
  sys.exit("El Compose todavía contiene traefik-public")
print("Reglas Traefik correctas")
' "$UNYX_DOMAIN" || fail "Corrige las reglas de Traefik antes de desplegar."
log "Dominio: https://$UNYX_DOMAIN"
if command -v curl >/dev/null 2>&1; then
  if curl -fsS --max-time 15 "${ALTOSA_API_URL%/}/health" >/dev/null; then
    log "Altosa API accesible."
    curl -fsS --max-time 15 -H "x-api-key: $ALTOSA_API_KEY" \
      "${ALTOSA_API_URL%/}/api/v1/products?page=1&pageSize=1" >/dev/null || warn "No se pudo verificar el endpoint autenticado de Altosa."
  else
    warn "Altosa API no respondió al endpoint /health."
  fi
fi
DB_CID="$("${COMPOSE[@]}" ps -q unyx-postgres 2>/dev/null || true)"
if [ -z "$DB_CID" ] || [ "$(docker inspect "$DB_CID" --format '{{.State.Running}}')" != true ]; then
  fail "PostgreSQL no está ejecutándose. Verifica el volumen antes del despliegue."
fi
if [ "$SKIP_BACKUP" = 1 ]; then
  warn "Backup omitido expresamente (--no-backup)."
else
  [ -f "$REPO_DIR/deploy/backup.sh" ] || fail "No existe deploy/backup.sh"
  log "Creando respaldo obligatorio de PostgreSQL..."
  ENV_FILE="$ENV_FILE" COMPOSE_FILE="$COMPOSE_FILE" bash "$REPO_DIR/deploy/backup.sh" "$BACKUP_DIR" || fail "Falló el backup."
fi
if [ "$SKIP_BUILD" != 1 ]; then
  log "Construyendo backend y frontend..."
  "${COMPOSE[@]}" build unyx-backend unyx-frontend
fi
log "Actualizando servicios; recreación explícita de backend y frontend..."
"${COMPOSE[@]}" up -d --no-build unyx-postgres
"${COMPOSE[@]}" up -d --no-build --force-recreate unyx-backend unyx-frontend
wait_healthy() {
  local service="$1" cid status state
  cid="$("${COMPOSE[@]}" ps -q "$service" | head -n 1)"
  [ -n "$cid" ] || fail "No existe el contenedor $service."
  for _ in $(seq 1 80); do
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$cid" 2>/dev/null || echo missing)"
    state="$(docker inspect --format '{{.State.Status}}' "$cid" 2>/dev/null || echo missing)"
    if [ "$status" = healthy ]; then log "$service: healthy"; return 0; fi
    if [ "$status" = unhealthy ] || [ "$state" = exited ] || [ "$state" = dead ]; then
      "${COMPOSE[@]}" logs --tail=100 "$service" >&2 || true
      fail "$service no inició correctamente ($state / $status)."
    fi
    sleep 3
  done
  "${COMPOSE[@]}" logs --tail=100 "$service" >&2 || true
  fail "$service no quedó healthy a tiempo."
}
wait_healthy unyx-postgres
wait_healthy unyx-backend
wait_healthy unyx-frontend
if [ "$RUN_SEED" = 1 ]; then
  log "Ejecutando seed base..."
  "${COMPOSE[@]}" exec -T -e NODE_ENV=development -e "SEED_ADMIN_PASSWORD=$SEED_ADMIN_PASSWORD" unyx-backend node dist/prisma/seed.js
fi
if [ "$RUN_DEMO" = 1 ]; then
  "${COMPOSE[@]}" exec -T unyx-backend node dist/scripts/seed-demo.js
fi
if command -v curl >/dev/null 2>&1; then
  log "Comprobando acceso HTTPS público..."
  curl -fsS --retry 3 --retry-delay 2 --max-time 20 "https://$UNYX_DOMAIN/api/v1/health" >/dev/null || fail "Health público no responde."
fi
warn "Si un contenedor antiguo publica el mismo Host, el health público puede responder desde ese contenedor. Revisa los routers duplicados antes de dar por validado el sitio."
cat <<EOF

============================================================
 UNYX ERP - DESPLIEGUE FINALIZADO
 URL: https://$UNYX_DOMAIN
 API: https://$UNYX_DOMAIN/api/v1/health
 Altosa: $ALTOSA_API_URL
 Logs: docker compose --env-file .env.production -f docker-compose.prod.yml logs -f
============================================================
EOF
