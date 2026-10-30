# Contexto del proyecto Unyx ERP + Altosa + Contifico + Meta + Kommo

Documento de contexto para continuar el desarrollo, especialmente el frontend del ERP.
Última actualización: 2026-10-29.

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

La API de Altosa es el backend del catálogo. PostgreSQL Altosa es la **base de conocimiento de todos los productos y variantes**: producto, variante, color, SKU, precio, imágenes, `meta_retailer_id`, plantillas Kommo y datos relacionados.

### Contifico

La integración de Contifico vive en **Altosa** (`backend/src/modules/contifico`): cliente v1, sync nativo, búsqueda/importación y write-through. El token `CONTIFICO_API_KEY` está solo en el `.env` de Altosa. El sync corre en el VPS de Altosa (`scripts/contifico-sync.sh`) y escribe directamente en su PostgreSQL. El ERP solo hace proxy a `/api/v1/contifico/*` y ya no tiene credenciales de Contifico.

### Meta

El token de Meta vive solo en el `.env` de Altosa. El ERP nunca recibe el token. La API Altosa consulta el catálogo Meta y el ERP usa el buscador/mapeo mediante el BFF. Altosa también publica ítems planos cuando el alta del ERP lo pide (`syncExternals`), actualiza el ítem mapeado al editar y lo elimina en el DELETE explícito; desactivar (`isActive=false`) solo lo deja `out of stock`.

### Kommo

Las plantillas se sincronizan en Altosa. El ERP solo consume/elige la plantilla en la variante.

### n8n / WhatsApp

No está en estos repos. Usa el catálogo/Altosa y `COALESCE(meta_retailer_id, sku)` como `product_retailer_id` para las tarjetas de producto.

---

## 4. Estado actual del catálogo

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

## 5. Significado de `is_active`

`is_active` es el interruptor de aprobación:

- `true`: producto/variante aprobado; la IA y los flujos de catálogo pueden usarlo.
- `false`: producto/variante importado o pendiente; no debe recomendarse ni publicarse.

Reglas actuales:

- Backup aprobado: `is_active = true`.
- Importaciones nuevas de Contifico/Meta: `is_active = false`.
- El sync de Contifico no debe pisar el contenido aprobado.
- Las variantes nuevas creadas por el reconciliador Meta quedan inactivas.
- Los productos nuevos creados desde Meta quedan inactivos bajo la categoría `Meta` / `Catálogo Meta`.

La lista actual del ERP filtra `active=true`, por lo que los 816 productos inactivos no se ven. Falta una vista/filtro de inactivos/pendientes para revisarlos y aprobarlos.

---

## 6. Mapeo Meta: estrategia actual

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
| Contifico → ERP staging → Altosa | Funciona; deuda técnica por el staging local |
| Meta → Altosa (mapeo) | 417/452; 33 pendientes |
| ERP → Altosa (edición) | Funciona en general |
| ERP → Contifico | Parcial; falta CRUD completo de variantes/productos |
| ERP → Meta | No implementado; solo existe mapeo |
| Meta → Altosa (crear productos Meta-only) | Implementado por reconciliador; quedan inactivos |
| Kommo | Plantillas en Altosa; ERP elige plantilla |

### Estado de escritura

- Editar producto/variante en el ERP: actualiza Altosa vía API.
- Crear producto: crea local + Altosa; no crea Meta.
- Crear variante desde la UI: se crea en Altosa; no se crea en Contifico ni Meta.
- Borrar variante: borra en Altosa; no borra en Meta/Contifico.
- El write-through completo ERP → Contifico/Meta está pendiente.

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
CONTIFICO_API_URL=https://api.contifico.com/sistema/api/v1
CONTIFICO_API_KEY
# CONTIFICO_API_TOKEN (opcional POS; no usado para inventario)
```

Contratos entre proyectos:

- `ALTOSA_API_KEY` debe ser la misma en ERP y Altosa.
- `ALTOSA_API_URL` del ERP debe ser igual a `ALTOSA_PUBLIC_URL_BASE` de Altosa.
- `POSTGRES_*` son bases distintas: ERP y Altosa no comparten base.
- Los tokens de Meta, Kommo y Contifico solo van en Altosa.
- Después de migrar, el ERP no debe tener `CONTIFICO_API_KEY`.

### Deploy

Altosa:

```bash
cd /docker/altosa_infrastructure
git fetch origin
git checkout main
git pull --ff-only
sudo bash update.sh --api-only
# configura CONTIFICO_API_URL/KEY en .env antes de este paso
bash scripts/healthcheck.sh
bash scripts/contifico-sync.sh --dry-run --match-by-name
```

ERP:

```bash
cd /docker/unyx_erp
git fetch origin
git checkout main
git pull --ff-only
sudo bash deploy/deploy-prod.sh
# Si solo cambiaron variables:
sudo bash deploy/deploy-prod.sh --skip-build
# Una sola vez tras migrar los mapeos legados:
docker compose --env-file .env.production -f docker-compose.prod.yml \
  exec -T unyx-backend node dist/scripts/backfill-altosa-mappings.js
```

### Reset de Altosa

Backup aprobado:

```text
backend/sql/altosa_2026-10-15.schema.backup
```

Script:

```text
scripts/reset-altosa-db.sh
```

Restaura la misma base `altosa` con 110 productos / 241 variantes activas, aplica Meta/Kommo, reinicia secuencias y verifica conteos. El backup tiene secuencias en 1; el script ya las corrige. No usar `prisma migrate`.

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
POST   /api/v1/integrations/altosa/products/:id/variants
PATCH  /api/v1/integrations/altosa/variants/:id
DELETE /api/v1/integrations/altosa/variants/:id
GET    /api/v1/integrations/altosa/meta/catalog/search
GET    /api/v1/integrations/altosa/meta/catalog/item
GET    /api/v1/integrations/altosa/kommo/templates
POST   /api/v1/integrations/kommo/sync-templates
```

