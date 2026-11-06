# Contexto del proyecto Unyx ERP + Altosa + Contifico + Meta + Kommo

Documento de contexto para continuar el desarrollo, especialmente el frontend del ERP.

> **Estado vigente: 2026-11-06.** Para retomar el proyecto, leer primero
> [`docs/HANDOFF_AI.md`](./HANDOFF_AI.md). Este documento conserva contexto
> histórico; algunas cifras y afirmaciones de las secciones 4, 11 y 17 son de
> antes de la importación WooCommerce, del cambio a Contifico v2 y del rediseño
> de estados (activo/inactivo/anulado). No usar esas cifras sin recalcularlas.

Última actualización de este documento: 2026-11-06.

---

## 1. Objetivo del proyecto

Tener un ERP Unyx que sea el punto de operación del catálogo de Altosa, con:

- Catálogo de productos y variantes almacenado en PostgreSQL de **Altosa**.
- API de Altosa como puente entre el ERP, la base de datos y las integraciones.
- ERP como consola para crear, editar, aprobar y administrar productos.
- Contifico como fuente de inventario/stock/precio inicial.
- Catálogo Meta para mapear cada variante con su `retailer_id` de WhatsApp.
- Kommo para plantillas de chat.
- n8n/WhatsApp consumiendo `COALESCE(meta_retailer_id, sku)` para enviar tarjetas de producto.

La intención es que el catálogo almacenado en Altosa sea el maestro, operado desde el ERP, y que los cambios se repliquen a Meta y Contifico. **Altosa es la dueña de las integraciones y los tokens; el ERP solo llama a Altosa** (ver sección 3).

---

## Principios de arquitectura (no perder)

Esta separación es la base del proyecto y no debe confundirse:

| Componente | Base / almacenamiento | Responsabilidad |
|---|---|---|
| ERP Unyx | PostgreSQL interno del ERP (`unyx-postgres`) | Auth, usuarios, roles, permisos, auditoría, operaciones internas y datos propios del sistema |
| API Altosa | `altosa-api` | Backend API que expone el catálogo y las integraciones |
| PostgreSQL Altosa | `altosa-postgres` | **Base de conocimiento del catálogo**: productos, variantes, precios, imágenes, `meta_retailer_id`, plantillas Kommo |
| Contifico | API externa | Inventario, stock y precios base |
| Meta | API externa | Catálogo de items y `retailer_id` |
| Kommo | API externa | Plantillas de chat |
| n8n / WhatsApp | Servicio externo | Envío de tarjetas usando el catálogo/Altosa |

Reglas que no se deben romper:

1. **El ERP es el sistema de gestión**. Su base interna es para auth, permisos, usuarios, auditoría y operaciones internas.
2. **La base de conocimiento del catálogo vive en Altosa**. No se mueve al ERP.
3. **El frontend del ERP nunca consulta una base de datos directamente**. Llama al BFF del ERP.
4. **El BFF del ERP habla con la API de Altosa**, no con PostgreSQL de Altosa.
5. **El ERP no es dueño de la base de conocimiento**. Es la consola de operación; el almacenamiento del catálogo es Altosa.
6. **El auth y los permisos no van a Altosa**. La knowledge base no va al ERP.
7. **`kb_products` / `kb_product_variants` del ERP son staging técnico legado**. Ya no son dueños del sync de Contifico; el sync vive en Altosa. Se usan solo para compatibilidad/backfill y se deben eliminar/refactorizar.
8. **Los tokens de Meta, Kommo y Contifico viven solo en Altosa**. Nunca en el frontend ni en el ERP.
9. **n8n/WhatsApp consumen Altosa**, no el ERP.

No confundir:

```text
ERP local kb_products          ≠  Catálogo Altosa
PostgreSQL del ERP             ≠  PostgreSQL de Altosa
ERP BFF                        ≠  API de Altosa
Pantalla de productos          ≠  Base de datos del ERP
```

La pantalla de productos lee la API de Altosa a través del BFF porque el **catálogo oficial está en Altosa**.

### Fuente de verdad por dominio

| Dato | Dueño / almacenamiento |
|---|---|
| Auth, usuarios, roles, permisos, auditoría | PostgreSQL interno del ERP |
| Catálogo de productos y variantes | PostgreSQL de Altosa |
| Stock, precio e inventario | Contifico (estado actual; reglas de escritura a definir) |
| `meta_retailer_id` | PostgreSQL de Altosa, con origen en Meta |
| Plantillas Kommo | PostgreSQL de Altosa, sincronizadas desde Kommo |
| Operación de WhatsApp / n8n | Altosa |

---

## 2. Repositorios y rutas

| Proyecto | Ruta local | Ruta en VPS |
|---|---|---|
| ERP Unyx | `D:\Trabajo\Unyx Solutions\Develop\unyx_erp` | `/docker/unyx_erp` |
| Altosa Infrastructure | `D:\Trabajo\Unyx Solutions\Develop\Backends Clientes\altosa_infrastructure` | `/docker/altosa_infrastructure` |

Dominios actuales:

```text
ERP:    https://altosa-test.erp.unyxsolutions.com
Altosa: https://api.altosamobiliario.com
pgAdmin:https://dbglobal.altosamobiliario.com
```

`altosa-test...` es el entorno actual de pruebas. Para producción se debe usar el dominio final que corresponda.

---

## 3. Arquitectura actual

```text
ERP frontend (Next.js)
        │
        ▼
ERP backend / BFF (Express)
        │
        ├── PostgreSQL interno del ERP (auth, usuarios, permisos, auditoría)
        │
        ▼
API Altosa (Express + Prisma)
        │
        ▼
PostgreSQL Altosa (base de conocimiento del catálogo)
        ▲
        ├── sync Contifico (job nativo en Altosa)
        ├── Meta (mapeo de retailer_id)
        └── Kommo (plantillas)
```

Flujo de lectura del ERP:

```text
Productos del ERP frontend
  → GET /api/v1/integrations/altosa/products
  → API Altosa
  → PostgreSQL Altosa
```

El ERP **no lee el catálogo desde su propia base**; la pantalla de productos consume la API de Altosa.

### Base local del ERP

El ERP tiene su propio PostgreSQL (`unyx-postgres`) para auth, usuarios, roles, permisos, auditoría y operaciones internas. **No es la base de conocimiento del catálogo.**

