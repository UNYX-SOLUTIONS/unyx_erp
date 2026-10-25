#!/usr/bin/env bash
# ============================================================================
# Unyx ERP - Sincronización Contifico -> DB local -> Altosa
#
# Por seguridad, por defecto hace DRY-RUN. Para aplicar cambios usa --apply.
# Funciona con producción y con el ambiente de pruebas (ver ejemplos).
#
# Uso:
#   ./deploy/contifico-sync.sh --match-by-name                 # dry-run
#   ./deploy/contifico-sync.sh --apply --match-by-name         # aplica
#   ./deploy/contifico-sync.sh --apply --prune                 # reconcilia
#   ./deploy/contifico-sync.sh --apply --only 091003BE
#   ./deploy/contifico-sync.sh --apply --create-missing        # importa TODO (no recomendado)
#   ./deploy/contifico-sync.sh --apply --skip-altosa
#
# Pruebas (docker-compose.test.yml):
#   COMPOSE_FILE="$PWD/docker-compose.test.yml" ENV_FILE="$PWD/.env.deploy" \
#     BACKEND_SERVICE=backend ./deploy/contifico-sync.sh --apply
# ============================================================================
set -Eeuo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-$REPO_DIR/docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-$REPO_DIR/.env.production}"
BACKEND_SERVICE="${BACKEND_SERVICE:-unyx-backend}"

APPLY=0
ARGS=()
ONLY_SKU=""
HAS_PRUNE=0
HAS_CREATE_MISSING=0

log() { printf '\n==> %s\n' "$*"; }
warn() { printf '\nAVISO: %s\n' "$*" >&2; }
fail() { printf '\nERROR: %s\n' "$*" >&2; exit 1; }

while [ "$#" -gt 0 ]; do
  case "$1" in
    --apply) APPLY=1 ;;
    --dry-run) ARGS+=(--dry-run) ;;
    --match-by-name) ARGS+=(--match-by-name) ;;
    --skip-altosa) ARGS+=(--skip-altosa) ;;
    --prune) ARGS+=(--prune); HAS_PRUNE=1 ;;
    --create-missing) ARGS+=(--create-missing); HAS_CREATE_MISSING=1 ;;
    --only)
      ONLY_SKU="${2:-}"
      [ -n "$ONLY_SKU" ] || fail "Falta el SKU después de --only."
      ARGS+=(--only "$ONLY_SKU")
      shift
      ;;
    -h|--help)
      awk '/^set -Eeuo pipefail$/{exit} {print}' "$0"
      exit 0
      ;;
    *)
      fail "Opción desconocida: $1"
      ;;
  esac
  shift
done

if [ "$HAS_PRUNE" = 1 ] && [ -n "$ONLY_SKU" ]; then
  fail "--prune no se puede combinar con --only. La reconciliación corre sobre el catálogo completo."
fi

if [ "$APPLY" = 1 ] && printf '%s\n' "${ARGS[@]:-}" | grep -qx -- '--dry-run'; then
  fail "No combines --apply con --dry-run."
fi

if [ "$APPLY" = 1 ]; then
  log "Modo: APLICAR cambios"
else
  ARGS+=(--dry-run)
  log "Modo: DRY-RUN (no escribe nada). Usa --apply para aplicar."
fi

[ -f "$ENV_FILE" ] || fail "No existe $ENV_FILE."
[ -f "$COMPOSE_FILE" ] || fail "No existe $COMPOSE_FILE."

set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

CID="$(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps -q "$BACKEND_SERVICE" | head -n 1)"
[ -n "$CID" ] || fail "El servicio '$BACKEND_SERVICE' no está corriendo. Ejecuta deploy/deploy-prod.sh (o deploy-test.sh) primero."
STATUS="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$CID" 2>/dev/null || echo missing)"
[ "$STATUS" = "healthy" ] || fail "El servicio '$BACKEND_SERVICE' no está healthy (estado: $STATUS)."

if [ -n "${ALTOSA_API_URL:-}" ] && command -v curl >/dev/null 2>&1; then
  if curl -fsS --max-time 10 "${ALTOSA_API_URL%/}/health" >/dev/null 2>&1; then
    log "Altosa API responde."
    if ! curl -fsS --max-time 10 -H "x-api-key: ${ALTOSA_API_KEY:-}" \
      "${ALTOSA_API_URL%/}/api/v1/products?page=1&pageSize=1" >/dev/null 2>&1; then
      warn "Altosa API no aceptó ALTOSA_API_KEY."
      warn "Revisa que la key del ERP coincida con altosa_infrastructure/.env."
    fi
  else
    warn "Altosa API no responde en ${ALTOSA_API_URL%/}/health."
    warn "El sync actualizará la DB local y reportará fallos al empujar a Altosa."
  fi
fi

if [ "$HAS_CREATE_MISSING" = 1 ]; then
  warn "--create-missing importará productos de Contifico que no existen en el ERP."
fi
if [ "$HAS_PRUNE" = 1 ]; then
  warn "--prune desactivará en local y Altosa los productos que no estén en Contifico."
  warn "Ejecuta primero sin --apply para revisar el conteo."
fi

log "Ejecutando: node dist/scripts/sync-contifico.js ${ARGS[*]}"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T "$BACKEND_SERVICE" \
  node dist/scripts/sync-contifico.js "${ARGS[@]}"
