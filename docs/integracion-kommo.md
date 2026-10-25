# Integración de plantillas de Kommo

## Flujo

```
Kommo API v4 (chats/templates)
        │  GET /api/v4/chats/templates (Bearer token)
        ▼
altosa-api (backend de Altosa)
        │  upsert
        ▼
kommo_templates  ◄── product_variants.kommo_template_id
        ▲
        │  GET /api/v1/kommo/templates?search=
        │  POST /api/v1/kommo/sync-templates
        │
ERP Unyx BFF /api/v1/integrations/kommo/*
        ▲
        │
Frontend: panel de producto → “Plantilla de Kommo”
```

## Base de datos (Altosa)

Se agregó la tabla `kommo_templates`:

| Campo | Tipo |
|---|---|
| `id` | TEXT (cuid, PK) |
| `kommo_id` | INTEGER unique |
| `name` | TEXT |
| `type` | TEXT (`amocrm`/`waba`) |
| `content` | TEXT nullable |
| `is_active` | BOOLEAN |
| `created_at` / `updated_at` | timestamptz |

La asociación es **a nivel variante**: `product_variants.kommo_template_id` →
`kommo_templates.id` (`ON DELETE SET NULL`). Cada color/SKU puede usar una
plantilla distinta; el producto puede tener la columna legacy pero la UI y n8n
usan la variante.

La migración es idempotente:

```bash
cd /docker/altosa_infrastructure
sudo bash scripts/apply-kommo-migration.sh
```

`install.sh` y `update.sh` la ejecutan automáticamente. El esquema de Prisma se regenera con `pnpm prisma generate` (el build de Docker lo hace).

## Configuración del token

En el `.env` de **altosa_infrastructure** (no en el ERP):

```env
KOMMO_API_URL=https://altosa.kommo.com
KOMMO_API_KEY=<token de larga duración>
```

- Producción: `/docker/altosa_infrastructure/.env`; luego `sudo bash update.sh`.
- Local: `backend/.env`; reinicia `pnpm dev`.
- El token se envía como `Authorization: Bearer <token>`.

## Endpoints

### altosa-api (x-api-key)

- `GET /api/v1/kommo/templates?search=&limit=` — busca en la tabla local (no llama a Kommo).
- `POST /api/v1/kommo/sync-templates` — lee Kommo, hace upsert de las plantillas; no desactiva automáticamente las ausentes.

### ERP BFF (JWT)

- `GET /api/v1/integrations/kommo/templates?search=`
- `POST /api/v1/integrations/kommo/sync-templates`

El frontend usa estos endpoints para la sección **Plantilla de Kommo** del formulario de producto.

## Formulario de producto

En cada tarjeta de **Variantes** se agregó el campo **Plantilla de Kommo**:

- Botón **Buscar plantilla de Kommo** que abre un selector con buscador.
- Botón **Sincronizar** para traer las plantillas desde Kommo.
- Tarjetas con nombre, tipo, preview del contenido y botón azul **Asignar**.
- Plantilla asignada visible en la variante, con opciones **Cambiar** y **Quitar**.
- Al guardar las variantes, `kommoTemplateId` viaja en el update y se guarda en `product_variants.kommo_template_id`.

## n8n

Para obtener la plantilla de un producto:

```sql
SELECT p.id_producto,
       p.producto,
       v.id_variante,
       v.sku,
       v.color,
       kt.kommo_id,
       kt.name AS template_name,
       kt.content
FROM product_variants v
JOIN products p ON p.id_producto = v.id_producto
LEFT JOIN kommo_templates kt ON kt.id = v.kommo_template_id
WHERE v.id_variante = $1;
```

El flujo de n8n puede usar `kt.kommo_id` de la variante elegida para disparar la
plantilla en el chat de Kommo.

## Limitaciones

- La API de Kommo devuelve solo plantillas creadas por la integración actual; si faltan plantillas, revisar permisos/limitación de Kommo.
- El token debe tener permisos de administrador para listar plantillas.
- La UI asigna la plantilla por variante. La columna `products.kommo_template_id` queda como legado y no se usa.