También contiene `kb_products`/`kb_product_variants` como **staging técnico** del sync de Contifico. Esas tablas no son el catálogo que ve el ERP, no son la fuente de verdad y no deben usarse para lecturas de catálogo.

### Altosa

La API de Altosa es el backend del catálogo. PostgreSQL Altosa es la **base de conocimiento de todos los productos y variantes**: producto, variante, `nombre` completo de variante, color, SKU, precio, imágenes, `meta_retailer_id`, plantillas Kommo y datos relacionados.

### Contifico

La integración de Contifico vive en **Altosa** (`backend/src/modules/contifico`): listado/búsqueda/sync por **API v2**, categorías por v1 y write-through. El token `CONTIFICO_API_KEY` está solo en el `.env` de Altosa. El sync corre en el VPS de Altosa (`scripts/contifico-sync.sh`) y escribe directamente en su PostgreSQL. El ERP solo hace proxy a `/api/v1/contifico/*` y ya no tiene credenciales de Contifico.

Importante: el endpoint v1 de productos devolvía solo **784** productos (incompleto); v2 devuelve **1.367** (incluye activos e inactivos). Por eso el listado, el buscador del selector y el sync ahora usan v2. La búsqueda por nombre usa `search` de v2; la búsqueda por SKU/código de barra cae al catálogo completo cacheado 30 s. Los productos que no existan en Altosa aparecerán como pendientes para importar.

### Meta

El token de Meta vive solo en el `.env` de Altosa. El ERP nunca recibe el token. La API Altosa consulta el catálogo Meta y el ERP usa el buscador/mapeo mediante el BFF. Altosa también publica ítems planos cuando el alta del ERP lo pide (`syncExternals`), actualiza el ítem mapeado al editar y lo elimina en el DELETE explícito; desactivar (`isActive=false`) solo lo deja `out of stock`.

### Kommo

Las plantillas se sincronizan en Altosa. El ERP solo consume/elige la plantilla en la variante.

### n8n / WhatsApp

No está en estos repos. Usa el catálogo/Altosa y `COALESCE(meta_retailer_id, sku)` como `product_retailer_id` para las tarjetas de producto.

---

## 4. Estado actual del catálogo

### Estado vigente (2026-11-06, verificado contra producción)

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

- **Contifico v2** devuelve ~1.371 productos (1.367 únicos tras deduplicar); la API v1 devolvía solo 784 y estaba incompleta. El listado, búsqueda y sync usan v2.
- WooCommerce: 458 productos representados = 417 existentes + 31 creados con `meta_retailer_id` + 8 creados sin meta ID + 2 duplicados existentes (Romeo Beige/Gris). Los 8 sin meta usan SKU `WC-<id>` en el feed.
- Las cifras cambian con el uso del ERP. Recalcular antes de decisiones de datos con `/products` y `/external/links` (ver `HANDOFF_AI.md`).

### Histórico: reconciliación Meta inicial (pre-Woo, pre-v2)

La siguiente foto corresponde a la reconciliación inicial y no es el estado actual. Se conserva como contexto histórico.

Última ejecución del reconciliador Meta:

```text
Productos: 927
  activos:   111
  inactivos: 816

Variantes: 1200
  con meta_retailer_id: 417
  sin meta_retailer_id: 783
```

Desglose del catálogo:

```text
110 productos aprobados del backup (todos activos)
  1 producto 677 (Contifico, ya activo)
720 productos Contifico inactivos
 96 productos nuevos creados desde Meta (inactivos)
```

Variantes:

```text
241 variantes aprobadas del backup
  1 variante del producto 677
720 variantes de Contifico inactivas
142 variantes nuevas creadas bajo productos existentes
 96 variantes nuevas de productos Meta
= 1200
```

Resultado del reconciliador Meta (`reconcile-meta-variants`):

```text
map:              172
create_variant:   142
create_product:    96
already_mapped:     7
conflict:          29
ambiguous_color:    2
no_color:           2
skipped:            2
```

- 417 de 452 items de Meta quedaron mapeados/creados.
- Quedan 33 casos: 29 conflictos + 2 ambiguos + 2 sin color.
- 2 items de prueba de Meta fueron omitidos.
- Los 7 mapeos iniciales del `meta-map.csv` están incluidos en `already_mapped`.

Importante: los 783 sin `meta_retailer_id` **no todos son Contifico**. Hay que verificar cuántas variantes activas quedaron sin mapping:

```sql
SELECT
  count(*) FILTER (WHERE is_active) AS variantes_activas,
  count(*) FILTER (WHERE is_active AND meta_retailer_id IS NOT NULL) AS activas_mapeadas,
  count(*) FILTER (WHERE is_active AND meta_retailer_id IS NULL) AS activas_sin_mapear
FROM product_variants;
```

Si `activas_sin_mapear > 0`, esas variantes sí pueden fallar en WhatsApp por el fallback al SKU y hay que mapearlas.

---

## 5. Significado de `is_active` y estados

### Estado vigente

La columna de estado es `estado_id`:

- `1 = activo` → `is_active = true`.
- `2 = inactivo` → `is_active = false`.
- `3 = anulado` → `is_active = false`; lista negra de anulados.

`is_active` se deriva del estado. Inactivar un producto (2) inactiva todas sus variantes; inactivar una variante solo afecta a esa variante. Anular (3) manda a **Anulados** y desactiva en Meta/Contifico sin borrar. No existe borrado definitivo desde el ERP. Ver `HANDOFF_AI.md` §4.

### Legado

`is_active` fue el interruptor de aprobación:

- `true`: producto/variante aprobado; la IA y los flujos de catálogo pueden usarlo.
- `false`: producto/variante importado o pendiente; no debe recomendarse ni publicarse.

Reglas actuales:

- Backup aprobado: `is_active = true`.
- Importaciones nuevas de Contifico/Meta: `is_active = false`.
- El sync de Contifico no debe pisar el contenido aprobado.
- Las variantes nuevas creadas por el reconciliador Meta quedan inactivas.
- Los productos nuevos creados desde Meta quedan inactivos bajo la categoría `Meta` / `Catálogo Meta`.

El ERP descarga todos los productos (`active=all`) y filtra en cliente. Por defecto el dropdown `Actividad` muestra `Activos`; el usuario puede elegir `Inactivos` o `Todos`. Los inactivos se ven con fondo suave y badge `Inactivo`, sin atenuar texto ni imágenes; sus variantes inactivas muestran badge `Inactiva`.

