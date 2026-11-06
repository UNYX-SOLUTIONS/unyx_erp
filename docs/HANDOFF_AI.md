# Handoff para una IA — Unyx ERP + Altosa

> Estado verificado: **2026-11-06**. Los conteos cambian con el uso del ERP; antes de tomar decisiones de datos, vuelve a consultarlos con los comandos de este documento. No uses cifras históricas de otras secciones sin confirmarlas.

## 1. Repositorios y rutas

```text
D:\Trabajo\Unyx Solutions\Develop\unyx_erp
  frontend/  Next.js 14 (App Router)
  backend/   Express + Prisma (BFF del ERP)
  docs/      contexto, integraciones y este handoff
  deploy/    scripts de producción

D:\Trabajo\Unyx Solutions\Develop\Backends Clientes\altosa_infrastructure
  backend/   Express + Prisma + API del catálogo
  scripts/   migraciones, sync, feed, auditorías, backfill
```

Altosa es un proyecto separado con su propio PostgreSQL y su propia API key. El ERP **no** accede directamente a la base de Altosa.

## 2. Arquitectura e invariantes

```text
Navegador
  │ JWT del ERP
  ▼
ERP frontend (Next.js)
  │ BFF /api/v1/integrations/*
  ▼
ERP backend (Express)
  │ HTTP + x-api-key
  ▼
Altosa API (Express + Prisma)
  │
  ├── PostgreSQL Altosa  ← fuente de verdad del catálogo
  ├── Contifico API       ← stock/precio y write-through
  └── Meta Graph API      ← catálogo y mapeo
```

Reglas que no se deben romper:

- **Altosa PostgreSQL es la fuente de verdad** de productos, variantes, categorías, nombres, precios, imágenes, estado y mapeos externos.
- El frontend habla **solo** con el BFF del ERP; nunca directo con Altosa, Meta o Contifico.
- El BFF habla con Altosa; no se conecta directo a su PostgreSQL.
- Los tokens de Meta/Contifico/Kommo viven **solo** en el `.env` de Altosa.
- El ERP no debe tener `CONTIFICO_API_KEY`.
- No se borran productos/variantes físicamente desde el ERP. Se anulan (estado 3).
- No ejecutar `prisma migrate`; las migraciones son SQL idempotentes en `backend/prisma/sql` y se aplican con scripts.

## 3. Estado actual verificado

Consulta usada: API de Altosa `/products` + `/external/links` (2026-11-06).

```text
Productos Altosa:            966
  activos:                   151
  inactivos:                 815

Variantes Altosa:           1239
  activas:                   284
  inactivas:                 955
  con meta_retailer_id:      447
  con contifico_id:          780
  activas con Meta:          193
  activas con Contifico:      59
  activas sin Contifico:     225
  activas sin Meta:           91
```

Contifico (catálogo real):

```text
API v2: ~1.371 productos (1.367 únicos tras deduplicar por id)
API v1:    784 productos (incompleta; NO usar para listar/buscar)
```

La integración lista/busca/sincroniza con **v2**. v1 se conserva para categorías y para leer/actualizar un producto por ID (el item por ID responde en v1 y v2).

WooCommerce:

```text
458 productos exportados
417 ya existían
 31 creados con meta_retailer_id
  8 creados sin meta ID (aún no existen en Meta)
  2 duplicados existentes (Romeo Beige/Gris; no se duplicaron)
```

Los 39 productos nuevos se crearon activos en la subcategoría **Catálogo Meta**. Los 8 sin meta ID usan su SKU `WC-<id>` como ID de feed.

## 4. Módulo Productos: lo más importante

### 4.1 Modelo

- `products`: producto padre, categoría/subcategoría, estado, `is_active`, `palabras_clave`, plantilla Kommo.
- `product_variants`: variante, `sku`, `nombre` completo visible, `color`, precio, imagen, URL, especificaciones (stock), estado, `is_active`, `meta_retailer_id`, `contifico_id`/`contifico_sku`, `meta_mapping_locked`.
- `nombre` es el nombre visible completo. Se generó con `backfill-variant-names`:
  - `producto + color/atributo`.
  - `Estándar` o sin color → nombre del producto.
  - Bases sin color → slug de `url_producto` cuando existe (`base-redonda-eco` → `Base Redonda Eco`) o fallback material/dimensión.
  - Duplicados dentro del producto → sufijo SKU.
- `color` sigue siendo el atributo; puede ser NULL (bases).
- El stock se lee de `especificacionesAdicionales.stock`; el ERP ahora lo parsea correctamente.
- La fuente del stock en la UI se muestra como **Contifico**, **Contifico (no encontrado/inactivo/desactualizado)** o **Local / sin mapeo**.

