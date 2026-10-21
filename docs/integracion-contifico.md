# Integración ERP Unyx ↔ Contifico ↔ Altosa

## Objetivo y dirección del flujo

**Contifico es la fuente de verdad del inventario.** El ERP mantiene un espejo
relacional local y replica el catálogo hacia la base de conocimiento de Altosa
(usada por el asistente IA).

Referencia usada: [Contifico API v1](https://api.contifico.com/sistema/api/v1/documentacion/),
tag **Producto** (`POST`, `GET`, `PATCH`; no hay `DELETE`).

> **¿Por qué v1 y no v2?** En la práctica, el listado v2 devuelve un objeto
> paginado (`{ count, next, results }`) con IDs distintos a los de v1 e **ignora
> el parámetro `filtro`**. El listado/búsqueda/get de v1 devuelve arrays, filtra
> correctamente por nombre/código y usa los IDs que sí funcionan en el CRUD. El
> código conserva el camino v2 para cuando se necesite, pero el default y el
> flujo probado son v1.

```
                        ┌──────────────────────────────┐
                        │ Contifico (API v1)           │
                        │ productos + stock + precios  │
                        └──────────────┬───────────────┘
                                       │ GET /producto, /categoria
                                       ▼
┌──────────────────────────────────────────────────────────────────┐
│ ERP Unyx backend                                                 │
│                                                                  │
│  sync: Contifico ──► Prisma ──► kb_products                      │
│                              └► kb_product_variants              │
│                                                                  │
│  CRUD frontend ──► BFF /integrations/altosa ──► Contifico        │
│                                      └► DB local                 │
│                                      └► altosa-api               │
└──────────────────────────────────────────────┬───────────────────┘
                                               │ HTTP + x-api-key
                                               ▼
                              ┌────────────────────────────────────┐
                              │ altosa-api (DB Altosa)             │
                              │ POST /api/v1/sync/products         │
                              │ products / product_variants        │
                              └────────────────────────────────────┘
                                               ▲
                                               │ lectura BFF
                              ┌────────────────┴───────────────────┐
                              │ Frontend (Inventario + KB IA)      │
                              │ + buscador Contifico en alta       │
                              └────────────────────────────────────┘
```

Reglas:

- El navegador **solo** habla con el backend del ERP (patrón BFF).
- La API key de Contifico y la de altosa-api viven únicamente en los `.env` de
  los backends; nunca se envían al frontend.
- Contifico manda: si un producto cambia de nombre, precio, stock o estado en
  Contifico, la siguiente sincronización lo refleja en el ERP y en Altosa.

## Configuración

### ERP (`unyx_erp/backend/.env`)

```env
CONTIFICO_API_URL=https://api.contifico.com/sistema/api/v1
CONTIFICO_API_KEY=<api key de Contifico>
CONTIFICO_API_TOKEN=<pos token opcional>

# Altosa (ya existente)
ALTOSA_API_URL=http://localhost:4100
ALTOSA_API_KEY=<misma clave que altosa_infrastructure/.env>
```

- `CONTIFICO_API_KEY` se envía en el header `Authorization` tal cual (sin
  `Bearer`), como indica la documentación de Contifico.
- `CONTIFICO_API_TOKEN` es el token de POS. No se usa para los endpoints de
  producto; queda disponible para futuras integraciones POS.
- `CONTIFICO_API_URL` debe quedar en `v1`. El código tiene un camino v2, pero el
  listado/búsqueda de v2 devuelve otro formato e IDs y no filtra por `filtro`.
- Si el backend corre en Docker, define las mismas variables en el `.env` raíz
  o `.env.production`; `docker-compose*.yml` ya las inyecta al contenedor.
  Después reinicia `unyx-backend`.
- Nunca pongas estas claves en `frontend/.env.local`.

### altosa-api (`altosa_infrastructure/backend/.env`)

Sin cambios nuevos: usa el `API_KEY` existente para autenticar al ERP.

## Puesta en marcha

1. Configurar las variables del ERP y de altosa-api.
2. Ejecutar la primera importación desde la consola del backend del ERP:

   ```bash
   pnpm --dir backend sync:contifico
   ```

   Opciones:

   ```bash
   pnpm --dir backend sync:contifico -- --dry-run
   pnpm --dir backend sync:contifico -- --skip-altosa
   pnpm --dir backend sync:contifico -- --only 613
   pnpm --dir backend sync:contifico -- --match-by-name
   pnpm --dir backend sync:contifico -- --prune
   ```

   > **Importante:** por defecto la sincronización **solo actualiza productos
   > que ya existen en el ERP**. Los ~1000 productos de Contifico que no estén
   > en tu base **no se importan**: quedan como `ignored` y se agregan a demanda
   > desde el buscador del panel de producto.
   >
   > **Migración inicial recomendada** (DB con catálogo viejo del ETL):
   >
   > ```bash
   > pnpm --dir backend sync:contifico -- --dry-run --match-by-name
   > pnpm --dir backend sync:contifico -- --match-by-name
   > ```
   >
   > Así se enlazan por nombre los productos existentes y la variante principal
   > adopta el `codigo` real de Contifico. Los que no están en tu base se
   > ignoran, no se crean.
   >
   > Solo si quieres importar **todo** Contifico de una vez (no recomendado):
   > `--create-missing`.

3. En el frontend, al abrir **Nuevo producto**, aparece el buscador
   **“Buscar en Contifico”**. Al escribir un nombre o SKU se muestran
   sugerencias; al elegir una, se confirma y se importa **solo ese producto**.
   El resto del frontend sigue leyendo el BFF de Altosa.

### Si altosa-api no está accesible en ese momento

Se puede exportar el payload canónico y sembrarlo después de forma offline:

```bash
pnpm --dir backend sync:contifico -- --skip-altosa \
  --export ../Backends\ Clientes/altosa_infrastructure/backend/data/contifico-products.json

cd "D:\Trabajo\Unyx Solutions\Develop\Backends Clientes\altosa_infrastructure\backend"
pnpm seed:products -- data/contifico-products.json
# Si Altosa ya tenía el catálogo del ETL y quieres enlazarlo por nombre:
pnpm seed:products -- data/contifico-products.json --match-by-name
```

El seed procesa el JSON en lotes de 100 y es idempotente por SKU. Si el export
incluye `deactivateSkus`, el seed también desactiva esos SKUs en Altosa.

## Productos existentes, duplicados y productos viejos

**No se recomienda borrar y reinsertar todo.** Un `TRUNCATE`/delete masivo:

- pierde `commercialDescription`, `keywords`, validación y demás enriquecimiento
  del ERP/IA;
- cambia los IDs de producto y variante, rompiendo referencias de Altosa,
  embeddings y enlaces internos;
- no es atómico: si falla a mitad del proceso, deja el catálogo incompleto.

La estrategia implementada es **upsert + reconciliación**, que es el equivalente
seguro a "reemplazar el catálogo":

1. **Enlazar** lo existente:
   - primero por `sourceRowKey = contifico:<id>`;
   - luego por SKU (`codigo`);
   - con `--match-by-name`, por nombre (migración inicial desde el ETL).

2. **Actualizar los existentes.** Por defecto `createMissing = false`: los
   productos de Contifico que no están en el ERP se cuentan como `ignored` y
   **no se importan**. Solo se crean nuevos con `--create-missing` (no
   recomendado) o, mejor, a demanda desde el buscador.

3. **Agregar nuevos a demanda.** En el panel **Nuevo producto**, el buscador
   “Buscar en Contifico” consulta por nombre o SKU y muestra solo los que aún
   no están en el catálogo. Al confirmar “Agregar producto”, el backend:
   - lee ese producto puntual de Contifico;
   - hace upsert en `kb_products`/`kb_product_variants`;
   - lo replica a Altosa;
   - devuelve el ID de Altosa para abrir el panel de edición.

4. **Reconciliar** con `--prune`:
   - los productos locales que no vinieron en el catálogo de Contifico se marcan
     `isActive = false` (no se borran);
   - sus SKUs se envían a `POST /api/v1/sync/products/deactivate` de Altosa,
     que desactiva las variantes y el producto si se queda sin variantes activas;
   - la UI de Altosa filtra `active=true`, así que los productos viejos
     desaparecen de la vista sin perder la fila ni el historial.

Seguridades de `--prune`:

- Se niega a combinarse con `--only`.
- No hace nada si Contifico devuelve 0 productos.
- No hace nada si hubo productos omitidos por error durante el upsert.
- `--dry-run --prune` muestra cuántos se desactivarían y una muestra de SKUs.
  Para la lista completa, usa `--export`; el JSON incluye `deactivateSkus`.
- Si un producto reaparece en Contifico, la siguiente sincronización lo vuelve a
  activar con sus datos actuales.

Después de la migración inicial:

```bash
# Solo actualizar los productos que ya existen en el ERP:
pnpm --dir backend sync:contifico

# Actualizar y desactivar los locales que ya no estén en Contifico:
pnpm --dir backend sync:contifico -- --prune

# Importar TODO Contifico de golpe (no recomendado):
pnpm --dir backend sync:contifico -- --create-missing
```

## Endpoints

### ERP (requieren JWT del ERP)

| Método | Ruta | Uso |
|---|---|---|
| `POST` | `/api/v1/integrations/contifico/sync` | Actualiza productos existentes → DB local → Altosa. Body opcional: `{ "dryRun": false, "pushToAltosa": true, "onlySku": "613", "matchByName": false, "prune": false, "createMissing": false }` |
| `GET` | `/api/v1/integrations/contifico/search?q=&limit=` | Buscador del panel de producto: sugiere productos de Contifico y marca `alreadyAdded` |
| `POST` | `/api/v1/integrations/contifico/import` | Importa un producto puntual: `{ "contificoId": "..." }` o `{ "sku": "..." }` → DB local → Altosa. Devuelve `altosaProductId` |
| `GET` | `/api/v1/integrations/contifico/status` | Indica si la API key está configurada (sin exponerla) |
| `GET` | `/api/v1/integrations/contifico/products?search=&limit=` | Diagnóstico: lee productos directo de Contifico |
| `GET` | `/api/v1/integrations/contifico/products/:id` | Diagnóstico: un producto de Contifico |
| `GET` | `/api/v1/integrations/contifico/categories` | Diagnóstico: categorías de Contifico |

### altosa-api (requieren `x-api-key`)

| Método | Ruta | Uso |
|---|---|---|
| `POST` | `/api/v1/sync/products` | Upsert masivo idempotente por SKU de variante. Body: `{ "items": [...] }`, máx. 100 ítems |
| `POST` | `/api/v1/sync/products/deactivate` | Desactiva variantes/productos por SKU (reconciliación). Body: `{ "skus": ["..."] }`, máx. 500 SKUs |

Ejemplo de ítem:

```json
{
  "codigo": "613",
  "nombre": "Guata con Arroz",
  "descripcion": "Guata con Arroz",
  "usoRecomendado": null,
  "categoria": "Abarrotes",
  "subcategoria": "General",
  "estado": "A",
  "variantes": [
    {
      "sku": "613",
      "color": "Estándar",
      "precioUsd": 5.6,
      "imagenUrl": null,
      "especificaciones": {
        "stock": 0,
        "contifico_id": "GP9aQ1Ro1BcjZaDM",
        "porcentaje_iva": 15
      }
    }
  ]
}
```

## Mapeo Contifico → DB local → Altosa

| Contifico | `kb_products` | `kb_product_variants` | Altosa |
|---|---|---|---|
| `id` | `sourceRowKey = contifico:<id>` | `sourceRowKey = contifico:<id>` | metadata en `especificacionesAdicionales` |
| `codigo` | `sku` | `sku` (variante principal) | `product_variants.sku` |
| `nombre` | `name` | `name = "Estándar"` | `products.producto` |
| `descripcion` | `description` y `commercialDescription` | `description` | `products.descripcion` / variante |
| `categoria_id` | `category` y `line` | — | `categories.nombre` |
| — | `subcategory = "General"` | — | `subcategories.nombre` |
| `pvp1` | — | `price` | `product_variants.precio_usd` |
| `cantidad_stock` | — | `stock` (entero redondeado) | `especificacionesAdicionales.stock` |
| `estado` (`A`/`I`) | `isActive` | `isActive` | `products.is_active` |
| `codigo_barra`, `porcentaje_iva`, `minimo`, `marca_nombre`, `tipo` | — | `especificaciones` (JSON) | `especificacionesAdicionales` (JSON) |
| `imagen` | `thumbnailUrl` | `imageUrl` | `product_variants.imagen_url` |

Notas de stock: `KbProductVariant.stock` es `Int`; el valor decimal exacto de
Contifico queda en `especificaciones.stock`. Si más adelante se necesita
precisión decimal nativa, se puede migrar la columna a `Decimal(14,4)`.

En Altosa, los productos **nuevos** se crean con la categoría/subcategoría de
Contifico; los productos **existentes** conservan la taxonomía curada por el
equipo de IA. La sincronización actualiza nombre, descripción, precio, stock,
imagen y estado, pero no mueve productos entre subcategorías (salvo un edit
explícito desde el ERP, que envía `updateTaxonomy`).

El SKU visible en la UI ahora es el `codigo` real de Contifico (se toma del SKU
de la variante principal); antes el mapper mostraba `ALT-<id>`. El listado y el
panel de edición no cambiaron; el único cambio de UI es el buscador de Contifico
en el panel de **Nuevo producto**.

## CRUD desde el ERP

El listado y el panel de edición se mantienen. El panel **Nuevo producto** ahora
incluye el buscador **“Buscar en Contifico”**; el listado sigue leyendo y
escribiendo contra el BFF `/api/v1/integrations/altosa`. Ese BFF es el
orquestador: usa el servicio de productos del ERP para escribir primero en
Contifico, luego en la DB local y finalmente en Altosa.

1. **Agregar una sugerencia de Contifico** → se lee ese producto puntual de
   Contifico (no se crea nada nuevo en Contifico), se hace upsert en la DB local
   y se replica a Altosa. Es el flujo para sumar productos de los ~1000 de
   Contifico sin importarlos todos.
2. **Crear manualmente** → `POST /producto/` en Contifico (código, nombre,
   categoría, `pvp1` inicial), luego en la DB local y en Altosa.
3. **Editar producto** → `PATCH /producto/{id}/` en Contifico (nombre,
   descripción, categoría y estado); después en la DB local y Altosa. Los campos
   `keywords` y `subcategory` son enriquecimiento del ERP/IA.
4. **Editar variante principal** → precio y descripción se actualizan en
   Contifico (`pvp1`, `descripcion`). El stock **no** se edita desde el ERP:
   viene de Contifico.
5. **Eliminar** → no existe `DELETE` en Contifico: se desactiva con
   `PATCH /producto/{id}/` y `estado = I`; se marca inactivo en local y Altosa.

### Detalles del CRUD (v1)

- `POST /api/v1/producto/`: crea. Campos obligatorios: `codigo`, `nombre`,
  `minimo`, `pvp1`, `estado`. Se envía `pvp_manual: true` cuando `pvp1 = 0`.
- `GET /api/v1/producto/{id}/`: obtiene un producto. **Requiere el slash final**
  (sin slash la API responde 401 en este tenant).
- `PATCH /api/v1/producto/{id}/`: actualiza de forma parcial y responde `204`;
  el cliente vuelve a leer el producto para devolver el detalle actualizado.
- `GET /api/v1/producto/`: lista en array. Se consultan estados `A` e `I` para
  propagar desactivaciones. El parámetro `filtro` funciona para nombre/código y
  es el que usa el buscador del panel.
- La imagen se mantiene en la DB local y Altosa; el `PATCH` no la envía. El
  stock se mueve con movimientos de inventario, no desde la edición del producto.
- **Validación de imagen (2026-10-21):** se creó el producto inactivo
  `ZZ-IMG-TEST-001` y se probaron `PATCH` con `imagen` como string plano,
  `{ "url": ... }`, `{ "src": ... }`, `{ "path": ... }`, `{ "foto": ... }`,
  `[{ "url": ... }]` y `{ "nombre": ..., "url": ... }`. Todos respondieron
  `204`, pero el `GET` posterior siguió devolviendo `imagen: ""`: el campo se
  ignora y es efectivamente read-only. El producto de prueba quedó inactivo con
  código `ZZ-IMG-TEST-001`; se puede borrar desde la UI de Contifico (la API no
  expone `DELETE`).
- El cliente conserva un camino v2 (`PUT` con reconstrucción del producto) para
  quien configure `CONTIFICO_API_URL` con `/v2`, pero no es el default probado.

### Flujo del trabajador (ERP ↔ Altosa ↔ Contifico)

Prerrequisito: ejecutar una vez el enlace del catálogo existente:

```bash
pnpm --dir backend sync:contifico -- --dry-run --match-by-name
pnpm --dir backend sync:contifico -- --match-by-name
```

Eso deja `sourceRowKey = contifico:<id>` en los productos enlazados. A partir de
ahí:

| Acción en el ERP | Altosa / Kommo | Contifico |
|---|---|---|
| Ver productos | Lee Altosa (la misma base que alimenta Kommo) | Solo lectura, vía sync |
| Editar nombre, descripción, categoría o estado | Se actualiza Altosa; Kommo lo toma en su siguiente sync | `PATCH /producto/{id}/` |
| Editar precio/descripción de la variante principal | Se actualiza Altosa; Kommo lo toma en su siguiente sync | `PATCH /producto/{id}/` (`pvp1`, `descripcion`) |
| Agregar desde “Buscar en Contifico” | Upsert local + Altosa; se abre el panel de edición | Se importa/lee el producto existente; no se duplica |
| Subir imagen | Se guarda en Altosa/local; Kommo la usa | **No se actualiza**: `imagen` es read-only en la API de Contifico |
| Editar stock | Se refleja desde Contifico | Solo lectura desde Contifico |
| Eliminar producto | Se desactiva en Altosa | `PATCH` con `estado = I` |
| Agregar una variante extra | Altosa/local | No se crea en Contifico (limitación de fase 1) |

Kommo no se llama desde este código: se actualiza por el flujo existente
Altosa → Kommo. El ERP escribe en Altosa, que es la fuente de ese flujo.

### Límites conocidos (fase 1)

- Un producto de Contifico se representa como **un producto + una variante
  principal "Estándar"**. `detalle_variantes` de Contifico todavía no se expande
  a variantes múltiples; la actualización desde el ERP no reenvía
  `variantes`/`detalle_variantes`, así que editar un producto que ya tenga
  variantes en Contifico queda pendiente.
- Las variantes adicionales creadas en el ERP se guardan en local/Altosa, pero
  no se crean en Contifico (su API de variantes es de atributos, no de SKUs
  vendibles). La variante principal no se puede borrar ni cambiar de SKU desde
  el ERP: se cambia en Contifico y se vuelve a sincronizar.
- `imagen` es **read-only** en el esquema de producto de Contifico. Las imágenes
  subidas desde el ERP se guardan en Altosa/local y las usa Kommo, pero no se
  escriben en Contifico. Si Contifico ya tiene una imagen, el sync la importa a
  Altosa/local; la imagen del ERP no reemplaza la de Contifico.
- El SKU de un producto ya sincronizado está bloqueado en el ERP por la misma
  razón: es la llave natural con Contifico.
- La subida de imágenes sigue pasando por altosa-api (URLs públicas). Si
  altosa-api no está disponible, el CRUD funciona salvo la subida de imágenes.
- La UI actual no muestra una columna de stock: se mantuvo igual por pedido
  explícito. El stock sí queda en `kb_product_variants.stock` y en
  `especificacionesAdicionales.stock` de Altosa, listo para exponerlo cuando se
  autorice un cambio de interfaz.
- Los productos agregados desde el buscador usan la misma regla de validación
  que la sincronización: `APROBADO` si `pvp1 > 0`, `SIN_PRECIO` si no. No se
  importan los ~1000 de Contifico: solo el que el usuario elige.
- La sincronización es **pull** (manual o por script). Para automatizarla se
  puede programar `pnpm sync:contifico` por cron o agregar un job. Contifico
  limita a 100 solicitudes/minuto por empresa; la paginación actual es de 100
  productos por página.
- La integración usa la empresa por defecto del ERP (`0000000000001` o la
  primera creada). Si se manejan varias empresas con distintas cuentas de
  Contifico, habría que parametrizar credenciales por empresa.

## Próximos pasos sugeridos

- Programar la sincronización cada N minutos (cron/scheduler) y/o usar webhooks
  si Contifico los habilita para inventario.
- Mapear `detalle_variantes` de Contifico a variantes múltiples.
- Proyectar el stock por bodega (`/producto/:id/stock/`) a la tabla `Stock` del
  ERP si se activan órdenes/ventas que descuenten inventario.
- Migrar `stock` a `Decimal(14,4)` y agregar un historial de movimientos
  (`movimiento-inventario`) para auditoría.