---

## 6. Mapeo Meta: estrategia

### Estado vigente (2026-11-06)

- 447 variantes con `meta_retailer_id` en Altosa.
- 8 productos Woo creados sin meta ID: se publican con su SKU `WC-<id>` y se pueden mapear cuando existan en Meta.
- 2 duplicados Woo (Romeo Beige/Gris) ya tenían variante con otro meta ID; no se duplicaron.
- El mapeo manual queda con `meta_mapping_locked=true`.
- La salud externa busca por `contifico_id`/`meta_retailer_id`, código y nombre normalizado; `missing` se muestra como **no encontrado**, no como eliminado.
- El feed CSV de Meta es el origen masivo: `https://api.altosamobiliario.com/feeds/meta-catalog.csv` (Basic Auth), con botón **Descargar CSV Meta** en el ERP.

### Estrategia histórica (reconciliador inicial)

Meta no trae SKU. El mapeo no debe basarse en SKU como entrada.

Estrategia implementada en `reconcile-meta-variants`:

1. Extraer el producto base del nombre de Meta quitando genéricos y color/material.
   - “Silla Tapizada Sandy Beige” → `sandy`.
   - “Silla Tapizada Oliva Gris Oscuro” → `oliva`.
2. Buscar el producto en Altosa por tokens base.
   - Preferir productos aprobados/activos.
3. Extraer color/tono:
   - “Gris Oscuro” → familia `gris`, tono `oscuro`.
   - “Gris Claro” → familia `gris`, tono `claro`.
   - “Beige Cuerina” → color `beige`, material `cuerina`.
4. Buscar la variante:
   - Color exacto → mapear.
   - `Gris` genérico vs `Gris Claro/Oscuro` → usar código del SKU (`LGR`, `OSC`) y material.
   - Si no existe el color → crear variante nueva bajo el producto, inactiva.
5. Si no existe el producto base → crear producto + variante inactivos.
6. Nunca dos `retailer_id` al mismo SKU.
7. Nunca borrar productos/variantes.

Scripts existentes:

| Script | Uso |
|---|---|
| `sync-meta-mappings` | Mapeo exacto por SKU/custom_label/nombre exacto. |
| `suggest-meta-mappings` | Reporte de candidatos fuzzy para revisión. |
| `reconcile-meta-variants` | Reconciliador producto → variante; mapea o crea inactivo. |
| `backfill-meta-retailer-ids` | Aplica un CSV `sku,retailer_id`. |
| `seed-products` | Carga un JSON de productos en Altosa. |

Comandos típicos (desde el VPS de Altosa):

```bash
cd /docker/altosa_infrastructure

# Sugerencias fuzzy
docker compose exec -T api node dist/scripts/suggest-meta-mappings.js \
  --report /tmp/meta-suggestions.csv --min-score 0.35 --limit 5

# Reconciliador producto -> variante
docker compose exec -T api node dist/scripts/reconcile-meta-variants.js \
  --report /tmp/meta-variant-report.csv

docker compose exec -T api node dist/scripts/reconcile-meta-variants.js \
  --apply --report /tmp/meta-variant-report.csv

# Backfill de un CSV revisado
docker cp meta-map.csv altosa-api:/tmp/meta-map.csv
docker compose exec -T api node dist/scripts/backfill-meta-retailer-ids.js \
  /tmp/meta-map.csv --dry-run
```

---

## 7. Estado de las integraciones

| Integración | Estado actual |
|---|---|
| ERP frontend → ERP BFF | Funciona |
| ERP BFF → API Altosa | Funciona |
| API Altosa → PostgreSQL Altosa | Funciona |
| Contifico ↔ Altosa (sync v2 + auditoría) | Funciona; v2 lista/busca/sincroniza (~1.367 productos) |
| Meta → Altosa (mapeo) | 447 variantes con `meta_retailer_id`; 8 Woo sin meta ID usan SKU `WC-<id>`; 2 duplicados Romeo |
| ERP → Altosa (CRUD) | Funciona: crear, editar, activar/inactivar, anular |
| ERP → Contifico | Write-through best-effort al crear/editar/anular; sync y búsqueda vía Altosa |
| ERP → Meta | Write-through best-effort al crear/editar/anular; mapeo manual y feed CSV |
| Meta → Altosa (crear productos Meta-only) | Reconciliador disponible; los productos creados nacen inactivos |
| Kommo | Plantillas en Altosa; ERP elige plantilla |

### Estado de escritura

- Editar producto/variante en el ERP: actualiza Altosa y propaga a Meta/Contifico (best-effort; fallos solo en logs).
- Crear producto: crea en Altosa e intenta publicarlo en Meta y crearlo/actualizarlo en Contifico.
- Crear variante desde la UI: se crea en Altosa e intenta publicarse/crearse en Meta/Contifico.
- Eliminar: **anula** (estado 3). No borra en Altosa ni en Meta/Contifico; Meta queda `out of stock` y Contifico `estado I`.
- El write-through es best-effort: si el externo falla, el cambio local se conserva. La salud de mapeos no compara precio/descripción.

---

## 8. Modelo de datos Altosa

Tablas principales:

```text
products
  id_producto
  id_sub_categoria
  producto (nombre genérico)
  descripcion
  uso_recomendado
  palabras_clave (JSON editable)
  id_sub_categoria → categoría/subcategoría
  estado_id
  is_active
  kommo_template_id
  created_at / updated_at

product_variants
  id_variante
  id_producto
  id_garantia
  id_catalogo
  descripcion
  url_producto
  sku
  nombre
  color
  precio_usd
  material
  tapizado
  estructura
  dimensiones y especificaciones
  estado_id
  source_id / source_row_key
  is_active
  imagen_url
  kommo_template_id
  meta_retailer_id
  meta_mapping_locked
  created_at / updated_at
```

`nombre` es el nombre completo visible de la variante (`producto + color/atributo`; para `Estándar` o sin color, el nombre del producto). El ERP lo usa para mostrar la fila de variante; `color` queda como atributo de color/mapeo. Las variantes existentes se llenan con `backfill-variant-names` y las altas nuevas lo generan automáticamente.

