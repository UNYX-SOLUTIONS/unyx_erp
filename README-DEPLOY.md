# Unyx ERP — Guía de despliegue (VPS + Docker + Traefik)

Guía paso a paso para desplegar el ERP en un VPS Linux usando Docker Compose y
Traefik como reverse proxy. Los comandos locales son **PowerShell** (Windows) y
los del VPS son **bash** (SSH vía PuTTY).

---

## 1. Arquitectura

```
Internet
   │  https://unyx-erp.example.com
   ▼
Traefik (VPS ERP, red traefik-public, Let's Encrypt)
   ├── Host(...) && PathPrefix(/api) → unyx-backend:4000 (Express + Prisma)
   └── Host(...)                     → unyx-frontend:3000 (Next.js standalone)
                                            │
                                            ▼
                             unyx-postgres:5432 (solo red interna)
                             volumen: unyx_pgdata

unyx-backend ──► Contifico API v1 (fuente de verdad del inventario)
unyx-backend ──► altosa-api pública (x-api-key) ──► PostgreSQL Altosa/pgvector
```

- Contifico es la fuente de verdad. El ERP actualiza solo los productos que ya
  existen; los nuevos se agregan a demanda desde el buscador de Contifico.
- El ERP escribe en su base (`unyx_erp`) **y** en Altosa a través de su API.
  Kommo consume Altosa por el flujo existente.
- `DATABASE_URL_ALTOSA` solo se usa para el ETL legado; el sync nuevo usa la API.
- `kb_products` (productos padre) + `kb_product_variants` (variantes).
- Postgres y backend NO exponen puertos al exterior: solo Traefik enruta.

---

## 2. Prerrequisitos en el VPS

- Docker + Docker Compose instalados.
- Traefik corriendo en la red externa `traefik-public` con certresolver `letsencrypt`
  y entrypoints `web` / `websecure`.
- Registro DNS del dominio (`unyx-erp.example.com`) apuntando al IP del VPS.
- Acceso SSH (PuTTY). Firewall (ufw) permitiendo 22, 80 y 443 únicamente.
- **altosa-api desplegada** y accesible desde el ERP (URL pública del subdominio).
  Su `ALTOSA_API_KEY` debe ser la misma que `ALTOSA_API_KEY` de este `.env.production`.
- **Credenciales de Contifico**: `CONTIFICO_API_KEY` y, si aplica,
  `CONTIFICO_API_TOKEN`.
- `DATABASE_URL_ALTOSA` solo si vas a usar el ETL legado; el sync de inventario
  usa la API de Altosa.

Si la red no existe todavía, crearla una vez:

```bash
docker network create traefik-public
```

---

## 3. Primer despliegue

### 3.0 Despliegue rápido con scripts (recomendado)

**Paso 1 — Altosa (su VPS).** Desde Windows, en el repo de Altosa:

```powershell
cd "D:\Trabajo\Unyx Solutions\Develop\Backends Clientes\altosa_infrastructure"
.\deploy.ps1 -VpsHost <ALTOSA_VPS_IP> -PublicDomain api.altosamobiliario.com
```

Anota los dos valores que imprime al final:

```text
ALTOSA_API_URL=https://api.altosamobiliario.com
ALTOSA_API_KEY=<key generada>
```

Si vas a usar las **plantillas de Kommo**, agrega también en el `.env` de
Altosa y ejecuta `sudo bash update.sh`:

```env
KOMMO_API_URL=https://altosa.kommo.com
KOMMO_API_KEY=<token de larga duración>
```

**Paso 2 — ERP (su VPS).** En `/opt/unyx-erp`, crea `.env.production` desde
`.env.production.example` y completa:

- `UNYX_DOMAIN`, `POSTGRES_*`, `JWT_*`
- `ALTOSA_API_URL` y `ALTOSA_API_KEY` con los valores del paso 1
- `CONTIFICO_API_KEY` y `CONTIFICO_API_TOKEN`
- `DATABASE_URL_ALTOSA` solo si usarás el ETL legado

Protege el archivo: `chmod 600 /opt/unyx-erp/.env.production`.

Luego, desde Windows:

```powershell
cd "D:\Trabajo\Unyx Solutions\Develop\unyx_erp"
.\deploy\deploy-prod.ps1 -VpsHost <ERP_VPS_IP>
```

O en el VPS:

```bash
cd /opt/unyx-erp
chmod +x deploy/*.sh
./deploy/deploy-prod.sh
```

**Paso 3 — Sincronización inicial de Contifico** (solo actualiza los productos
que ya existen en el ERP):

```bash
cd /opt/unyx-erp
./deploy/contifico-sync.sh --dry-run --match-by-name
./deploy/contifico-sync.sh --apply --match-by-name
```

