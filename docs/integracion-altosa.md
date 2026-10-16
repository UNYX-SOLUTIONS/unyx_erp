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
- Límites: JPG/PNG/WEBP/GIF, máx. 10 MB (`multer`, filtro por MIME en el ERP y en altosa-api).
- Optimización en dos capas (para que nada pesado llegue a la DB ni a n8n/Kommo/Meta):
  1. **Navegador** (`lib/compress-image.ts`): redimensiona a máx. 1600px y re-codifica a JPEG q0.82 antes de subir (GIF y archivos ya óptimos se dejan intactos).
  2. **Servidor** (`altosa-api`, sharp): corrige orientación EXIF, redimensiona a 1600px, re-codifica a JPEG y descarta metadatos como garantía final; conserva el original si el resultado no es mejor. Medido: 6.59 MB → 627 KB.
- Validación de contenido: además del MIME, se verifica la **firma binaria real** (magic bytes de JPG/PNG/WEBP/GIF); un archivo falso se rechaza y se elimina del disco.
- Variables: `UPLOAD_DIR` (default `uploads` local, `/data/uploads` en Docker), `PUBLIC_URL_BASE` (local `http://localhost:4100`; VPS `https://altosa-test.erp.unyxsolutions.com`).
- Para limpiar una imagen: guardar `imageUrl` vacío en la variante (el API lo convierte a `NULL`).

#### ¿Y MinIO / S3 / Cloudinary?

Hoy NO se usa almacenamiento de objetos: `altosa-api` guarda los archivos en el volumen Docker
`altosa_uploads_data` (multer, disco) y los sirve como estáticos en `/uploads` vía Traefik; la
"URL pública" se compone con `PUBLIC_URL_BASE`. Esto es suficiente porque:

- Un solo cliente por backend, una sola instancia (sin réplicas que compartan storage).
- Volumen pequeño (imágenes de variantes, cientos-miles) y ya respaldado por `backup.sh`.
- Cero servicios extra: sin credenciales, consola ni políticas de bucket que mantener.

Cuándo migrar a MinIO (S3-compatible) o Cloudinary:

- Si el backend escala a varias réplicas y el storage local deja de ser compartible.
- Si se necesitan buckets públicos/privados con URLs firmadas, versionado o lifecycle.
- Si el equipo estandariza object storage para todos los clientes.

El cambio está aislado en `src/modules/uploads/uploads-routes.ts` (y el BFF del ERP): al ser S3
API-compatible, migrar es reemplazar el storage de multer por el SDK de MinIO/S3 y cambiar
`PUBLIC_URL_BASE` por el dominio/endpoint del bucket; las URLs guardadas en la DB siguen siendo
absolutas, por lo que la UI no cambia.

#### ¿Es seguro exponer la URL pública? (y por qué las URLs firmadas no aplican)

Las imágenes se envían a terceros (campo de Kommo, Meta, WooCommerce, catálogos, n8n), que las
**descargan por Internet sin credenciales**. Por eso la URL debe ser pública y permanente: una URL
firmada/tokenizada (MinIO presigned, Cloudinary signed) EXPIRA y rompería esos links guardados.
Conclusión: MinIO/Cloudinary no cambian el hecho de que el archivo es público; cambian dónde vive.

Análisis de riesgos del enfoque actual (dominio del ERP + `/uploads` estático):

| Riesgo | Exposición real | Mitigación actual |
| --- | --- | --- |
| Descubrir el backend/arquitectura | El URL solo revela el dominio público (el mismo que ya compartes) y un nombre UUID; NO expone el API, puertos internos ni credenciales | `altosa-api` sin puertos públicos; solo la ruta `/uploads` pasa por Traefik; API key nunca viaja en URLs |
| Enumerar/descargar imágenes ajenas | Nombres UUID v4 (no secuenciales, no adivinables) | Renombrado con `randomUUID()` en el servidor |
| Scraping/hotlinking/abuso de ancho de banda | Bajo (es un catálogo destinado a verse) | Rate limit en Traefik sobre `/uploads` (100 req/s, burst 200) |
| Subir archivos maliciosos | Solo usuarios autenticados del ERP pueden subir | JWT del ERP + filtro MIME (JPG/PNG/WEBP/GIF) + máx 10 MB + nombres generados por el servidor (sin path traversal) |
| Link roto si cambia el dominio | **El riesgo práctico más real**: las URLs quedan guardadas en la DB y en sistemas externos (Kommo, WooCommerce) | Usar un `PUBLIC_URL_BASE` **estable** antes de empezar a guardar links en terceros (ver abajo) |

Recomendación de dominios: para pruebas está bien `https://altosa-test.erp.unyxsolutions.com`. Antes
de guardar URLs definitivas en Kommo/catálogos, apuntar `ALTOSA_PUBLIC_URL_BASE` a un dominio estable
dedicado a archivos (ej. `https://files.unyxsolutions.com` o el dominio del cliente) manteniendo la
misma ruta `/uploads` en Traefik; así la ERP puede mudarse de dominio sin romper links ya enviados.

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
