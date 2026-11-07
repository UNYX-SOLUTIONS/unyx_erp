# Integración Contifico ↔ Altosa ↔ ERP Unyx

> Actualizado 2026-11-06. El catálogo de Contifico se lista/busca/sincroniza
> con **API v2** porque v1 devolvía solo 784 productos (incompleto); v2 devuelve
> ~1.371 (1.367 únicos). v1 queda para categorías y para leer/actualizar por ID.

## Decisión de arquitectura

Desde la migración de integraciones, **Altosa es la única dueña del cliente y
del token de Contifico**. El ERP Unyx ya no lee `CONTIFICO_API_KEY` ni llama a
Contifico: solo invoca la API de Altosa. Así cada cliente nuevo mantiene sus
credenciales en su propio proyecto y el `.env` del ERP no acumula tokens de
terceros.

```
Contifico API v1/v2
   ▲  sync nativo + write-through (token solo en Altosa)
   │
Altosa API + PostgreSQL
   │  productos, variantes, contifico_id/contifico_sku, sync
   ▲  x-api-key
   │
ERP Unyx BFF (/api/v1/integrations/contifico/*)
   ▲  JWT del ERP
   │
Frontend ERP (buscador, importación, edición)
```

- El navegador solo habla con el BFF del ERP.
- El BFF de Contifico es un **proxy de compatibilidad** hacia Altosa. No guarda
  token ni implementa lógica de Contifico.
- La escritura a Contifico (alta, edición, desactivación) la ejecuta Altosa.
- La lectura/sync de catálogo también la ejecuta Altosa contra su propia DB.
- La aprobación (`isActive`/`validation`) sigue siendo del ERP.

## Configuración

### Altosa (`altosa_infrastructure/.env`)

```env
CONTIFICO_API_URL=https://api.contifico.com/sistema/api/v1
CONTIFICO_API_KEY=<api key de Contifico>
# CONTIFICO_API_TOKEN=  # opcional POS; no se usa para inventario
```

- `CONTIFICO_API_KEY` se envía en `Authorization` tal cual (sin `Bearer`).
- `CONTIFICO_API_URL` se mantiene en **v1**. El código deriva la URL v2 para:
  - listar productos (`/producto/?page=N`, respuesta `{ count, next, results }`),
  - buscar por nombre (`/producto/?search=...`),
  - leer el catálogo completo para sync y para el fallback por SKU/código de barra.
- v1 se usa para categorías y para leer/actualizar un producto por ID. El item
  por ID responde tanto en v1 como en v2.
- **No volver a usar v1 para listar/buscar productos**: devuelve un catálogo
  incompleto (784 vs ~1.371) y no encuentra productos que solo existen en v2.
- El token de Contifico nunca debe copiarse al `.env` del ERP ni al frontend.
- Reinicia `altosa-api` después de cambiarlo (`sudo bash update.sh --api-only`).

### ERP (`unyx_erp/backend/.env`)

```env
ALTOSA_API_URL=http://localhost:4100
ALTOSA_API_KEY=<misma clave que altosa_infrastructure/.env>
# CONTIFICO_API_KEY ya NO se usa en el ERP.
```

Si el `.env.production` del ERP todavía tiene `CONTIFICO_*`, se pueden eliminar:
el backend ya no las lee. En Docker/VPS las variables salen de
`.env.production`/`docker-compose.prod.yml`.

## Migración desde la versión anterior

1. **Altosa primero**:
   - agregar `CONTIFICO_API_URL`/`CONTIFICO_API_KEY` al `.env` de Altosa;
   - `sudo bash update.sh` (aplica `contifico_id`/`contifico_sku` y reinicia);
   - `bash scripts/healthcheck.sh` debe mostrar `OK` de las columnas y del
     estado de Contifico.
2. **Backfill de mapeos existentes (ERP)**. El staging local conserva
   `sourceRowKey = contifico:<id>` de la etapa anterior. Este script copia ese
   mapeo a Altosa **sin llamar a Contifico** y solo para SKUs que ya existen en
   Altosa:

   ```bash
   cd /opt/unyx-erp
   docker compose --env-file .env.production -f docker-compose.prod.yml \
     exec -T unyx-backend node dist/scripts/backfill-altosa-mappings.js
   ```

   Es idempotente. Reporta `synced`, `skipped` (SKU no encontrado en Altosa) y
   `failed`. Los `skipped` se pueden enlazar después con el sync por nombre o
   manualmente desde la variante.