`palabras_clave` es un arreglo JSON editable de sinónimos comerciales. `NULL` = nunca tuvo palabras propias (el ERP muestra sugerencias derivadas); `[]` = el usuario borró todas. Se usa en el buscador y está disponible para el asistente.

`id_sub_categoria` es la fuente de la categoría/subcategoría: el formulario envía `categoryId`/`subcategoryId` y Altosa deriva la categoría. La columna `line` del frontend es un alias histórico de la categoría, no una taxonomía separada.

El stock vive en `especificacionesAdicionales.stock`; el ERP lo parsea para mostrar `Stock: N uds` y la fuente (`Contifico` o `Local / sin mapeo`).

`meta_retailer_id` está en la variante porque el item de Meta representa una combinación producto + color.

`meta_mapping_locked`:

- `true`: mapeo manual/importado que el sync/backfill no debe sobrescribir.
- `false`: mapeo automático.

### Mejoras de esquema recomendadas (no bloqueantes)

1. `color_family` y `color_shade` en `product_variants`.
2. `product_external_refs` para IDs de Contifico/Meta/ERP.
3. `meta_catalog_items` como caché del catálogo Meta.
4. `product_aliases` o `canonical_product_id` para unir duplicados Contifico/aprobados.
5. Índices normalizados por nombre/color.
6. Campos de auditoría de aprobación y mapeo.

---

## 9. Entorno, deploy y secretos

### Archivos `.env`

- ERP producción: `/opt` o `/docker/unyx_erp/.env.production` según VPS; en este VPS actual `/docker/unyx_erp/.env.production`.
- ERP local: `backend/.env`.
- Altosa producción: `/docker/altosa_infrastructure/.env`.
- Altosa local: `backend/.env`.

No subir `.env` reales al repositorio.

### Variables relevantes

ERP `.env.production`:

```text
UNYX_DOMAIN
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
JWT_ACCESS_EXPIRES
JWT_REFRESH_EXPIRES
ALTOSA_API_URL
ALTOSA_API_KEY
# DATABASE_URL_ALTOSA (solo ETL legado; no usado por el sync nuevo)
```

Altosa `.env`:

```text
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB
PGADMIN_EMAIL
PGADMIN_PASSWORD
PGADMIN_PUBLIC_PORT
PGADMIN_PUBLIC_DOMAIN
ALTOSA_API_KEY
ALTOSA_PUBLIC_URL_BASE
ALTOSA_PUBLIC_DOMAIN
KOMMO_API_URL
KOMMO_API_KEY
META_CATALOG_ID=1524398256394561
META_ACCESS_TOKEN
META_API_VERSION=v26.0
META_FEED_USER
META_FEED_PASSWORD
CONTIFICO_API_URL=https://api.contifico.com/sistema/api/v1
CONTIFICO_API_KEY
# CONTIFICO_API_TOKEN (opcional POS; no usado para inventario)
```

- `META_FEED_USER`/`META_FEED_PASSWORD` protegen el feed CSV con Basic Auth. El BFF también puede leer el feed con `x-api-key`.
- `CONTIFICO_API_URL` sigue en v1; el código usa v2 para listar/buscar/sincronizar productos y v1 para categorías y lectura/edición por ID. No cambiar solo la URL a v2 sin revisar el CRUD.
- `docker-compose.yml` pasa `META_FEED_USER`/`META_FEED_PASSWORD` al contenedor `altosa-api`.

Contratos entre proyectos:

- `ALTOSA_API_KEY` debe ser la misma en ERP y Altosa.
- `ALTOSA_API_URL` del ERP debe ser igual a `ALTOSA_PUBLIC_URL_BASE` de Altosa.
- `POSTGRES_*` son bases distintas: ERP y Altosa no comparten base.
- Los tokens de Meta, Kommo y Contifico solo van en Altosa.
- Después de migrar, el ERP no debe tener `CONTIFICO_API_KEY`.

### Deploy

**Orden: Altosa primero, ERP después.** El ERP nuevo espera la semántica de estados y el catálogo v2 de Altosa.

Altosa:

```bash
cd /docker/altosa_infrastructure
git fetch origin
git checkout main
git pull --ff-only
# .env: CONTIFICO_API_URL/KEY, META_*, y META_FEED_USER/PASSWORD para el feed
sudo bash update.sh --api-only
# update.sh aplica variant_nombre.sql y product_keywords.sql,
# recompila la API y ejecuta el backfill de nombres.
bash scripts/healthcheck.sh
bash scripts/contifico-parity.sh --only-active --fail-on-mismatch
bash scripts/contifico-sync.sh --dry-run --match-by-name
```

ERP:

```bash
cd /opt/unyx-erp
git fetch origin
git checkout main
git pull --ff-only
sudo bash deploy/deploy-prod.sh
# Si solo cambiaron variables:
sudo bash deploy/deploy-prod.sh --skip-build
# Solo una vez, si aún no se migraron los mapeos legados:
docker compose --env-file .env.production -f docker-compose.prod.yml \
  exec -T unyx-backend node dist/scripts/backfill-altosa-mappings.js
```

Si el VPS del ERP usa `/docker/unyx_erp` en lugar de `/opt/unyx-erp`, ajusta la ruta. El deploy del ERP no aplica migraciones nuevas: las de catálogo viven en Altosa.

Antes de desplegar, revisa `git status` en ambos repos: puede haber cambios locales sin commit (por ejemplo, `catalog-service.ts` en Altosa y estilos de variantes en el ERP). Los scripts de deploy suben el working tree; un deploy basado en git requiere commit/push.

### Backfill de nombre de variante

```text
scripts/backfill-variant-names.sh              # dry-run + reporte CSV
scripts/backfill-variant-names.sh --apply      # llena solo nombres vacíos
scripts/backfill-variant-names.sh --force --apply  # regenera todos
```

Regla: `producto + color/atributo`; si el color es `Estándar` o no existe, usa el nombre del producto. Para variantes sin color de productos con varias variantes usa el slug de `url_producto` como nombre real (`/producto/base-redonda-eco/` → `Base Redonda Eco`, `/producto/base-cruz-corta/` → `Base Cruz Corta`); si no hay URL, usa los fallbacks de material/dimensión. Si dos variantes del mismo producto quedan con el mismo nombre, se agrega el SKU. El deploy (`update.sh`) lo ejecuta automáticamente con `--apply`; es idempotente y no sobreescribe nombres existentes.

### CRUD de productos y estados

