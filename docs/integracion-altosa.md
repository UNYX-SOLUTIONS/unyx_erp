# Integración multi-base-de-datos: ERP Unyx ↔ Altosa

## Flujo de datos

```
Navegador
   │  (JWT del ERP, HTTPS vía Traefik)
   ▼
ERP backend (unyx_erp/backend)
   │  Prisma ─────────────► DB Unyx (auth, sesiones, users/roles, KB propia)
   │
   │  HTTP + x-api-key (solo red Docker altosa_backend)
   ▼
altosa-api (altosa_infrastructure/backend)
   │  Prisma (solo generate, sin migraciones)
   ▼
DB Altosa (altosa-postgres: pgvector, catálogo + KB n8n)
```

Regla de oro: **el frontend habla SOLO con el backend del ERP** (patrón BFF). El navegador nunca llama a `altosa-api` ni conoce su API key.

## Componentes

### 1. `altosa-api` (D:\Trabajo\Unyx Solutions\Develop\Backends Clientes\altosa_infrastructure\backend)

- Stack: Express + Prisma + zod + helmet + rate limit + pino. TypeScript.
- Vars de entorno: `NODE_ENV`, `PORT` (4100), `DATABASE_URL`, `API_KEY` (≥16 chars).
- Endpoints (todos requieren `x-api-key` excepto `/health`):
  - `GET /health`
  - `GET /api/v1/products` — paginado (`page`, `pageSize`≤100, `search`, `categoryId`, `subcategoryId`, `active`, `withVariants`)
  - `GET /api/v1/products/:id` · `GET /api/v1/products/sku/:sku`
  - `GET /api/v1/categories` · `/catalogs?active` · `/locations?active` · `/warranties?active`
  - `GET /api/v1/documents` — metadatos (sin `embedding`); `includeContent=true` para el texto
- Seguridad: sin puertos públicos (solo red `altosa_backend`), API key con comparación en tiempo constante, rate limit 600/15min, helmet, sin CORS, logs con redacción de `x-api-key`.
- Prisma: `binaryTargets = [native, linux-musl-openssl-3.0.x]`; **no ejecutar `prisma migrate`** (las tablas las administra el pipeline n8n del cliente). La columna `embedding vector(1536)` no está en el modelo (usar SQL raw si se implementa búsqueda semántica).

### 2. Backend del ERP — integración (backend/src/integrations/altosa/)

- Vars: `ALTOSA_API_URL` (VPS: `http://altosa-api:4100`; local: `http://localhost:4100` o el puerto elegido) y `ALTOSA_API_KEY` (misma clave que altosa_infrastructure/.env). Si falta la key, los endpoints responden `503 ALTOSA_NOT_CONFIGURED` (el resto del ERP sigue funcionando).
- Cliente `altosa-client.ts`: fetch con timeout 10s, errores mapeados (502/504/503).
- BFF (requieren `authenticate` del ERP): `GET /api/v1/integrations/altosa/{products, products/:id, products/sku/:sku, categories, catalogs, locations, warranties, documents}`.
- Errores típicos: `502 ALTOSA_API_ERROR`, `502 ALTOSA_UNREACHABLE`, `504 ALTOSA_TIMEOUT`.

### 3. ETL de productos

- **Nuevo (recomendado)**: `pnpm --dir backend etl:products:api` — lee del API (`withVariants=true`, paginado 100) y hace upsert en la KB del ERP (`kb_products` sku `ALT-<id>`, variantes con `especificaciones` enriquecidas: medidas, garantía, catálogo, imagen, url).
  - Flags: `--dry-run`, `--force`.
  - Idempotente: re-ejecutar no duplica (los registros existentes se saltan salvo `--force`).
- **Viejo (deprecado)**: `etl:products` + `client-altosa` + `DATABASE_URL_ALTOSA` — conexión directa a la DB del cliente y a una tabla plana legacy. Eliminar junto con `src/config/database-altosa.ts` y `prisma/schema-altosa.prisma` DESPUÉS de validar el nuevo ETL en el VPS.