3. **ERP backend/frontend**: desplegar. El BFF seguirá exponiendo las mismas
   rutas `/api/v1/integrations/contifico/*`, ahora como proxy a Altosa.
4. **Quitar el cron viejo** de `deploy/contifico-sync.sh` en el VPS del ERP y
   programar el nuevo en el VPS de Altosa:

   ```bash
   # Altosa
   bash scripts/contifico-sync.sh --dry-run
   bash scripts/contifico-sync.sh --apply
   # Cron sugerido (cada 15 min)
   */15 * * * * cd /ruta/altosa_infrastructure && bash scripts/contifico-sync.sh --apply >> /var/log/altosa-contifico-sync.log 2>&1
   ```

## Sync nativo (Altosa)

`POST /api/v1/contifico/sync` o `scripts/contifico-sync.sh`:

- Descarga el catálogo **v2** completo (activos e inactivos) en paralelo; tarda
  ~20 s y queda cacheado 30 s. v2 devuelve ~1.367 productos únicos, no los 784
  incompletos de v1.
- Actualiza variantes existentes por `contifico_id`, `contifico_sku`, `sku` o,
  con `matchByName`, por nombre plano (producto + color).
- Conserva nombre/color/descripción/imagen de variantes **activas** (contenido
  curado); solo actualiza precio, stock, specs y mapeo.
- `createMissing=false` por defecto: los productos de Contifico que no existen
  en Altosa se cuentan como `ignored` y no se crean.
- `createMissing=true`: crea producto padre + variante **inactivos**, guardando
  `contifico_id`/`contifico_sku`.
- Al cambiar de v1 a v2 aparecieron ~583 productos que estaban fuera del listado
  anterior. Revisar dry-run y decidir su importación:
  `--create-missing` o la bandeja de pendientes del ERP.
- `prune=true`: desactiva variantes mapeadas a Contifico que ya no aparecen en
  el catálogo; no borra filas. No se combina con `onlySku`.
- `dryRun=true`: solo cuenta, no escribe.
- `matchByName=true`: enlaza por nombre plano cuando no hay SKU/ID.

Formato:

```bash
bash scripts/contifico-sync.sh --dry-run --match-by-name
bash scripts/contifico-sync.sh --apply --match-by-name
bash scripts/contifico-sync.sh --dry-run --create-missing --match-by-name
bash scripts/contifico-sync.sh --apply --create-missing --match-by-name
bash scripts/contifico-sync.sh --apply --prune            # reconciliación manual
```

La búsqueda del selector de mapeo usa v2:
- Nombre: `search` de v2, rápido.
- SKU/código de barra: descarga el catálogo completo cacheado (~20 s la primera
  vez) y filtra localmente; después responde desde caché 30 s.

La respuesta incluye `products.{fetched,created,updated,ignored,skipped,pruned}`
y `variants.{created,updated,skipped,deactivated}`.

- `updated` es la cantidad de variantes que el sync **reescribe** (precio/stock/
  specs/mapeo), no la cantidad de diferencias. Una corrida con `updated: 783`
  significa que las 783 se enlazaron y se actualizaron; no que haya 783 cambios.
- `ignored: 0` + `created: 0` significa que todo el catálogo de Contifico ya
  existe en Altosa. No hace falta `--create-missing`.
- `skipped` cuenta variantes que no se procesaron por duplicado/SKU inválido.
- Verificación de mapeo persistido (Altosa):

```sql
SELECT
  count(*) AS total,
  count(contifico_id) AS con_contifico_id,
  count(contifico_sku) AS con_contifico_sku
FROM product_variants;
```

Si `con_contifico_id` es 0 después de un `--apply`, revisa que el `--apply` se
haya ejecutado (el `--dry-run` no escribe) y que el token de Altosa sea el
correcto.

## Endpoints

### Altosa (requieren `x-api-key`)

| Método | Ruta | Uso |
|---|---|---|
| `GET` | `/api/v1/contifico/status` | Indica si el token está configurado (sin exponerlo) |
| `GET` | `/api/v1/contifico/search?q=&limit=` | Sugerencias por nombre/SKU e `alreadyAdded`/`altosaProductId` |
| `GET` | `/api/v1/contifico/products?search=&limit=` | Catálogo plano para el selector |
| `GET` | `/api/v1/contifico/products/:id` | Detalle de un producto de Contifico |
| `GET` | `/api/v1/contifico/categories` | Categorías de Contifico |
| `POST` | `/api/v1/contifico/import` | Importa un producto (`contificoId` o `sku`) a Altosa, inactivo |
| `POST` | `/api/v1/contifico/sync` | Sync nativo (ver opciones arriba) |