Altosa es la fuente de verdad. El CRUD del ERP se apoya en la API de Altosa y en sus write-through a Meta/Contifico:

- **Estados**: `1 = activo`, `2 = inactivo`, `3 = anulado`. `isActive` se deriva: solo el estado 1 está activo.
- **Taxonomía**: el formulario usa dos dropdowns dependientes, **Categoría** y **Subcategoría**, desde `GET /api/v1/categories` (Altosa). Se guardan los IDs (`categoryId`/`subcategoryId`); Altosa deriva la categoría desde la subcategoría. El filtro de productos usa las categorías reales, no una lista fija.
- **Palabras clave / sinónimos**: se guardan editables en `products.palabras_clave` (arreglo JSON). Si el producto nunca tuvo palabras propias (`NULL`), el ERP muestra sugerencias derivadas de nombre/categoría/variantes; al guardar quedan persistidas y se pueden borrar (`[]`).
- **Crear/actualizar producto o variante**: Altosa guarda primero; los cambios de nombre, descripción, precio, imagen, stock/disponibilidad y estado se propagan a Meta/Contifico de forma best-effort. Si el catálogo externo falla, el cambio local no se pierde y la salud de mapeos reporta la diferencia.
- **Eliminar en el ERP**: no borra físicamente ni en Altosa ni en Meta/Contifico. El producto y sus variantes pasan a estado 3 (anulados) y se desactivan en Meta/Contifico (availability `out of stock` / estado `I`). Aparecen en el filtro **Actividad → Anulados**.
- **No existe borrado definitivo desde el ERP**: los ítems se conservan en Altosa y en los catálogos externos desactivados. Esto evita eliminar productos que puedan tener historial o relaciones en Contifico/Meta.
- **Inactivar un producto** (estado 2) inactiva automáticamente todas sus variantes. Inactivar una variante solo afecta a esa variante. El toggle tiene confirmación antes de inactivar.
- Editar un producto/variante anulado sin cambiar explícitamente de estado **no lo restaura**; para volver a activarlo se usa el toggle correspondiente.
- **Edición con mapeo externo**:
  - Producto: nombre, descripción, categoría/subcategoría y estado se propagan a Meta/Contifico.
  - Variante: nombre, color, descripción, precio, imagen y estado se propagan a Meta/Contifico.
  - Meta recibe `price` en centavos y `availability`; Contifico recibe `estado` (`A`/`I`) y `categoria_id`.
  - Cambiar el nombre del producto actualiza los nombres automáticos de las variantes; los nombres manuales se conservan.
  - Cambiar el color de una variante con nombre automático actualiza el nombre; con nombre manual se conserva.
  - El SKU de una variante mapeada no se puede cambiar desde Altosa.
  - El formulario de variante envía `isActive`; crear una variante con `isActive=false` la crea inactiva.
  - Las actualizaciones externas son best-effort: si Meta/Contifico falla, Altosa conserva el cambio y el error queda en logs. La salud no compara precio/descripción.
- **Visual de estados**:
  - Variante inactiva: fondo gris suave, borde izquierdo gris y badge **Inactiva** (tabla y VariantCard).
  - Variante anulada: fondo rosa suave y badge **Anulada**.
  - No se usa `grayscale` ni opacidad global; texto e imágenes se mantienen legibles.

### Feed CSV para Meta (Commerce Manager)

Altosa expone un feed CSV de solo lectura para que Meta lo use como origen de datos:

- URL: `https://api.altosamobiliario.com/feeds/meta-catalog.csv`
- Auth: Basic Auth con `META_FEED_USER` / `META_FEED_PASSWORD` del `.env` de Altosa. El BFF del ERP también puede leerlo con `x-api-key`.
- Scopes: `published` (default: `meta_retailer_id` o variantes activas), `meta`, `active`, `all`.
- Columnas: las de `meta_plantilla_catalogo.csv` (id, title, description, availability, condition, price, link, image_link, brand, etc.).
- El ERP tiene el botón **Descargar CSV Meta** (BFF `/api/v1/integrations/altosa/meta-feed.csv?scope=published`) para revisar el archivo antes de conectarlo.

Configuración en el VPS:

```bash
cd /docker/altosa_infrastructure
printf '\nMETA_FEED_USER=altosa-meta\nMETA_FEED_PASSWORD=%s\n' "$(openssl rand -base64 36)" >> .env
sudo bash update.sh --api-only
grep -E '^META_FEED_(USER|PASSWORD)=' .env
```

En Commerce Manager: elige **Utiliza una URL**, pega la URL, usuario y contraseña. Primero usa **Actualiza tu lista de datos** para validar; luego **Reemplaza tu lista de datos** si quieres que Meta elimine los ítems que ya no estén en el feed.

### Reconciliación WooCommerce

`scripts/woocommerce-reconcile.mjs` cruza `woo_commerce/productos_woocommerce.json` contra Altosa por `WC-<id de Woo>` (`meta_retailer_id`), slug y nombre. Es dry-run por defecto; `--apply` crea los faltantes en la subcategoría **Catálogo Meta** con `meta_retailer_id`, precio, imagen, URL y stock de Woo.

Resultado del 2026-11-04: 417 existentes + 31 creados con meta ID + 8 creados sin meta ID (aún no existen en Meta) + 2 duplicados existentes (Romeo Beige/Gris) = los 458 productos Woo están representados en Altosa. Los 8 sin meta ID se publican con su SKU estable `WC-<id>` y se pueden mapear cuando existan en Meta.

Estado actual de Altosa: **966 productos / 1.239 variantes**, de las cuales **448 tienen `meta_retailer_id`** y **8 quedaron sin meta ID** (se publican con SKU `WC-<id>`).

### Reset de Altosa

Backup aprobado:

```text
backend/sql/altosa_2026-10-15.schema.backup
```

Script:

```text
scripts/reset-altosa-db.sh
```

Restaura la misma base `altosa` con 110 productos / 241 variantes activas, aplica Meta/Kommo/Nombre de variante, reinicia secuencias y verifica conteos. El backup tiene secuencias en 1; el script ya las corrige. No usar `prisma migrate`.

---

## 10. Frontend: contrato actual

Archivos clave:

