#!/usr/bin/env bash
# ============================================================================
# Unyx ERP - Despliegue de PRUEBAS en VPS (PostgreSQL + backend + frontend)
#
# Uso:
#   sudo bash deploy/deploy-test.sh                  # detecta la IP publica
#   sudo bash deploy/deploy-test.sh 203.0.113.10     # host que usara el cliente
#   sudo bash deploy/deploy-test.sh 203.0.113.10 --no-seed
#
# - Es idempotente: vuelve a subir el codigo y re-ejecutalo para actualizar.
# - Los datos de PostgreSQL viven en el volumen unyx_test_pgdata.
# - Los secretos se generan una sola vez y quedan en .env.deploy (no versionado).
# ============================================================================

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$REPO_DIR/docker-compose.test.yml"
ENV_FILE="$REPO_DIR/.env.deploy"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
RUN_SEED=1
PUBLIC_HOST=""

for arg in "$@"; do
  case "$arg" in
    --no-seed) RUN_SEED=0 ;;
    --*) echo "Opcion desconocida: $arg" >&2; exit 1 ;;
    *) PUBLIC_HOST="$arg" ;;
  esac
done

cd "$REPO_DIR"

log() { printf '\n==> %s\n' "$*"; }
fail() { printf '\nERROR: %s\n' "$*" >&2; exit 1; }

log "Unyx ERP - despliegue de PRUEBAS"

if [ "$(id -u)" -ne 0 ]; then
  fail "Ejecuta este script como root: sudo bash deploy/deploy-test.sh"
fi

if ! command -v docker >/dev/null 2>&1; then
  log "Docker no esta instalado; instalando desde get.docker.com..."
  if ! command -v curl >/dev/null 2>&1; then
    apt-get update -y && apt-get install -y curl
  fi
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi

docker compose version >/dev/null 2>&1 || fail "Falta el plugin 'docker compose'. Instalalo y vuelve a ejecutar."

if [ -z "$PUBLIC_HOST" ]; then
  log "Detectando IP publica del VPS..."
  PUBLIC_HOST="$(curl -fsS --max-time 8 https://ifconfig.me || true)"
  if [ -z "$PUBLIC_HOST" ]; then
    PUBLIC_HOST="$(hostname -I | awk '{print $1}')"
  fi
fi
PUBLIC_ORIGIN="http://${PUBLIC_HOST}:${FRONTEND_PORT}"

log "Archivo de entorno (.env.deploy)"
gen_secret() { head -c 48 /dev/urandom | od -An -tx1 | tr -d ' \n'; }
if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" <<EOF
POSTGRES_USER=unyx
POSTGRES_PASSWORD=unyx_pass
POSTGRES_DB=unyx_erp
JWT_ACCESS_SECRET=$(gen_secret)
JWT_REFRESH_SECRET=$(gen_secret)
PUBLIC_ORIGIN=${PUBLIC_ORIGIN}
NEXT_PUBLIC_API_URL=
FRONTEND_PORT=${FRONTEND_PORT}
SEED_ADMIN_PASSWORD=Admin123!
EOF
  echo "Creado .env.deploy con secretos nuevos"
else
  sed -i "s|^PUBLIC_ORIGIN=.*|PUBLIC_ORIGIN=${PUBLIC_ORIGIN}|" "$ENV_FILE"
  echo "Reutilizando .env.deploy existente (se actualizo PUBLIC_ORIGIN)"
fi

log "Firewall"
if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q "Status: active"; then
  ufw allow "${FRONTEND_PORT}/tcp" >/dev/null || true
  echo "Puerto ${FRONTEND_PORT}/tcp abierto en ufw"
else
  echo "ufw no esta activo. Si tu VPS usa firewall del proveedor, abre el puerto ${FRONTEND_PORT}/tcp"
fi

log "Construyendo imagenes (la primera vez tarda varios minutos)"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build

compose_up() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d || true
}

wait_healthy() {
  local container="$1"
  local status
  for _ in $(seq 1 80); do
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container" 2>/dev/null || echo missing)"
    if [ "$status" = "healthy" ]; then
      return 0
    fi
    if [ "$status" = "unhealthy" ]; then
      echo "--- ultimos logs de $container ---" >&2
      docker logs --tail 80 "$container" >&2 || true
      return 1
    fi
    sleep 3
  done
  echo "--- ultimos logs de $container ---" >&2
  docker logs --tail 80 "$container" >&2 || true
  return 1
}

log "Levantando PostgreSQL"
compose_up
wait_healthy unyx-test-postgres || fail "PostgreSQL no quedo healthy"

log "Levantando backend (aplica migraciones al arrancar)"
compose_up
wait_healthy unyx-test-backend || fail "El backend no quedo healthy"

log "Levantando frontend"
compose_up
wait_healthy unyx-test-frontend || fail "El frontend no quedo healthy"

if [ "$RUN_SEED" = "1" ]; then
  log "Sembrando permisos, roles y admin (idempotente)"
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T -e NODE_ENV=development backend \
    node dist/prisma/seed.js

  log "Sembrando catalogo demo de productos"
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T backend \
    node dist/scripts/seed-demo.js
fi

cat <<EOF

============================================================
 Unyx ERP desplegado - AMBIENTE DE PRUEBAS
------------------------------------------------------------
 Link:    ${PUBLIC_ORIGIN}
 Admin:   admin@unyx.erp / Admin123!
------------------------------------------------------------
 Logs:       docker compose --env-file .env.deploy -f docker-compose.test.yml logs -f
 Reiniciar:  docker compose --env-file .env.deploy -f docker-compose.test.yml restart
 Detener:    docker compose --env-file .env.deploy -f docker-compose.test.yml down
 Actualizar: volver a subir el codigo y ejecutar de nuevo este script
============================================================
EOF
