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
PUBLIC_INPUT=""

for arg in "$@"; do
  case "$arg" in
    --no-seed) RUN_SEED=0 ;;
    --*) echo "Opcion desconocida: $arg" >&2; exit 1 ;;
    *) PUBLIC_INPUT="$arg" ;;
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

# Dominio público: 1er argumento (URL o dominio), o PUBLIC_DOMAIN, o el default de test.
DEFAULT_DOMAIN="${PUBLIC_DOMAIN:-altosa-test.erp.unyxsolutions.com}"
PUBLIC_INPUT="${PUBLIC_INPUT:-${PUBLIC_DOMAIN:-}}"
if [ -z "$PUBLIC_INPUT" ]; then
  PUBLIC_URL="https://${DEFAULT_DOMAIN}"
elif printf '%s' "$PUBLIC_INPUT" | grep -Eq '^https?://'; then
  PUBLIC_URL="$PUBLIC_INPUT"
elif printf '%s' "$PUBLIC_INPUT" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$'; then
  PUBLIC_URL="http://${PUBLIC_INPUT}:${FRONTEND_PORT}"
else
  PUBLIC_URL="https://${PUBLIC_INPUT}"
fi
PUBLIC_DOMAIN="$(printf '%s' "$PUBLIC_URL" | sed -E 's#^https?://##; s#/.*$##; s#:[0-9]+$##')"
PUBLIC_ORIGIN="$PUBLIC_URL"

# Red externa donde vive Traefik (se autodetecta y se puede forzar con TRAEFIK_NETWORK).
if [ -z "${TRAEFIK_NETWORK:-}" ]; then
  TRAEFIK_CONTAINER="$(docker ps --format '{{.Names}}' | grep -i traefik | head -n 1 || true)"
  if [ -n "$TRAEFIK_CONTAINER" ]; then
    TRAEFIK_NETWORK="$(docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}|{{end}}' "$TRAEFIK_CONTAINER" | tr '|' '\n' | grep -E 'front|traefik|public' | head -n 1 || true)"
  fi
fi
TRAEFIK_NETWORK="${TRAEFIK_NETWORK:-unyx-workspace-front}"
docker network inspect "$TRAEFIK_NETWORK" >/dev/null 2>&1 || fail "No existe la red de Traefik '$TRAEFIK_NETWORK'. Revisa 'docker network ls' o pasala con TRAEFIK_NETWORK=<red>."

log "Dominio: ${PUBLIC_URL}"
log "Red de Traefik: ${TRAEFIK_NETWORK}"

log "Archivo de entorno (.env.deploy)"
gen_secret() { head -c 48 /dev/urandom | od -An -tx1 | tr -d ' \n'; }
set_env_value() {
  local key="$1" value="$2"
  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    printf '%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
}
if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" <<EOF
POSTGRES_USER=unyx
POSTGRES_PASSWORD=unyx_pass
POSTGRES_DB=unyx_erp
JWT_ACCESS_SECRET=$(gen_secret)
JWT_REFRESH_SECRET=$(gen_secret)
PUBLIC_ORIGIN=${PUBLIC_ORIGIN}
PUBLIC_DOMAIN=${PUBLIC_DOMAIN}
NEXT_PUBLIC_API_URL=
FRONTEND_PORT=${FRONTEND_PORT}
TRAEFIK_NETWORK=${TRAEFIK_NETWORK}
SEED_ADMIN_PASSWORD=Admin123!
EOF
  echo "Creado .env.deploy con secretos nuevos"
else
  set_env_value PUBLIC_ORIGIN "$PUBLIC_ORIGIN"
  set_env_value PUBLIC_DOMAIN "$PUBLIC_DOMAIN"
  set_env_value TRAEFIK_NETWORK "$TRAEFIK_NETWORK"
  set_env_value FRONTEND_PORT "$FRONTEND_PORT"
  echo "Reutilizando .env.deploy existente (dominio y red de Traefik actualizados)"
fi

log "Firewall"
if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q "Status: active"; then
  ufw allow 80/tcp >/dev/null || true
  ufw allow 443/tcp >/dev/null || true
  ufw allow "${FRONTEND_PORT}/tcp" >/dev/null || true
  echo "Puertos 80, 443 y ${FRONTEND_PORT} abiertos en ufw"
else
  echo "ufw no esta activo. Si tu VPS usa firewall del proveedor, asegura 80/tcp y 443/tcp abiertos"
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
 Link:      ${PUBLIC_URL}
 Fallback:  http://<IP-del-VPS>:${FRONTEND_PORT}
 Admin:     admin@unyx.erp / Admin123!
------------------------------------------------------------
 Logs:       docker compose --env-file .env.deploy -f docker-compose.test.yml logs -f
 Reiniciar:  docker compose --env-file .env.deploy -f docker-compose.test.yml restart
 Detener:    docker compose --env-file .env.deploy -f docker-compose.test.yml down
 Actualizar: volver a subir el codigo y ejecutar de nuevo este script
============================================================
EOF