### ERP (proxies, requieren JWT)

| Método | Ruta | Destino |
|---|---|---|
| `GET` | `/api/v1/integrations/contifico/status` | Altosa |
| `GET` | `/api/v1/integrations/contifico/search` | Altosa |
| `GET` | `/api/v1/integrations/contifico/products` | Altosa |
| `GET` | `/api/v1/integrations/contifico/products/:id` | Altosa |
| `GET` | `/api/v1/integrations/contifico/categories` | Altosa |
| `POST` | `/api/v1/integrations/contifico/import` | Altosa |
| `POST` | `/api/v1/integrations/contifico/sync` | Altosa |

## CRUD desde el ERP (write-through en Altosa)

1. **Crear producto** → el ERP crea el staging local y envía el alta a Altosa.
   Altosa crea el producto/variante y, con `writeThroughContifico=true`, crea el
   producto plano en Contifico y guarda `contifico_id`/`contifico_sku`.
2. **Editar producto** → Altosa actualiza sus filas y, si la variante tiene
   `contifico_id`, actualiza nombre/descripción/precio/estado en Contifico.
3. **Editar variante** → Altosa guarda el cambio local y luego intenta
   actualizar `nombre`, `descripcion`, `pvp1` y `estado` en Contifico
   (best-effort; si falla, el cambio local se conserva y queda en logs).
   El SKU de una variante mapeada está bloqueado; se cambia en Contifico o se
   quita el mapeo.
   Editar una variante **no** vuelve a crear mapeos quitados. Al quitar el
   mapeo se guarda `contifico_mapping_locked=true`; el sync no la reenlaza por
   SKU/nombre hasta que se use **Restaurar sync automático**.

4. **Agregar variante** → Altosa crea el producto plano en Contifico e intenta
   guardar `contifico_id`/`contifico_sku`.
5. **Eliminar en el ERP = anular** (estado 3): no hay borrado físico. Altosa
   desactiva la variante/producto (`estado = I` en Contifico, `out of stock` en
   Meta) y el ERP lo muestra en **Actividad → Anulados**. Nada se borra en
   Altosa/Meta/Contifico.

## Mapeo de campos

| Contifico | Altosa |
|---|---|
| `id` | `product_variants.contifico_id` |
| `codigo` | `product_variants.contifico_sku` y `sku` de la variante |
| `nombre` | `products.producto` + color (nombre plano al crear en Contifico) |
| `descripcion` | `products.descripcion` / `product_variants.descripcion` |
| `categoria_id` | `categories.nombre` / `subcategories.nombre` |
| `pvp1` | `product_variants.precio_usd` |
| `cantidad_stock` | `especificacionesAdicionales.stock` |
| `estado` (`A`/`I`) | `is_active` de producto/variante |
| `codigo_barra`, `porcentaje_iva`, `minimo`, `marca_nombre`, `tipo` | `especificacionesAdicionales` |
| `imagen` | `product_variants.imagen_url` (read-only en Contifico) |

## Detalles de la API v1 (conservados)

- `POST /api/v1/producto/`: crea. Campos obligatorios: `codigo`, `nombre`,
  `minimo`, `pvp1`, `estado`; `pvp_manual: true` cuando `pvp1 = 0`.
- `GET /api/v1/producto/{id}/`: **requiere slash final**.
- `PATCH /api/v1/producto/{id}/`: parcial, responde `204`; el cliente vuelve a
  leer para devolver el detalle.
- `GET /api/v1/producto/`: array; `filtro` funciona para nombre/código. Se
  consultan estados `A` e `I` para propagar desactivaciones.
- `imagen` es **read-only**: el `PATCH` responde `204` pero no cambia la imagen.
- No hay `DELETE`; se desactiva con `estado = I`.
- Límite de Contifico: ~100 solicitudes/minuto por empresa; el sync pagina de
  100 en 100.

## Límites conocidos

- Contifico representa variantes como atributos, no como SKUs vendibles; cada
  variante de Altosa se publica como un producto plano independiente.
- Los productos nuevos que entran por sync/ingesta nacen inactivos y requieren
  aprobación humana en el ERP.
- El sync masivo no reactiva productos desactivados.
- El contenido de la tarjeta Meta no se reescribe aún desde el ERP.
- El stock se lee de Contifico; no se edita desde el ERP.