### 4.2 Estados y borrado

- `estado_id`: `1 = activo`, `2 = inactivo`, `3 = anulado`.
- `is_active` se deriva: solo estado 1 está activo.
- **Eliminar en el ERP = anular**:
  - Producto y todas sus variantes pasan a estado 3.
  - Meta queda `out of stock`; Contifico queda `estado I`.
  - No se borra nada en Altosa/Meta/Contifico.
  - Aparece en el filtro **Actividad → Anulados**.
- **No existe borrado definitivo desde el ERP**. Altosa rechaza `?permanent=true` con 409.
- **Inactivar un producto** (estado 2) inactiva automáticamente todas sus variantes.
- **Inactivar una variante** solo afecta a esa variante.
- Guardar un producto/variante anulado con `isActive=false` **no lo restaura**; se requiere cambiar explícitamente a activo/inactivo.
- El toggle tiene confirmación antes de inactivar.
- Toggles: General (producto) y cada VariantCard (variante). Se aplican al pulsar **Guardar cambios**.

### 4.3 Edición y write-through

Al editar un producto o variante ya mapeado, Altosa actualiza Meta y Contifico:

- Producto: nombre, descripción, categoría/subcategoría, estado.
- Variante: nombre, color, descripción, precio, imagen, estado.
- Meta recibe: `name`, `description`, `price` (entero en centavos), `image_url`, `url`, `availability`.
- Contifico recibe: `nombre`, `descripcion`, `pvp1`, `estado` (`A`/`I`), `categoria_id`.
- El nombre de la variante se propaga a Meta/Contifico.
- Renombrar un producto actualiza los nombres automáticos de sus variantes; los nombres manuales se conservan.
- Si el nombre de la variante era automático y se cambia el color, el nombre se actualiza; si era manual, se respeta.
- El SKU de una variante mapeada a Contifico/Meta **no se puede cambiar** desde Altosa.
- **Las actualizaciones externas son best-effort**: si Meta/Contifico falla, Altosa conserva el cambio local y el error queda en logs. La salud de mapeos no compara precio/descripción; solo mapeo/estado. Revisar logs si hace falta.
- **Guardar una variante no crea mapeos nuevos.** El auto-mapeo solo ocurre al crear producto/variante. Si el usuario quitó el mapeo de Meta o Contifico, editar la variante no lo vuelve a crear.
- **Quitar mapeo es persistente**:
  - Meta: `meta_retailer_id=NULL` + `meta_mapping_locked=true`. El sync de Meta no la vuelve a llenar.
  - Contifico: `contifico_id/contifico_sku=NULL` + `contifico_mapping_locked=true`. El sync de Contifico no la vuelve a enlazar por SKU/nombre.
  - “Restaurar sync automático” limpia el ID y pone el lock en `false` para que el próximo sync pueda mapearla.
- Crear producto/variante desde el ERP también intenta publish en Meta y crear/actualizar en Contifico.
- El formulario de variante envía `isActive` (bug corregido; antes no se guardaba el toggle).
- Crear una variante con `isActive=false` crea la variante en estado inactivo.

### 4.4 Categorías y palabras clave

- El formulario General tiene **dos dropdowns dependientes**: Categoría y Subcategoría.
- Fuente: `GET /api/v1/categories` de Altosa (vía BFF).
- Se guardan `categoryId`/`subcategoryId`; Altosa deriva la categoría desde la subcategoría.
- Se eliminó el campo “Línea” del formulario; el filtro del listado ahora es **Categoría** y usa categorías reales.
- **Palabras clave / sinónimos**:
  - Se guardan en `products.palabras_clave` (JSON).
  - `NULL` = nunca tuvo palabras propias; el ERP muestra sugerencias derivadas.
  - `[]` = el usuario las borró todas.
  - Se pueden agregar/quitar y persisten al guardar.
  - El buscador del ERP las usa; también la búsqueda de Altosa.

### 4.5 Imágenes, stock y salud

- La fila de producto usa la primera variante que tenga `imagenUrl` (incluye inactivas).
- La fila de variante y la VariantCard muestran la imagen de la variante.
- `next.config.mjs` permite `altosamobiliario.com`, `api.altosamobiliario.com` y wildcards.
- La tabla de variantes muestra:
  - Activa: borde izquierdo azul.
  - Inactiva: fondo gris suave + borde gris + badge **Inactiva**.
  - Anulada: fondo rosa suave + badge **Anulada**.
  - Sin atenuar texto/imágenes (nada de `grayscale` u opacity global).