### 4. Imágenes de variantes

- Flujo: el usuario sube la imagen en el detalle del producto (tab Variantes) → `POST /api/v1/integrations/altosa/uploads/variants` (multipart, JWT del ERP) → el ERP lo reenvía a `altosa-api` → el archivo se guarda en el volumen Docker `altosa_uploads_data` (`/data/uploads/variants/<uuid>.<ext>`).
- `altosa-api` responde con la **URL pública absoluta** (`PUBLIC_URL_BASE` + ruta) que el frontend guarda en `product_variants.imagen_url` (la constraint del cliente exige `http(s)://`).
- En el VPS, Traefik expone SOLO la ruta `/uploads` de `altosa-api` sobre el dominio de pruebas (`Host(altosa-test...) && PathPrefix('/uploads')`, prioridad 200); el resto del API sigue privado.
- Límites: JPG/PNG/WEBP/GIF, máx. 5 MB (`multer`, filtro por MIME en el ERP y en altosa-api).
- Variables: `UPLOAD_DIR` (default `uploads` local, `/data/uploads` en Docker), `PUBLIC_URL_BASE` (local `http://localhost:4100`; VPS `https://altosa-test.erp.unyxsolutions.com`).
- Para limpiar una imagen: guardar `imageUrl` vacío en la variante (el API lo convierte a `NULL`).

## Despliegue (VPS)

1. **Altosa (una vez / actualizaciones)**: en `/docker/altosa_infrastructure` con `ALTOSA_API_KEY` en `.env` (`openssl rand -hex 32`):
   ```bash
   ./update.sh   # levanta/actualiza postgres, pgadmin y altosa-api
   ```
   Verificar: `docker logs -f altosa-api` y desde otro contenedor:
   `docker exec <backend-erp> wget -qO- --header='x-api-key: <KEY>' http://altosa-api:4100/health`
2. **ERP**: setear `ALTOSA_API_KEY` (misma clave) en `.env.deploy` y re-desplegar con `deploy/deploy-test.ps1` (o `sudo bash deploy/deploy-test.sh`). El script asegura la red `altosa_backend` y conecta el backend del ERP a ella.
3. Tras validar: correr el ETL nuevo contra el VPS (`docker compose exec -T backend node dist/scripts/etl-products-api.js` o desde un entorno con acceso).

## Desarrollo local

- DB de Altosa de prueba: contenedor `altosa-restore` (pgvector/pg16) en `localhost:5499`, dump restaurado (ver README de altosa_infrastructure → sección Backend/API).
- `altosa-api` local: crear `backend/.env` (NODE_ENV=development, PORT=4199, DATABASE_URL al 5499, API_KEY de prueba) y `pnpm dev` o `pnpm build && node dist/server.js`.
- ERP local: en `backend/.env` apuntar `ALTOSA_API_URL=http://localhost:4199` y `ALTOSA_API_KEY` a la clave de prueba. Probar: login → `GET http://localhost:4001/api/v1/integrations/altosa/products`.

## Seguridad aplicada

| Medida | Dónde |
|---|---|
| API key servicio-a-servicio (`x-api-key`, tiempo constante) | altosa-api |
| Sin exposición pública (red Docker interna, sin `ports`) | altosa-api |
| Rate limits (600/15min API cliente; limiter del ERP) | ambos |
| helmet, sin CORS, body limit, logs con redacción | ambos |
| JWT/roles centralizados en el ERP | ERP |
| Traefik + TLS solo para el ERP (y pgAdmin en entrypoint dedicado) | VPS |

## Pendientes / próximos pasos

- CRUD de escritura en `altosa-api` (hoy es solo lectura) con auditoría.
- Búsqueda semántica sobre `documents.embedding` (pgvector) vía endpoint dedicado.
- Caché corta (30–60s) en el ERP para listados que vengan del cliente.
- Eliminar `client-altosa`/ETL viejo tras validar en VPS.
- Programar `backup.sh` de altosa_infrastructure en cron del VPS.