```text
frontend/src/features/ai-knowledge-base/products/
  api/products.api.ts
  api/altosa.mappers.ts
  types/product.types.ts
  components/detail/ProductDetailSheet.tsx
  components/detail/sections/VariantCard.tsx
  components/detail/sections/MetaMappingField.tsx
  components/detail/sections/MetaCatalogPicker.tsx
  components/detail/sections/KommoTemplateField.tsx
  components/detail/sections/KommoTemplatePicker.tsx
  components/detail/tabs/VariantsTab.tsx
  hooks/useProduct.ts
  hooks/useProductDetail.ts
  hooks/useAddVariant.ts
  hooks/useUpdateVariant.ts
  hooks/useDeleteVariant.ts
  hooks/useUpdateVariantMetaMapping.ts
```

Endpoints BFF usados por el frontend:

```text
GET    /api/v1/integrations/altosa/products
GET    /api/v1/integrations/altosa/products/:id
GET    /api/v1/integrations/altosa/products/sku/:sku
POST   /api/v1/integrations/altosa/products
PATCH  /api/v1/integrations/altosa/products/:id
DELETE /api/v1/integrations/altosa/products/:id        (anula; no borra)
POST   /api/v1/integrations/altosa/products/:id/variants
PATCH  /api/v1/integrations/altosa/variants/:id
DELETE /api/v1/integrations/altosa/variants/:id        (anula; no borra)
GET    /api/v1/integrations/altosa/categories
GET    /api/v1/integrations/altosa/external/links
GET    /api/v1/integrations/altosa/external/health
GET    /api/v1/integrations/altosa/meta/catalog/search
GET    /api/v1/integrations/altosa/meta/catalog/item
GET    /api/v1/integrations/altosa/meta-feed.csv?scope=published
GET    /api/v1/integrations/altosa/kommo/templates
POST   /api/v1/integrations/kommo/sync-templates
GET    /api/v1/integrations/contifico/products?search=...
GET    /api/v1/integrations/contifico/search
POST   /api/v1/integrations/contifico/sync
```

Notas de UI:

- La lista descarga `active=all` y filtra en cliente; por defecto muestra **Activos**. El toggle **Actividad** tiene **Activos / Inactivos / Anulados** (no hay “Todos” en la UI).
- Los productos inactivos usan fondo suave + badge **Inactivo**; las variantes inactivas fondo gris suave + borde gris + badge **Inactiva**; las anuladas fondo rosa suave + badge **Anulada**. No se atenúa texto/imagen.
- El formulario General tiene toggles de estado y dropdowns dependientes de **Categoría/Subcategoría** desde Altosa.
- La sección **Palabras clave / sinónimos** es editable y persiste en `products.palabras_clave`.
- La VariantCard muestra el switch Activo/Inactivo con confirmación antes de inactivar.
- La fila de producto usa la primera variante con imagen; la VariantCard y la tabla usan la imagen de la variante.
- El stock muestra la fuente: **Contifico**, **Contifico (no encontrado/inactivo/desactualizado)** o **Local / sin mapeo**.
- La sección Meta tiene buscador modal, preview y asignación manual; el backend deja `meta_mapping_locked=true`.
- “Quitar mapeo” envía `metaRetailerId: null` (y deja `metaMappingLocked=true`); “Restaurar sync” envía `metaRetailerId: null, metaMappingLocked: false`.
- “Quitar mapeo” de Contífico envía `contificoId: null, contificoSku: null` y deja `contificoMappingLocked=true`; “Restaurar sync automático” envía `contificoMappingLocked: false`. Guardar la variante no vuelve a crear los mapeos quitados.
- El botón **Descargar CSV Meta** llama a `/api/v1/integrations/altosa/meta-feed.csv?scope=published`.
- “Agregar variante” crea un borrador local; el POST real ocurre al guardar.
- Permisos: lectura `products.read`, edición `products.update`.
- La auditoría de cambios Meta se registra en el backend.

Pendientes frontend:

1. Definir si se agrega una vista “Todos” o acciones masivas de estado.
2. Resolver/importar los ~583 productos Contifico v2 que faltan en Altosa.
3. Revisar las 225 variantes activas sin Contifico y las 91 activas sin Meta.
4. Mejorar visibilidad de fallos de write-through (warnings en respuesta/toast); hoy van a logs.
5. Evaluar `last_synced_at` para mostrar frescura real del sync.
6. Resolver duplicados legacy Contifico/Meta y Woo Romeo Beige/Gris.

---

## 11. Pendientes y riesgos

### Estado vigente (2026-11-06)

- **Contifico**: v2 ve ~1.367 productos; ~583 no están en Altosa. Importar/revisar con `--create-missing` o la bandeja de pendientes. Liliana (`XS-2887T`) ya se puede buscar/mapear.
- **Cobertura**: 225 variantes activas sin Contifico y 91 activas sin Meta. Decidir cuáles mapear/crear y cuáles dejar locales.
- **Meta**: 447 mapeadas; 8 Woo sin meta ID se publican con SKU; 2 duplicados Romeo existentes. No hay borrado de Meta desde el ERP.
- **Write-through**: crear/editar/anular se propaga a Meta/Contifico; las actualizaciones son best-effort y los fallos quedan en logs. La salud no compara precio/descripción.
- **Feed Meta**: omite variantes sin precio/imagen/link; revisar `X-Feed-Skipped`. Basic Auth con `META_FEED_USER/PASSWORD`.
- **Búsqueda Contifico por SKU**: ~20 s la primera vez (catálogo completo); por nombre es rápida; cache 30 s.
- **Frescura del sync**: `updated_at` no se actualiza en el sync; no usarlo como indicador. Considerar `last_synced_at`.
- **Borrado definitivo**: deshabilitado por diseño. Todo se conserva desactivado en Altosa/Meta/Contifico.

### Histórico (pre-Woo/pre-v2)

#### Meta

- 29 conflictos: normalmente dos items Meta apuntando a la misma variante o variantes ya mapeadas. Revisar `meta-variant-report.csv` filtrado por `action=conflict`.
- 2 `ambiguous_color`: misma familia de color, varias variantes (ej. Gris con/sin cabecera).
- 2 `no_color`: el nombre Meta no trae color y el producto tiene varias variantes.
- 783 variantes sin `meta_retailer_id`; la mayoría son inactivas de Contifico, pero hay que confirmar `activas_sin_mapear=0`.

### Contifico

