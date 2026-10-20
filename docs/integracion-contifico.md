# Integración ERP Unyx ↔ Contifico ↔ Altosa

## Objetivo y dirección del flujo

**Contifico es la fuente de verdad del inventario.** El ERP mantiene un espejo
relacional local y replica el catálogo hacia la base de conocimiento de Altosa
(usada por el asistente IA).

Referencia usada para el CRUD: [Contifico API v2](https://api.contifico.com/sistema/api/v2/documentacion/),
tag **Producto** (`POST`, `GET`, `PUT`; no hay `DELETE`).

```
                        ┌──────────────────────────────┐
                        │ Contifico (API v2)           │
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
                              │ sin cambios de UI                  │
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
CONTIFICO_API_URL=https://api.contifico.com/sistema/api/v2
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
- `CONTIFICO_API_URL` es configurable para cambiar entre `v1` y `v2` sin tocar
  código.
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
   pnpm --dir backend sync:contifico -- --match-by-name --prune
   ```

   > **Migración inicial recomendada** (DB con catálogo viejo del ETL):
   >
   > ```bash
   > pnpm --dir backend sync:contifico -- --dry-run --match-by-name --prune
   > pnpm --dir backend sync:contifico -- --match-by-name --prune
   > ```
   >
   > Así se enlazan por nombre los productos existentes, la variante principal
   > adopta el `codigo` real de Contifico y lo que ya no existe se desactiva en
   > lugar de quedar duplicado o viejo.

3. El frontend no cambia: sigue leyendo el BFF de Altosa. Cuando termine la
   sincronización, los productos aparecerán en **Bodega → Inventario** y en
   **IA → Base de conocimiento → Productos**. Para sincronizaciones manuales
   desde la UI se puede llamar `POST /api/v1/integrations/contifico/sync`
   (requiere JWT); el botón no se agregó para no modificar la interfaz.

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

2. **Actualizar/crear** los productos que vienen de Contifico.

3. **Reconciliar** con `--prune`:
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
# Reconciliación normal (recomendada si Contifico es la única fuente):
pnpm --dir backend sync:contifico -- --prune

# Solo actualizar/crear, sin desactivar nada:
pnpm --dir backend sync:contifico
```

## Endpoints

### ERP (requieren JWT del ERP)

| Método | Ruta | Uso |
|---|---|---|
| `POST` | `/api/v1/integrations/contifico/sync` | Importa Contifico → DB local → Altosa. Body opcional: `{ "dryRun": false, "pushToAltosa": true, "onlySku": "613", "matchByName": false, "prune": false }` |
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
de la variante principal); antes el mapper mostraba `ALT-<id>`. No se cambiaron
componentes ni el layout.

## CRUD desde el ERP

El frontend de productos (Inventario y Base de conocimiento IA) **no cambió**:
sigue leyendo y escribiendo contra el BFF `/api/v1/integrations/altosa`. Ese BFF
ahora es el orquestador: usa el servicio de productos del ERP para escribir
primero en Contifico, luego en la DB local y finalmente en Altosa. Cada
operación se propaga en este orden:

1. **Crear** → `POST /producto/` en Contifico (código, nombre, categoría,
   `pvp1` inicial), luego en la DB local y en Altosa.
2. **Editar producto** → `PUT /producto/{id}` en Contifico (nombre, descripción,
   categoría y estado); después en la DB local y Altosa. Los campos `keywords`
   y `subcategory` son enriquecimiento del ERP/IA.
3. **Editar variante principal** → precio y descripción se actualizan en
   Contifico (`pvp1`, `descripcion`). El stock **no** se edita desde el ERP:
   viene de Contifico.
4. **Eliminar** → no existe `DELETE` en Contifico v2: se desactiva con
   `PUT /producto/{id}` y `estado = I`; se marca inactivo en local y Altosa.

### Detalles del CRUD v2

- `POST /api/v2/producto/`: crea. Campos obligatorios: `codigo`, `nombre`,
  `minimo`, `pvp1`, `estado`. Se envía además `pvp_manual: true` cuando
  `pvp1 = 0`.
- `GET /api/v2/producto/{id}`: obtiene un producto.
- `PUT /api/v2/producto/{id}`: actualiza. Es un reemplazo completo, así que el
  cliente primero lee el producto actual y reenvía los campos mínimos más los
  cambios; no borra precios 2-4, cuentas, marca, costo máximo, lead time, etc.
- `GET /api/v2/producto/`: lista paginada de 100. Se consultan estados `A` e
  `I` para propagar desactivaciones.
- La imagen se mantiene en la DB local y Altosa; no se actualiza desde el ERP
  porque su API v2 espera un objeto `Foto`, no una URL plana. En el `PUT` se
  reenvían la imagen y `cantidad_stock` actuales tal como los devolvió Contifico
  para que el reemplazo completo no los borre. El stock se mueve con
  movimientos de inventario, no desde la edición del producto.
- Si se configura `CONTIFICO_API_URL` con `/api/v1`, el cliente usa `PATCH`
  parcial para actualizar (compatibilidad).

### Límites conocidos (fase 1)

- Un producto de Contifico se representa como **un producto + una variante
  principal "Estándar"**. `detalle_variantes` de Contifico todavía no se expande
  a variantes múltiples; el `PUT` v2 no reenvía `variantes`/`detalle_variantes`,
  así que editar desde el ERP un producto que ya tenga variantes en Contifico
  queda pendiente.
- Las variantes adicionales creadas en el ERP se guardan en local/Altosa, pero
  no se crean en Contifico (su API de variantes es de atributos, no de SKUs
  vendibles). La variante principal no se puede borrar ni cambiar de SKU desde
  el ERP: se cambia en Contifico y se vuelve a sincronizar.
- El SKU de un producto ya sincronizado está bloqueado en el ERP por la misma
  razón: es la llave natural con Contifico.
- La subida de imágenes sigue pasando por altosa-api (URLs públicas). Si
  altosa-api no está disponible, el CRUD funciona salvo la subida de imágenes.
- La UI actual no muestra una columna de stock: se mantuvo igual por pedido
  explícito. El stock sí queda en `kb_product_variants.stock` y en
  `especificacionesAdicionales.stock` de Altosa, listo para exponerlo cuando se
  autorice un cambio de interfaz.
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