Los scripts son idempotentes: para actualizar, vuelve a ejecutar el despliegue.

Los pasos manuales de 3.1 a 3.5 quedan como alternativa/diagnóstico.

### 3.1 Subir los archivos (desde PowerShell)

```powershell
# Crear el paquete de despliegue (excluye node_modules y artefactos)
cd "D:\Trabajo\Unyx Solutions\Develop\unyx_erp"
$dest = "$env:TEMP\unyx-deploy"
Remove-Item -Recurse -Force $dest -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $dest | Out-Null
Copy-Item docker-compose.prod.yml, .env.production.example $dest
Copy-Item deploy $dest\deploy -Recurse
Copy-Item backend $dest\backend -Recurse
Copy-Item frontend $dest\frontend -Recurse
Remove-Item -Recurse -Force "$dest\backend\node_modules", "$dest\backend\dist", "$dest\frontend\node_modules", "$dest\frontend\.next" -ErrorAction SilentlyContinue

# Subir al VPS con pscp (PuTTY). Reemplaza usuario@IP y la clave.
# pscp -r -i C:\ruta\clave.ppk $dest\* usuario@IP:/opt/unyx-erp/
```

### 3.2 En el VPS (SSH / PuTTY)

```bash
sudo mkdir -p /opt/unyx-erp /backups
cd /opt/unyx-erp

# Crear el .env.production real a partir de la plantilla y editarlo
cp .env.production.example .env.production
nano .env.production
#   - UNYX_DOMAIN: tu dominio real
#   - POSTGRES_PASSWORD: clave fuerte
#   - JWT_ACCESS_SECRET / JWT_REFRESH_SECRET: secretos largos y distintos
#   - ALTOSA_API_URL / ALTOSA_API_KEY: URL pública y key de altosa-api
#   - CONTIFICO_API_KEY / CONTIFICO_API_TOKEN
#   - DATABASE_URL_ALTOSA: solo si usarás el ETL legado

# Construir y levantar
docker compose --env-file .env.production -f docker-compose.prod.yml build
docker compose --env-file .env.production -f docker-compose.prod.yml up -d

# Verificar estado
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f unyx-backend
```

Las migraciones de Prisma se aplican automáticamente al arrancar el contenedor
(`prisma migrate deploy` en el CMD). Esperar a que `unyx-postgres` y `unyx-backend`
estén `healthy` antes de seguir.

### 3.3 Seed inicial (roles, permisos, empresa base)

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec -T \
  -e NODE_ENV=development -e SEED_ADMIN_PASSWORD='<clave-fuerte>' \
  unyx-backend node dist/prisma/seed.js
```

Para cargar el catálogo demo (solo pruebas):

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec -T \
  unyx-backend node dist/scripts/seed-demo.js
```

### 3.4 Sincronización de inventario desde Contifico

El script `deploy/contifico-sync.sh` hace dry-run por defecto:

```bash
# Revisar qué se actualizaría (no escribe)
./deploy/contifico-sync.sh --dry-run --match-by-name

# Aplicar: actualiza solo productos existentes y los empuja a Altosa
./deploy/contifico-sync.sh --apply --match-by-name

# Reconciliación: desactiva en local/Altosa lo que ya no está en Contifico
./deploy/contifico-sync.sh --dry-run --prune
./deploy/contifico-sync.sh --apply --prune
```

- `--match-by-name` enlaza el catálogo heredado por nombre (primera vez).
- Sin `--create-missing` **no se importan** los productos de Contifico que no
  existan en el ERP. Para agregarlos, usa el buscador del panel de producto.
- `--create-missing` importa todo Contifico (no recomendado).

El ETL legado (solo si no usas Contifico como fuente) sigue disponible:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec unyx-backend \
  node dist/scripts/etl-products.js --dry-run
```

### 3.5 Verificación final

```bash
curl -s https://unyx-erp.example.com/api/v1/health
# → {"success":true,"data":{"status":"ok",...}}
```

Abrir en el navegador: `https://unyx-erp.example.com/ai/knowledge-base/products`.
Login inicial: `admin@unyx.erp` / `Admin123!` (cambiar la clave después).

---

## 4. Actualizaciones

```powershell
# Recomendado: sube el código y redespliega (idempotente)
cd "D:\Trabajo\Unyx Solutions\Develop\unyx_erp"
.\deploy\deploy-prod.ps1 -VpsHost <ERP_VPS_IP>
```

O en el VPS:

```bash
cd /opt/unyx-erp
./deploy/deploy-prod.sh
```

El script crea un backup previo, reconstruye, levanta y espera healthchecks.
Para forzar sin backup: `--no-backup`; sin build: `--skip-build`.