- El sync actual usa `kb_products` local del ERP; refactor pendiente para que escriba directo a Altosa o viva en Altosa.
- El contenido aprobado ya está protegido en Altosa contra sobrescritura.
- Falta write-through completo ERP → Contifico (crear/editar/eliminar variantes y productos).

### Meta escritura

- Altosa publica el ítem plano al crear una variante/producto, actualiza nombre/descripción/precio/imagen/availability al editar y elimina el ítem al borrar (`DELETE`). Desactivar (`isActive=false`) lo deja `out of stock`.
- `catalog_management` está restringido para muchas apps. Si Meta rechaza la escritura, el alta/edición de Altosa continúa y la variante queda sin mapear (se puede reintentar guardando la variante o mapeando a mano).
- Alternativas si no se obtiene `catalog_management`: feed de productos generado por el ERP/Altosa que Meta consuma.
- Para enviar tarjetas WhatsApp no se necesita `catalog_management`; se usa `whatsapp_business_messaging` y el catálogo debe estar vinculado a la WABA.

### Datos

- 110 aprobados + 720 Contifico inactivos + 96 Meta nuevos. Hay posibles duplicados entre aprobados y Contifico; se detectaron 18 candidatos fuzzy, en su mayoría falsos positivos.
- La fuente de verdad del catálogo es Altosa; el ERP es la consola de edición. Contifico sigue siendo fuente de stock/precio y requiere reglas de propiedad de campos.
- `custom_label_0` de Meta está vacío. A futuro conviene llenarlo con un identificador de variante/SKU para que el mapeo sea determinista.

---

## 12. Roadmap sugerido

### Vigente (2026-11-06)

1. Importar/revisar los ~583 productos Contifico v2 faltantes y decidir política de stock local vs Contifico.
2. Resolver las 225 variantes activas sin Contifico y las 91 sin Meta.
3. Agregar warnings de write-through en API/UI y, si se desea, comparación de precio/descripción en health.
4. Evaluar `last_synced_at` y monitoreo de frescura del sync.
5. Resolver duplicados legacy Contifico/Meta y Woo Romeo Beige/Gris.
6. Agregar vista “Todos”/acciones masivas de estado si el negocio lo necesita.
7. Completar pruebas de producción del CRUD y del feed.

### Histórico

1. Cerrar los 33 casos Meta y validar `activas_sin_mapear`.
2. Implementar en el frontend filtro de inactivos/pendientes y flujo de aprobación.
3. Agregar `color_family`/`color_shade`, `product_external_refs` y caché `meta_catalog_items`.
4. Refactorizar el sync de Contifico para que no dependa del staging local.
5. Implementar write-through ERP → Contifico.
6. Implementar salida ERP → Meta por feed o Catalog API.
7. Definir campos maestros: stock/precio (Contifico vs ERP), contenido (ERP/Altosa), Meta (mapping), Kommo (plantillas).
8. Deduplicar aprobados contra Contifico con un proceso de merge controlado.
9. Agregar auditoría visual y monitoreo de syncs.
10. Backups y rollback documentados.

---

## 13. Reglas para el desarrollo del frontend

- No llamar directamente a la base de Altosa ni a las APIs de Meta/Contifico desde el navegador.
- Usar siempre el BFF del ERP.
- No hardcodear tokens ni claves.
- No cambiar contratos del backend sin actualizar ambos lados.
- Mantener textos en español y el estilo de componentes existente.
- Respetar permisos `products.read` y `products.update`.
- Crear/editar sí intenta propagar a Meta/Contifico (best-effort); no asumir que un fallo externo bloqueó el cambio local: revisar logs/health.
- No eliminar productos; anular. El borrado definitivo está deshabilitado.
- No usar `--prune` ni scripts destructivos sin confirmación.
- Para Contifico usar v2 en listado/búsqueda/sync; no volver a v1 para listar.
- No tocar cambios pendientes de Kommo.
- Ejecutar `pnpm type-check`, `pnpm lint` y `pnpm build` en el frontend antes de terminar; en Altosa `pnpm type-check` y `pnpm build`.
- No commitear salvo que se pida.

---

## 14. Prompt listo para usar con una IA de frontend

```text
Actúa como desarrollador senior frontend en el proyecto Unyx ERP.

Contexto:
- El frontend está en D:\Trabajo\Unyx Solutions\Develop\unyx_erp\frontend.
- La pantalla de productos está en frontend/src/features/ai-knowledge-base/products.
- El ERP es el sistema de gestión: su PostgreSQL interno es para auth, usuarios, roles, permisos, auditoría y operaciones internas.
- La base de conocimiento del catálogo está en Altosa (altosa-api + PostgreSQL Altosa), no en la base del ERP.
- El frontend no lee ninguna base directamente: llama al BFF del ERP.
- El BFF del ERP consume la API de Altosa; nunca se conecta directo a PostgreSQL de Altosa.
- Altosa es la base del catálogo. El ERP backend es un BFF.
- `estado_id`: 1 activo, 2 inactivo, 3 anulado; `is_active` se deriva (solo estado 1).
- Meta se mapea en `product_variants.meta_retailer_id`; el token vive solo en Altosa.
- Crear/editar sí intenta write-through a Meta/Contifico (best-effort). El borrado definitivo está deshabilitado: solo se anula.
- Contifico v2 es la fuente de listado/búsqueda/sync (~1.367 productos); v1 está incompleto (784).
- Estado Altosa: 966 productos / 1.239 variantes; 447 con Meta; 225 variantes activas sin Contifico; 91 activas sin Meta.
- Hay 815 productos inactivos; el toggle `Actividad` permite `Activos`/`Inactivos`/`Anulados`, con fondo suave y badge.
- Categoría/Subcategoría vienen de `/api/v1/categories`; palabras clave se guardan en `products.palabras_clave`.

Objetivo de esta tarea:
[describir la tarea concreta, por ejemplo: agregar filtro de inactivos, flujo de aprobación, mejorar sección Meta, etc.]

Reglas:
- Usar el BFF existente y los tipos/API actuales.
- No llamar directamente a Altosa ni a Meta desde el navegador.
- No hardcodear tokens.
- No eliminar productos; desactivar.
- Respetar permisos products.read/products.update.
- Mantener español y estilo visual actual.
- No cambiar backend sin coordinarlo.
- Ejecutar pnpm type-check, pnpm lint y pnpm build al terminar.

Entregable:
- Cambios de UI/UX, componentes, hooks y tipos necesarios.
- Resumen de archivos modificados.
- Pruebas manuales sugeridas.
```

