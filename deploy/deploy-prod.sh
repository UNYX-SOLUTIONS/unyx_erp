#!/usr/bin/env bash
# ============================================================================
# Unyx ERP - Despliegue de PRODUCCIÓN en el VPS
#
# Uso:
#   sudo bash deploy/deploy-prod.sh
#   sudo bash deploy/deploy-prod.sh --seed          # roles/permisos/empresa base
#   sudo bash deploy/deploy-prod.sh --seed --demo   # + catálogo demo (solo pruebas)
#   sudo bash deploy/deploy-prod.sh --no-backup
#   sudo bash deploy/deploy-prod.sh --skip-build
#
# Requisitos:
#   - /opt/unyx-erp/.env.production creado desde .env.production.example
#   - Red externa de Traefik: traefik-public
#   - Altosa API accesible desde este VPS (ALTOSA_API_URL)
# ============================================================================
set -Eeuo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-$REPO_DIR/docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-$REPO_DIR/.env.production}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"

RUN_SEED=0
RUN_DEMO=0
SKIP_BACKUP=0
SKIP_BUILD=0

for arg in "$@"; do
  case "$arg" in
    --seed) RUN_SEED=1 ;;
    --demo) RUN_DEMO=1; RUN_SEED=1 ;;
    --no-backup) SKIP_BACKUP=1 ;;
    --skip-build) SKIP_BUILD=1 ;;
    -h|--help)
      sed -n '1,20p' "$0"
      exit 0
      ;;
    *)
      echo "Opción desconocida: $arg" >&2
      exit 1
      ;;
  esac
done

cd "$REPO_DIR"

log() { printf '\n==> %s\n' "$*"; }
warn() { printf '\nAVISO: %s\n' "$*" >&2; }
fail() { printf '\nERROR: %s\n' "$*" >&2; exit 1; }

command -v docker >/dev/null 2>&1 || fail "Docker no está instalado."
docker compose version >/dev/null 2>&1 || fail "Docker Compose no está disponible."
docker info >/dev/null 2>&1 || fail "No hay acceso a Docker. Ejecuta como root o agrega el usuario al grupo docker."

[ -f "$ENV_FILE" ] || fail "No existe $ENV_FILE. Copia .env.production.example y configura los valores reales."
[ -f "$COMPOSE_FILE" ] || fail "No existe $COMPOSE_FILE."

set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

require_var() {
  local key="$1"
  local value="${!1:-}"
  [ -n "$value" ] || fail "Falta $key en $ENV_FILE."
}

require_var UNYX_DOMAIN
require_var POSTGRES_USER
require_var POSTGRES_PASSWORD
require_var POSTGRES_DB
require_var JWT_ACCESS_SECRET
require_var JWT_REFRESH_SECRET
require_var ALTOSA_API_URL
require_var ALTOSA_API_KEY
require_var CONTIFICO_API_KEY

: "${CONTIFICO_API_URL:=https://api.contifico.com/sistema/api/v1}"
export CONTIFICO_API_URL

[ "${#JWT_ACCESS_SECRET}" -ge 16 ] || fail "JWT_ACCESS_SECRET debe tener al menos 16 caracteres."
[ "${#JWT_REFRESH_SECRET}" -ge 16 ] || fail "JWT_REFRESH_SECRET debe tener al menos 16 caracteres."
[ "${#ALTOSA_API_KEY}" -ge 16 ] || fail "ALTOSA_API_KEY debe tener al menos 16 caracteres."

case "$UNYX_DOMAIN" in
  *example.com*|*localhost*|*127.0.0.1*)
    fail "UNYX_DOMAIN sigue siendo un valor de ejemplo ($UNYX_DOMAIN)."
    ;;
esac

case "$POSTGRES_PASSWORD" in
  CAMBIA*|change_me*|*CHANGE_ME*) fail "POSTGRES_PASSWORD sigue siendo un placeholder." ;;
esac
case "$JWT_ACCESS_SECRET" in
  CAMBIA*|change_me*|*CHANGE_ME*) fail "JWT_ACCESS_SECRET sigue siendo un placeholder." ;;
esac
case "$JWT_REFRESH_SECRET" in
  CAMBIA*|change_me*|*CHANGE_ME*) fail "JWT_REFRESH_SECRET sigue siendo un placeholder." ;;
esac
case "$ALTOSA_API_KEY" in
  CAMBIA*|change_me*|*CHANGE_ME*) fail "ALTOSA_API_KEY sigue siendo un placeholder." ;;
esac
case "$CONTIFICO_API_KEY" in
  CAMBIA*|change_me*|*CHANGE_ME*) fail "CONTIFICO_API_KEY sigue siendo un placeholder." ;;
esac

printf '%s' "$ALTOSA_API_URL" | grep -Eq '^https?://' || fail "ALTOSA_API_URL debe ser una URL http(s)."
case "$ALTOSA_API_URL" in
  *localhost*|*127.0.0.1*)
    fail "ALTOSA_API_URL apunta a localhost. En producción usa la URL pública de altosa-api."
    ;;
esac

if [ -z "${DATABASE_URL_ALTOSA:-}" ] || printf '%s' "${DATABASE_URL_ALTOSA:-}" | grep -q 'IP_O_HOST_ALTOSA'; then
  warn "DATABASE_URL_ALTOSA no está configurada o sigue siendo un placeholder."
  warn "No es necesaria para el sync Contifico -> Altosa (usa ALTOSA_API_URL), solo para el ETL legado."
fi