---

## 5. Backups

```bash
cd /opt/unyx-erp
chmod +x deploy/*.sh

# Manual (lee .env.production automáticamente)
./deploy/backup.sh /backups

# Cron diario a las 3 AM (crontab -e)
0 3 * * * cd /opt/unyx-erp && ./deploy/backup.sh /backups >> /var/log/unyx-backup.log 2>&1
```

Restaurar: `./deploy/restore.sh /backups/unyx_YYYYMMDD_HHMMSS.sql` (pide confirmación).

Los backups quedan en `/backups` con retención automática de 30 días.
Para copiarlos fuera del VPS: `pscp -i clave.ppk usuario@IP:/backups/unyx_*.sql .\backups\`.

---

## 6. Troubleshooting

| Síntoma | Causa probable | Solución |
|---|---|---|
| `unyx-backend` no pasa de `starting` y el log dice `Can't reach database server` | Postgres aún no está healthy | `docker compose ... ps` y esperar/verificar `pg_isready` |
| Error 502/504 en el dominio | Traefik no encuentra el router | Verificar que la red `traefik-public` existe, el contenedor está en ella y los labels usan el dominio correcto: `docker inspect unyx-erp_backend_1` / `docker logs traefik` |
| El navegador llama a `http://localhost:4001` en producción | La imagen del frontend se construyó con el `NEXT_PUBLIC_API_URL` de desarrollo | Reconstruir el frontend con el build-arg correcto (`docker compose ... build frontend --no-cache`) |
| ETL falla con "No se pudo leer la tabla plana productos" | `DATABASE_URL_ALTOSA` mal configurada o sin conectividad al VPS de Altosa | Probar: `docker compose ... exec unyx-backend node -e "console.log(process.env.DATABASE_URL_ALTOSA)"` y validar VPN/túnel/whitelist |
| Altosa responde `401` | `ALTOSA_API_KEY` no coincide entre ERP y `altosa_infrastructure/.env` | Copiar la misma key en ambos `.env` y reiniciar el backend del ERP |
| La búsqueda dice "Contifico no está configurado" | Falta `CONTIFICO_API_KEY` o el backend no se reinició tras agregarla | Completar `.env.production`, reiniciar `unyx-backend` y probar `./deploy/contifico-sync.sh --dry-run` |
| La búsqueda de Contifico no devuelve nada | URL/API key incorrecta o estás en v2 | Verificar `CONTIFICO_API_URL=.../api/v1`; v2 devuelve otro formato de listado e ignora `filtro` |
| El sync no actualiza Altosa | `ALTOSA_API_URL` no es alcanzable desde el VPS del ERP o la key no coincide | Probar `curl -fsS "$ALTOSA_API_URL/health"` desde el VPS y revisar el log del backend |
| La imagen subida no aparece en Contifico | `imagen` es read-only en la API de Contifico | Es esperado; la imagen queda en Altosa/local. Súbela en Contifico si debe estar también allí |
| Migraciones no aplicadas | El contenedor arrancó antes de que Postgres estuviera listo | `docker compose ... run --rm unyx-backend ./node_modules/.bin/prisma migrate deploy` |
| Certificado TLS no emitido | DNS no apunta al VPS o certresolver distinto | `dig unyx-erp.example.com` y revisar `docker logs traefik \| grep letsencrypt` |

---

## 7. Desarrollo local (resumen)

```powershell
docker compose up -d postgres          # solo la DB local (puerto 5435)
pnpm db:migrate                        # primera vez
pnpm db:seed                           # roles/permisos/empresa demo
pnpm --filter backend seed:demo        # 8 productos demo con variantes
pnpm dev                               # backend 4001 + frontend 3000
```

- ETL local: `pnpm --filter backend etl:products` (usa `DATABASE_URL_ALTOSA`; en
  local apunta a la misma DB con la tabla staging que crea
  `backend/scripts/sql/local-staging-productos.sql`).
- Compose completo local: `docker compose up -d --build` (frontend 3000, backend 4001,
  postgres 5435).

---

## 8. Modelo de datos (resumen)

- `kb_products`: producto padre (nombre, SKU, línea, categoría, descripción comercial,
  keywords, validación, sincronización, soft delete).
- `kb_product_variants`: variantes (SKU propio, color + hex, precio, stock, orden,
  `especificaciones` JSON con los campos técnicos importados de Altosa).
- `productos` (en la base de Altosa): tabla plana de origen, SOLO lectura.
- Validación: `APROBADO | PENDIENTE | REQUIERE_CORRECCION | SIN_PRECIO`.
- Precio del listado = precio mínimo de las variantes activas ("Desde $X" si hay más
  de una variante).