---

## 15. Comandos de verificación

ERP frontend:

```bash
cd /opt/unyx-erp/frontend
pnpm type-check
pnpm lint
pnpm build
```

Altosa backend:

```bash
cd /docker/altosa_infrastructure/backend
pnpm type-check
pnpm build
```

ERP backend:

```bash
cd /opt/unyx-erp/backend
pnpm type-check
pnpm build
```

Deploy:

```bash
cd /docker/altosa_infrastructure
sudo bash update.sh --api-only
bash scripts/healthcheck.sh

cd /opt/unyx-erp
sudo bash deploy/deploy-prod.sh
```

Auditorías y reportes:

```bash
# Altosa vs Contifico
cd /docker/altosa_infrastructure
bash scripts/contifico-parity.sh --only-active --fail-on-mismatch
bash scripts/contifico-parity.sh

# Nombres de variante
bash scripts/backfill-variant-names.sh
bash scripts/backfill-variant-names.sh --apply

# WooCommerce
cd /opt/unyx-erp
pnpm woo:reconcile
pnpm woo:reconcile --apply

# Feed Meta (Basic Auth)
cd /docker/altosa_infrastructure
set -a; . ./.env; set +a
curl -sS -u "$META_FEED_USER:$META_FEED_PASSWORD" -D - -o /tmp/meta.csv \
  "https://api.altosamobiliario.com/feeds/meta-catalog.csv?scope=published"
```

---

## 16. Archivos y scripts importantes

Altosa:

```text
backend/prisma/schema.prisma
backend/prisma/sql/meta_retailer_id.sql
backend/prisma/sql/kommo_templates.sql
backend/prisma/sql/variant_nombre.sql
backend/prisma/sql/product_keywords.sql
backend/src/modules/meta-feed/
backend/src/modules/meta/
backend/src/scripts/sync-meta-mappings.ts
backend/src/scripts/suggest-meta-mappings.ts
backend/src/scripts/reconcile-meta-variants.ts
backend/src/scripts/backfill-meta-retailer-ids.ts
backend/src/scripts/seed-products.ts
backend/src/scripts/backfill-variant-names.ts
backend/src/scripts/audit-contifico-parity.ts
backend/src/modules/contifico/contifico-client.ts
backend/src/modules/contifico/contifico-catalog.ts
backend/src/modules/contifico/contifico-service.ts
backend/src/modules/contifico/contifico-sync.ts
backend/src/modules/contifico/contifico-routes.ts
backend/prisma/sql/contifico_mapping.sql
scripts/apply-contifico-migration.sh
scripts/apply-variant-nombre-migration.sh
scripts/apply-product-keywords-migration.sh
scripts/contifico-sync.sh
scripts/contifico-parity.sh
scripts/backfill-variant-names.sh
scripts/reset-altosa-db.sh
```

ERP backend:

```text
backend/src/integrations/altosa/altosa-client.ts
backend/src/integrations/altosa/altosa-service.ts
backend/src/integrations/altosa/altosa-write-through.ts
backend/src/integrations/altosa/altosa-local-sync.ts
backend/src/integrations/altosa/altosa-contifico-proxy.ts
backend/src/integrations/altosa/altosa-external-service.ts
backend/src/integrations/altosa/altosa-controller.ts
backend/src/integrations/altosa/altosa-routes.ts
backend/src/integrations/altosa/altosa-schema.ts
backend/scripts/backfill-altosa-mappings.ts
deploy/deploy-prod.sh
scripts/woocommerce-reconcile.mjs
```

ERP frontend:

```text
frontend/src/features/ai-knowledge-base/products/api/products.api.ts
frontend/src/features/ai-knowledge-base/products/api/altosa.mappers.ts
frontend/src/features/ai-knowledge-base/products/types/product.types.ts
frontend/src/features/ai-knowledge-base/products/components/detail/ProductDetailSheet.tsx
frontend/src/features/ai-knowledge-base/products/components/detail/sections/VariantCard.tsx
frontend/src/features/ai-knowledge-base/products/components/ProductVariantsPanel.tsx
frontend/src/features/ai-knowledge-base/products/components/MetaFeedDownloadButton.tsx
frontend/src/features/ai-knowledge-base/products/components/detail/sections/MetaMappingField.tsx
frontend/src/features/ai-knowledge-base/products/components/detail/sections/MetaCatalogPicker.tsx
frontend/src/features/ai-knowledge-base/products/components/detail/sections/KommoTemplateField.tsx
frontend/src/features/ai-knowledge-base/products/components/detail/sections/KommoTemplatePicker.tsx
frontend/src/features/ai-knowledge-base/products/components/detail/tabs/VariantsTab.tsx
frontend/src/features/ai-knowledge-base/products/hooks/
```

---

## 17. Resumen ejecutivo

- El ERP es la consola de gestión; su PostgreSQL interno es para auth, permisos, usuarios, auditoría y operaciones internas.
- Altosa API + PostgreSQL Altosa es la **base de verdad del catálogo**; el ERP solo habla con Altosa vía BFF.
- Estado verificado 2026-11-06: **966 productos / 1.239 variantes**; 151 productos activos; 284 variantes activas; 447 con Meta; 780 con Contifico; 225 activas sin Contifico; 91 activas sin Meta.
- Contifico v2 es la fuente de listado/búsqueda/sync (~1.367 productos); v1 está incompleto (784).
- WooCommerce: 458 productos representados; 39 creados; 2 duplicados; 8 sin meta ID.
- El CRUD de productos/variantes está implementado: crear, editar, activar/inactivar, anular (estado 3), sin borrado definitivo.
- Editar producto/variante propaga a Meta/Contifico (nombre, descripción, precio, imagen, estado, categoría) de forma best-effort.
- Categoría/subcategoría se seleccionan desde Altosa; las palabras clave son editables y persistentes.
- El feed CSV de Meta está disponible y el ERP tiene botón de descarga.
- Pendientes principales: importar los ~583 productos Contifico faltantes, resolver cobertura de variantes sin Contifico/Meta y agregar warnings/health de precio-descripción.
- El modelo producto-variante es correcto; no hay que rediseñarlo.
- Para escalar: mapeo determinista, referencias externas, caché Meta, deduplicación y reglas de propiedad de campos.
```