if [ -n "${SEED_ADMIN_PASSWORD:-}" ]; then
  case "$SEED_ADMIN_PASSWORD" in
    CAMBIA*|change_me*|*CHANGE_ME*) fail "SEED_ADMIN_PASSWORD sigue siendo un placeholder." ;;
  esac
fi

docker network inspect traefik-public >/dev/null 2>&1 || fail \
  "No existe la red externa 'traefik-public'. Créala y conecta Traefik antes de desplegar."

log "Archivo de entorno: $ENV_FILE"
log "Dominio público: https://$UNYX_DOMAIN"
log "Altosa API: $ALTOSA_API_URL"

# Altosa es un servicio separado. Validar conectividad antes de desplegar.
if command -v curl >/dev/null 2>&1; then
  ALTOSA_HEALTH_URL="${ALTOSA_API_URL%/}/health"
  if curl -fsS --max-time 15 "$ALTOSA_HEALTH_URL" >/dev/null 2>&1; then
    log "Altosa API responde: $ALTOSA_HEALTH_URL"
    if curl -fsS --max-time 15 -H "x-api-key: $ALTOSA_API_KEY" \
      "${ALTOSA_API_URL%/}/api/v1/products?page=1&pageSize=1" >/dev/null 2>&1; then
      log "Altosa API key OK."
    else
      warn "Altosa API no aceptó ALTOSA_API_KEY."
      warn "Copia la misma ALTOSA_API_KEY de altosa_infrastructure/.env al .env.production."
    fi
  else
    warn "No pude validar $ALTOSA_HEALTH_URL."
    warn "Revisa que altosa-api esté arriba, el DNS/TLS del subdominio y el firewall."
    warn "El ERP puede desplegarse, pero el CRUD/sync hacia Altosa fallará hasta que responda."
  fi
else
  warn "curl no está instalado; no se pudo validar la API de Altosa."
fi

log "Validando docker-compose..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" config >/dev/null

if [ "$SKIP_BACKUP" != 1 ]; then
  if docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps -q unyx-postgres 2>/dev/null | grep -q .; then
    log "Creando backup previo de PostgreSQL..."
    if ! ENV_FILE="$ENV_FILE" COMPOSE_FILE="$COMPOSE_FILE" bash "$REPO_DIR/deploy/backup.sh" "$BACKUP_DIR"; then
      warn "El backup previo falló; se continúa con el despliegue."
    fi
  else
    log "PostgreSQL aún no está corriendo; se omite el backup previo."
  fi
fi

if [ "$SKIP_BUILD" != 1 ]; then
  log "Construyendo imágenes (backend + frontend)..."
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build
fi

log "Levantando servicios..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --remove-orphans

wait_healthy() {
  local service="$1"
  local cid status
  cid="$(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps -q "$service" | head -n 1)"
  [ -n "$cid" ] || fail "No se encontró el contenedor del servicio $service."

  for _ in $(seq 1 80); do
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$cid" 2>/dev/null || echo missing)"
    if [ "$status" = "healthy" ]; then
      log "$service: healthy"
      return 0
    fi
    if [ "$status" = "unhealthy" ]; then
      docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs --tail=120 "$service" >&2 || true
      fail "$service quedó unhealthy."
    fi
    sleep 3
  done

  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs --tail=120 "$service" >&2 || true
  fail "$service no quedó healthy a tiempo."
}

wait_healthy unyx-postgres
wait_healthy unyx-backend
wait_healthy unyx-frontend

if [ "$RUN_SEED" = 1 ]; then
  if [ "${SEED_ADMIN_PASSWORD:-}" = "" ]; then
    warn "SEED_ADMIN_PASSWORD no está definida; el seed usará Admin123! por defecto."
    warn "Defínela en .env.production o en el entorno antes de ejecutar --seed."
  fi
  log "Ejecutando seed base (roles, permisos, empresa)..."
  SEED_ENV=(-e NODE_ENV=development)
  if [ -n "${SEED_ADMIN_PASSWORD:-}" ]; then
    SEED_ENV+=(-e "SEED_ADMIN_PASSWORD=${SEED_ADMIN_PASSWORD}")
  fi
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T "${SEED_ENV[@]}" \
    unyx-backend node dist/prisma/seed.js
fi

if [ "$RUN_DEMO" = 1 ]; then
  log "Ejecutando seed demo de productos (solo para pruebas)..."
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T \
    unyx-backend node dist/scripts/seed-demo.js
fi

if command -v curl >/dev/null 2>&1; then
  if curl -fsS --max-time 20 "https://$UNYX_DOMAIN/api/v1/health" >/dev/null 2>&1; then
    log "Health público OK: https://$UNYX_DOMAIN/api/v1/health"
  else
    warn "El health público aún no responde: https://$UNYX_DOMAIN/api/v1/health"
    warn "Verifica DNS, certificado TLS y los routers de Traefik."
  fi
fi

cat <<EOF

============================================================
 Unyx ERP desplegado en PRODUCCIÓN
------------------------------------------------------------
 URL:       https://$UNYX_DOMAIN
 API:       https://$UNYX_DOMAIN/api/v1/health
 Altosa:    $ALTOSA_API_URL
------------------------------------------------------------
 Logs:      docker compose --env-file .env.production -f docker-compose.prod.yml logs -f
 Reiniciar: docker compose --env-file .env.production -f docker-compose.prod.yml restart
 Backup:    ./deploy/backup.sh
 Sync:      ./deploy/contifico-sync.sh --dry-run --match-by-name
============================================================
EOF
