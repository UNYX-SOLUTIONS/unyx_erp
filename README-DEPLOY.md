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
Traefik (VPS, red traefik-public, Let's Encrypt)
   ├── Host(...)  && PathPrefix(/api)  → unyx-backend:4000   (API Express+Prisma)
   └── Host(...)                        → unyx-frontend:3000  (Next.js standalone)
                                             │
                                             ▼
                              unyx-postgres:5432 (solo red interna)
                              volumen: unyx_pgdata

Base externa Altosa (solo lectura) ←── ETL manual (scripts/etl-products.ts)
```

- El ERP escribe SIEMPRE en su propia base (`unyx_erp`). La base de Altosa solo se
  lee para importaciones (ETL).
- `kb_products` (productos padre) + `kb_product_variants` (una por color/variante).
- Postgres y backend NO exponen puertos al exterior: solo Traefik enruta.

---

## 2. Prerrequisitos en el VPS

- Docker + Docker Compose instalados.
- Traefik corriendo en la red externa `traefik-public` con certresolver `letsencrypt`
  y entrypoints `web` / `websecure`.
- Registro DNS del dominio (`unyx-erp.example.com`) apuntando al IP del VPS.
- Acceso SSH (PuTTY). Firewall (ufw) permitiendo 22, 80 y 443 únicamente.
- Acceso a la base de datos de Altosa (VPN, túnel SSH o IP whitelisted).

Si la red no existe todavía, crearla una vez:

```bash
docker network create traefik-public
```

---

## 3. Primer despliegue

### 3.1 Subir los archivos (desde PowerShell)

```powershell
# Crear el paquete de despliegue (excluye node_modules y artefactos)
cd "D:\Trabajo\Unyx Solutions\Develop\unyx_erp"
$dest = "$env:TEMP\unyx-deploy"
Remove-Item -Recurse -Force $dest -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $dest | Out-Null
Copy-Item docker-compose.prod.yml, .env.production.example $dest
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
#   - DATABASE_URL_ALTOSA: conexión real a la base de Altosa

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

### 3.3 Seed inicial (roles, permisos, empresa demo)

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec unyx-backend \
  node dist/scripts/seed-demo.js
```

### 3.4 ETL de importación desde Altosa

```bash
# Simulación (no escribe nada)
docker compose --env-file .env.production -f docker-compose.prod.yml exec unyx-backend \
  node dist/scripts/etl-products.js --dry-run

# Importación real (agrupa por nombre de producto y crea padre + variantes)
docker compose --env-file .env.production -f docker-compose.prod.yml exec unyx-backend \
  node dist/scripts/etl-products.js

# Re-importar sobreescribiendo registros existentes (¡cuidado: pisa ediciones manuales!)
docker compose --env-file .env.production -f docker-compose.prod.yml exec unyx-backend \
  node dist/scripts/etl-products.js --force
```

El ETL es idempotente (upsert por SKU). Sin `--force` no modifica registros ya
existentes: solo crea los que falten.

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
# PowerShell: subir solo los archivos modificados (ejemplo: backend/src y frontend/src)
# pscp -r -i C:\ruta\clave.ppk backend\src usuario@IP:/opt/unyx-erp/backend/src
# pscp -r -i C:\ruta\clave.ppk frontend\src usuario@IP:/opt/unyx-erp/frontend/src
```

```bash
# VPS
cd /opt/unyx-erp
docker compose --env-file .env.production -f docker-compose.prod.yml build
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f unyx-backend
```

---

## 5. Backups

```bash
cd /opt/unyx-erp
chmod +x deploy/backup.sh deploy/restore.sh

# Manual
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