- La VariantCard del panel derecho también tiene fondo gris suave si inactiva y rosa suave si anulada.
- La salud externa:
  - Busca por `contifico_id`, luego `contifico_sku`/`sku`, luego nombre normalizado.
  - `missing` = no encontrado por ID/código/nombre → UI **“Contifico no encontrado”**, no “eliminado”.
  - Si el ID cambió pero el código/nombre existe → `mismatch` **“Contifico desactualizado”**.
  - Solo analiza variantes activas.
  - No detecta diferencias de precio/descripción.

### 4.6 Rate limit y requests del detalle

- Guardar variantes envía solo las que cambiaron (comparación contra `product.variants`), no todas.
- El detalle actualiza el cache del producto y marca `['products']` como stale con `refetchType: 'none'`; la lista completa (≈10 páginas con 966 productos) se refresca una sola vez al cerrar el panel, no en cada edición.
- Los cambios de mapeo actualizan el cache local del detalle y no fuerzan un refetch del producto.
- Resultado: una edición normal consume ~1 PATCH en vez de N PATCH + 10 GET del catálogo. Si se agregan mutaciones nuevas, seguir este patrón para no agotar el límite global del ERP (300/15 min).

## 5. Contifico: detalles críticos

- La configuración `CONTIFICO_API_URL` está en v1.
- **Listado/búsqueda/sync usan v2**; categorías por v1; lectura/actualización por ID funciona en v1 y v2.
- v1 devolvía solo 784 productos; v2 devuelve ~1.367. Por eso antes no aparecían productos como Liliana (`XS-2887T`).
- La búsqueda v2:
  - `search` rápido por **nombre**.
  - No busca por SKU; para SKU/código de barra se descarga el catálogo completo cacheado 30 s y se filtra localmente.
  - Primera búsqueda por SKU puede tardar ~20 s; por nombre es rápida.
- El sync descarga v2 en paralelo (5 páginas concurrentes) para entrar en timeout (~21 s).
- `createMissing=false` por defecto: los productos que no están en Altosa se cuentan como `ignored` y no se crean.
- `createMissing=true` crea producto padre + variante inactivos.
- Las variantes con `contifico_mapping_locked=true` no se reasignan por SKU/nombre; solo se actualizan si coinciden por `contifico_id`. Las bajas explícitas desde el ERP quedan así y no reaparecen en la siguiente corrida.
- Hay ~583 productos de Contifico que no están en Altosa (conteo aproximado; recalcular antes de importar). Se pueden importar con:
  ```bash
  bash scripts/contifico-sync.sh --dry-run --create-missing --match-by-name
  bash scripts/contifico-sync.sh --apply --create-missing --match-by-name
  ```
  o desde la bandeja **Sincronizar externos** del ERP.
- No usar `--prune` en cron: desactiva lo que no venga en la corrida.
- El write-through de edición usa v1 por ID; el item por ID de un producto v2 responde correctamente en v1.

## 6. Meta: feed y mapeo

- El mapeo vive en `product_variants.meta_retailer_id`; `meta_mapping_locked` protege mapeos manuales.
- El feed CSV es la fuente masiva para Commerce Manager:
  - URL: `https://api.altosamobiliario.com/feeds/meta-catalog.csv`
  - Basic Auth: `META_FEED_USER` / `META_FEED_PASSWORD` (solo Altosa).
  - El BFF del ERP puede leerlo con `x-api-key`.
  - Scopes: `published` (default), `meta`, `active`, `all`.
  - Columnas exactas de `meta_plantilla_catalogo.csv`; precio con punto decimal (`59.00 USD`).
  - Omite filas sin precio/imagen/link; headers `X-Feed-Rows`/`X-Feed-Skipped` y logs.
  - El botón **Descargar CSV Meta** llama al BFF `/api/v1/integrations/altosa/meta-feed.csv?scope=published`.
- En Commerce Manager: “Utiliza una URL”, usuario/clave, primero **Actualiza tu lista**, luego **Reemplaza** si se quiere limpiar lo que no esté en el feed.
- No se borra Meta desde el ERP; anular deja `out of stock`, no elimina.
- 10 productos activos de Contifico sin vínculo detectados antes eran duplicados por nombre/SKU viejo; revisar reportes antes de remapear.

## 7. WooCommerce

- JSON: `woo_commerce/productos_woocommerce.json` (458 productos simples).
- Script: `scripts/woocommerce-reconcile.mjs`.
- Cruza por `WC-<id>` (`meta_retailer_id`), luego slug y nombre.
- Dry-run por defecto; `--apply` crea faltantes.
- Resultado: 417 existentes + 31 con meta ID + 8 sin meta ID + 2 duplicados existentes.
- Los 8 sin meta ID se publican en el feed con su SKU estable `WC-<id>`.