Notas de UI:

- La lista de productos filtra `active=true`.
- La variante tiene sección “Catálogo Meta / WhatsApp”.
- El botón “Agregar variante” crea un borrador local; el POST real ocurre al guardar.
- Las variantes nuevas desde la UI se crean en Altosa; no en Contifico/Meta.
- La sección Meta tiene buscador modal, preview y asignación manual; el backend deja `meta_mapping_locked=true` al asignar manualmente.
- “Quitar mapeo” envía `metaRetailerId: null`; “Restaurar sync” envía `metaRetailerId: null, metaMappingLocked: false`.
- Permisos: lectura `products.read`, edición `products.update`.
- La auditoría de cambios Meta se registra en el backend.

Pendientes frontend:

1. Filtro/vista de productos inactivos/pendientes.
2. Aprobación/activación de productos y variantes inactivas.
3. Resolución de los 33 casos Meta pendientes.
4. Mostrar estado de sincronización con Contifico/Meta.
5. Aclarar en UI que crear/editar no replica automáticamente a Meta/Contifico todavía.
6. Manejo de nuevas variantes: si el producto está aprobado, la variante nueva nace inactiva y requiere aprobación.
7. Búsqueda/filtros por SKU, color, estado y fuente.
8. Acciones masivas (activar/desactivar/Meta) con permisos y auditoría.

---

## 11. Pendientes y riesgos

### Meta

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

- No llamar directamente a la base de Altosa ni a la API de Meta desde el navegador.
- Usar siempre el BFF del ERP.
- No hardcodear tokens ni claves.
- No cambiar contratos del backend sin actualizar ambos lados.
- Mantener textos en español y el estilo de componentes existente.
- Respetar permisos `products.read` y `products.update`.
- No asumir que crear/editar/eliminar en el ERP se replica a Meta/Contifico todavía.
- No eliminar productos; desactivar.
- No usar `--prune` ni scripts destructivos sin confirmación.
- No tocar cambios pendientes de Kommo.
- Ejecutar `pnpm type-check`, `pnpm lint` y `pnpm build` en el frontend antes de terminar.
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
- is_active=true significa aprobado; is_active=false significa pendiente/inactivo.
- Meta se mapea en product_variants.meta_retailer_id. El token de Meta vive solo en Altosa.
- Contifico y Meta todavía no tienen write-through completo desde el ERP.
- Hay 417 variantes mapeadas de 452 items Meta; quedan 33 casos.
- Hay 816 productos inactivos y la lista actual solo muestra activos.

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
cd /docker/unyx_erp/frontend
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
cd /docker/unyx_erp/backend
pnpm type-check
pnpm lint
pnpm build
```

---

## 16. Archivos y scripts importantes

Altosa:

```text
backend/prisma/schema.prisma
backend/prisma/sql/meta_retailer_id.sql
backend/prisma/sql/kommo_templates.sql
backend/src/modules/meta/
backend/src/scripts/sync-meta-mappings.ts
backend/src/scripts/suggest-meta-mappings.ts
backend/src/scripts/reconcile-meta-variants.ts
backend/src/scripts/backfill-meta-retailer-ids.ts
backend/src/scripts/seed-products.ts
backend/src/modules/contifico/contifico-client.ts
backend/src/modules/contifico/contifico-catalog.ts
backend/src/modules/contifico/contifico-service.ts
backend/src/modules/contifico/contifico-sync.ts
backend/src/modules/contifico/contifico-routes.ts
backend/prisma/sql/contifico_mapping.sql
scripts/apply-contifico-migration.sh
scripts/contifico-sync.sh
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
```

ERP frontend:

```text
frontend/src/features/ai-knowledge-base/products/api/products.api.ts
frontend/src/features/ai-knowledge-base/products/api/altosa.mappers.ts
frontend/src/features/ai-knowledge-base/products/types/product.types.ts
frontend/src/features/ai-knowledge-base/products/components/detail/ProductDetailSheet.tsx
frontend/src/features/ai-knowledge-base/products/components/detail/sections/VariantCard.tsx
frontend/src/features/ai-knowledge-base/products/components/detail/sections/MetaMappingField.tsx
frontend/src/features/ai-knowledge-base/products/components/detail/sections/MetaCatalogPicker.tsx
frontend/src/features/ai-knowledge-base/products/components/detail/sections/KommoTemplateField.tsx
frontend/src/features/ai-knowledge-base/products/components/detail/sections/KommoTemplatePicker.tsx
frontend/src/features/ai-knowledge-base/products/components/detail/tabs/VariantsTab.tsx
frontend/src/features/ai-knowledge-base/products/hooks/
```

---

## 17. Resumen ejecutivo

- El ERP es el sistema de gestión; su PostgreSQL interno es para auth, permisos, usuarios, auditoría y operaciones internas.
- Altosa API + PostgreSQL Altosa es la **base de conocimiento del catálogo de productos y variantes**.
- El ERP frontend/backend consume Altosa vía BFF; nunca accede directo a PostgreSQL Altosa.
- Contifico cargó el inventario; 720 productos quedaron inactivos.
- Meta se reconcilió: 417/452 mapeados/creados; 33 pendientes.
- 96 productos Meta nuevos quedaron inactivos.
- 110 aprobados originales siguen activos.
- Falta vista de inactivos/aprobación en el frontend.
- Falta write-through completo a Meta/Contifico.
- El modelo producto-variante es correcto; no hay que rediseñarlo.
- Para escalar: mapeo determinista (SKU en custom_label_0), referencias externas, caché Meta, deduplicación y reglas de propiedad de campos.
```
