import 'dotenv/config';
import { PrismaClient, type KbSyncStatus, type KbValidationStatus } from '@prisma/client';

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes('--dry-run');
const DEFAULT_COMPANY_TAX_ID = '0000000000001';

interface StagingProductRow {
  producto_id: string | null;
  sku: string | null;
  producto: string | null;
  categoria: string | null;
  descripcion: string | null;
  url_producto: string | null;
  color: string | null;
  precio_usd: unknown;
  uso_recomendado: string | null;
  especificaciones_adicionales: string | null;
  estado_validacion: string | null;
  is_active: boolean | null;
  source_row_key: string | null;
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = Number(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeValidation(value: string | null): KbValidationStatus {
  const text = (value ?? '').toLowerCase();
  if (text.includes('aprob')) {
    return 'APROBADO';
  }
  if (text.includes('correc') || text.includes('incomplet')) {
    return 'REQUIERE_CORRECCION';
  }
  return 'PENDIENTE';
}

function buildKeywords(row: StagingProductRow): string[] {
  const parts = [
    ...(row.uso_recomendado ? row.uso_recomendado.split(';') : []),
    row.producto ?? '',
    row.categoria ?? '',
    row.color ?? '',
  ];
  const unique = new Set(
    parts.map((part) => part.trim()).filter((part) => part.length > 0)
  );
  return Array.from(unique);
}

async function resolveCompanyId(): Promise<string> {
  const company =
    (await prisma.company.findUnique({ where: { taxId: DEFAULT_COMPANY_TAX_ID } })) ??
    (await prisma.company.findFirst({ orderBy: { createdAt: 'asc' } }));
  if (!company) {
    throw new Error('No hay empresa configurada. Corre primero: pnpm db:seed');
  }
  return company.id;
}

async function main(): Promise<void> {
  const companyId = await resolveCompanyId();

  let rows: StagingProductRow[];
  try {
    rows = await prisma.$queryRaw<StagingProductRow[]>`
      SELECT producto_id, sku, producto, categoria, descripcion, url_producto, color,
             precio_usd, uso_recomendado, especificaciones_adicionales,
             estado_validacion, is_active, source_row_key
      FROM "productos"
    `;
  } catch {
    throw new Error(
      'No se pudo leer la tabla plana "productos". Verifica que exista en esta base de datos (en el VPS ya está poblada; en local usa backend/scripts/sql/local-staging-productos.sql para probar).'
    );
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const sku = (row.producto_id ?? row.sku ?? '').trim();
    if (sku.length === 0) {
      skipped += 1;
      continue;
    }

    const name = (row.producto ?? '').trim() || `Producto ${sku}`;
    const data = {
      name,
      line: row.categoria ?? null,
      category: row.categoria ?? null,
      subcategory: null,
      description: row.especificaciones_adicionales ?? null,
      commercialDescription: row.descripcion ?? null,
      keywords: buildKeywords(row),
      color: row.color ?? null,
      price: toNumber(row.precio_usd),
      validation: normalizeValidation(row.estado_validacion),
      syncStatus: 'SINCRONIZADO' as KbSyncStatus,
      isActive: row.is_active ?? true,
      sourceUrl: row.url_producto ?? null,
      variantCount: 1,
      variantLabel: row.color ?? null,
      sourceRowKey: row.source_row_key ?? null,
      lastSyncedAt: new Date(),
    };

    const existing = await prisma.kbProduct.findUnique({
      where: { companyId_sku: { companyId, sku } },
    });

    if (DRY_RUN) {
      if (existing) {
        updated += 1;
      } else {
        created += 1;
      }
      continue;
    }

    await prisma.kbProduct.upsert({
      where: { companyId_sku: { companyId, sku } },
      create: { companyId, sku, ...data },
      update: data,
    });

    if (existing) {
      updated += 1;
    } else {
      created += 1;
    }
  }

  const prefix = DRY_RUN ? '[dry-run] ' : '';
  console.log(
    `${prefix}ETL completado: ${rows.length} filas leídas, ${created} creadas, ${updated} actualizadas, ${skipped} omitidas (sin SKU)`
  );
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