## 8. Deploy

Orden obligatorio: **Altosa primero**, luego ERP.

```bash
cd /docker/altosa_infrastructure
sudo bash update.sh --api-only

cd /opt/unyx-erp
sudo bash deploy/deploy-prod.sh
```

- `update.sh` aplica migraciones SQL idempotentes de Altosa:
  - `variant_nombre.sql` (`product_variants.nombre`)
  - `product_keywords.sql` (`products.palabras_clave`)
  - `contifico_mapping.sql` (`contifico_id`, `contifico_sku`, `contifico_mapping_locked`)
  - más las de Meta/Kommo existentes.
- El deploy de Altosa recompila la API y ejecuta el backfill de nombres.
- El deploy del ERP no requiere migración nueva.
- Si se ejecuta por git: commit/push primero. Si se usan los scripts `deploy.ps1`/`deploy-prod.ps1`, suben el working tree.
- El `.env` de Altosa debe tener `META_FEED_USER`/`META_FEED_PASSWORD` para el feed Basic Auth; el compose las pasa al contenedor.
- No commitear `.env` ni tokens.

## 9. Comandos útiles

Conteos actuales (API Altosa):

```bash
# En el VPS, con .env cargado
set -a; . ./.env; set +a
curl -s -H "x-api-key: $ALTOSA_API_KEY" \
  "$ALTOSA_PUBLIC_URL_BASE/api/v1/products?page=1&pageSize=1&active=true" | jq '.meta.total'
```

Auditoría Contifico vs Altosa:

```bash
cd /docker/altosa_infrastructure
bash scripts/contifico-parity.sh --only-active --fail-on-mismatch
# completa:
bash scripts/contifico-parity.sh
```

Backfill de nombres:

```bash
bash scripts/backfill-variant-names.sh
bash scripts/backfill-variant-names.sh --apply
```

Feed:

```bash
set -a; . ./.env; set +a
curl -sS -u "$META_FEED_USER:$META_FEED_PASSWORD" -D - -o /tmp/meta.csv \
  "https://api.altosamobiliario.com/feeds/meta-catalog.csv?scope=published"
head -n 2 /tmp/meta.csv
```

Pruebas de código:

```bash
# Altosa
cd /docker/altosa_infrastructure/backend
pnpm type-check && pnpm build

# ERP backend
cd /docker/unyx_erp/backend
pnpm type-check && pnpm build

# ERP frontend
cd /docker/unyx_erp/frontend
pnpm type-check && pnpm lint && pnpm build
```

## 10. Pendientes y riesgos actuales

1. **~583 productos Contifico v2 no están en Altosa**; decidir e importar. Liliana ya se puede buscar/mapear.
2. **225 variantes activas sin Contifico**: decidir si se mapean/crean o quedan con stock local.
3. **91 variantes activas sin Meta**: decidir si se mapean o no.
4. Los 2 duplicados Woo Romeo Beige/Gris ya existen; no duplicar.
5. Los 8 Woo sin meta ID se publican con SKU; mapear cuando Meta los cree.
6. La salud externa no valida precio/descripción; el write-through best-effort puede fallar en silencio salvo logs. Considerar warnings en la respuesta/UI.
7. El feed omite variantes sin precio/imagen/link; revisar `X-Feed-Skipped`.
8. `updated_at` no mide la última sync (el schema no usa `@updatedAt`); considerar `last_synced_at`.
9. La primera búsqueda Contifico por SKU tarda ~20 s; cachear/avisar en UI si molesta.
10. No hay borrado definitivo; Contifico/Meta conservan los ítems desactivados.
11. Verificar `git status` antes de desplegar: al escribir este doc hay cambios sin commit en Altosa (`catalog-schema.ts`, `catalog-service.ts`) y en el ERP (`altosa-schema.ts`, `ProductVariantsPanel.tsx`, `VariantCard.tsx`, `products.api.ts`, docs). El deploy por scripts sube el working tree; el deploy por git exige commit/push.

## 11. Reglas para la próxima IA

- No inventar conteos: consultar la API/SQL.
- No tocar mapeos Meta/Contifico de producción sin respaldo y confirmación.
- No agregar `CONTIFICO_API_KEY` al ERP.
- No cambiar la semántica de estados ni reintroducir borrado definitivo.
- No modificar campos de otro dominio (Kommo, auth, inventario) sin coordinarlo.
- Mantener español, componentes y estilo existentes.
- Respetar `products.read`/`products.update`.
- No commitear salvo que el usuario lo pida.
- Si se cambia el esquema Altosa, agregar SQL idempotente + wrappers + healthcheck/reset y actualizar este handoff.
