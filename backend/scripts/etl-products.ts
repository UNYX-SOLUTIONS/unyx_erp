import 'dotenv/config';
import { PrismaClient, type KbSyncStatus, type KbValidationStatus, type Prisma } from '@prisma/client';
import type { ProductoPlano } from 'client-altosa';
import { disconnectAltosaClient, getAltosaClient } from '../src/config/database-altosa';

const prisma = new PrismaClient();
const altosa = getAltosaClient();

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');
const DEFAULT_COMPANY_TAX_ID = '0000000000001';

type StagingRow = ProductoPlano;

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
  if (text.includes('sin precio') || text.includes('sin_precio')) {
    return 'SIN_PRECIO';
  }
  return 'PENDIENTE';
}

function aggregateValidation(rows: StagingRow[]): KbValidationStatus {
  const statuses = rows.map((row) => normalizeValidation(row.estado_validacion));
  if (statuses.includes('REQUIERE_CORRECCION')) {
    return 'REQUIERE_CORRECCION';
  }
  if (statuses.includes('PENDIENTE')) {
    return 'PENDIENTE';
  }
  if (statuses.includes('SIN_PRECIO')) {
    return 'SIN_PRECIO';
  }
  return 'APROBADO';
}

function buildKeywords(rows: StagingRow[]): string[] {
  const parts = new Set<string>();
  for (const row of rows) {
    if (row.uso_recomendado) {
      row.uso_recomendado
        .split(';')
        .map((part) => part.trim())
        .filter((part) => part.length > 0)
        .forEach((part) => parts.add(part));
    }
    if (row.producto) {
      parts.add(row.producto.trim());
    }
    if (row.categoria) {
      parts.add(row.categoria.trim());
    }
    if (row.color) {
      parts.add(row.color.trim());
    }
  }
  return Array.from(parts);
}

function buildSpecs(row: StagingRow): Prisma.InputJsonValue | undefined {
  const entries: Record<string, string | number> = {};
  const numericFields: Array<[string, unknown]> = [
    ['ancho_total_cm', row.ancho_total_cm],
    ['profundidad_asiento_cm', row.profundidad_asiento_cm],
    ['altura_total_cm', row.altura_total_cm],
    ['altura_asiento_cm', row.altura_asiento_cm],
    ['ancho_asiento_cm', row.ancho_asiento_cm],
    ['peso_kg', row.peso_kg],
  ];
  for (const [key, value] of numericFields) {
    const parsed = toNumber(value);
    if (parsed !== null) {
      entries[key] = parsed;
    }
  }
  const textFields: Array<[string, string | null]> = [
    ['material', row.material],
    ['tapizado', row.tapizado],
    ['estructura', row.estructura],
    ['mecanismo', row.mecanismo],
    ['proteccion_uv', row.proteccion_uv],
    ['resistencia_intemperie', row.resistencia_intemperie],
    ['apilable', row.apilable],
    ['brazos', row.brazos],
    ['soporte_lumbar', row.soporte_lumbar],
    ['cabecera', row.cabecera],
    ['uso_recomendado', row.uso_recomendado],
    ['id_catalogo', row.id_catalogo],
    ['pagina_catalogo', row.pagina_catalogo],
    ['observaciones_cliente', row.observaciones_cliente],
    ['especificaciones_adicionales', row.especificaciones_adicionales],
  ];
  for (const [key, value] of textFields) {
    if (value !== null && value !== undefined && value.trim().length > 0) {
      entries[key] = value.trim();
    }
  }
  return Object.keys(entries).length > 0 ? entries : undefined;
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

interface EtlCounters {
  parentsCreated: number;
  parentsUpdated: number;
  parentsSkipped: number;
  variantsCreated: number;
  variantsUpdated: number;
  variantsSkipped: number;
  rowsWithoutName: number;
}

function groupRows(rows: StagingRow[]): Map<string, StagingRow[]> {
  const groups = new Map<string, StagingRow[]>();
  for (const row of rows) {
    const name = (row.producto ?? '').trim();
    if (name.length === 0) {
      continue;
    }
    const existing = groups.get(name);
    if (existing) {
      existing.push(row);
    } else {
      groups.set(name, [row]);
    }
  }
  return groups;
}

async function runEtl(): Promise<void> {
  const companyId = await resolveCompanyId();

  let rows: StagingRow[];
  try {
    rows = await altosa.productoPlano.findMany({ where: { is_active: true } });
  } catch {
    throw new Error(
      'No se pudo leer la tabla plana "productos" en la DB de Altosa. Verifica DATABASE_URL_ALTOSA y la conectividad. En local usa backend/scripts/sql/local-staging-productos.sql para simularla.'
    );
  }

  const groups = groupRows(rows);
  const rowsWithoutName = rows.length - Array.from(groups.values()).reduce((sum, group) => sum + group.length, 0);

  const counters: EtlCounters = {
    parentsCreated: 0,
    parentsUpdated: 0,
    parentsSkipped: 0,
    variantsCreated: 0,
    variantsUpdated: 0,
    variantsSkipped: 0,
    rowsWithoutName,
  };

  const usedParentSkus = new Set<string>();
  const usedVariantSkus = new Set<string>();
  let groupIndex = 0;

  for (const [name, group] of groups.entries()) {
    groupIndex += 1;
    const first = group[0] as StagingRow;
    let parentSku = (first.producto_id ?? `GRP-${String(groupIndex).padStart(4, '0')}`).trim();
    if (usedParentSkus.has(parentSku)) {
      parentSku = `${parentSku}-G${groupIndex}`;
    }
    usedParentSkus.add(parentSku);

    const keywords = buildKeywords(group);
    const parentData = {
      name,
      line: first.categoria ?? null,
      category: first.categoria ?? null,
      subcategory: first.uso_recomendado ?? null,
      description: first.especificaciones_adicionales ?? null,
      commercialDescription: first.descripcion ?? null,
      keywords,
      sourceUrl: first.url_producto ?? null,
      validation: aggregateValidation(group),
      syncStatus: 'SINCRONIZADO' as KbSyncStatus,
      isActive: true,
      sourceRowKey: first.source_row_key ?? null,
      lastSyncedAt: new Date(),
    };

    const existingParent = await prisma.kbProduct.findUnique({
      where: { companyId_sku: { companyId, sku: parentSku } },
    });

    let parentId: string | null = existingParent?.id ?? null;

    if (!existingParent) {
      counters.parentsCreated += 1;
      if (!DRY_RUN) {
        const created = await prisma.kbProduct.create({
          data: { companyId, sku: parentSku, ...parentData },
        });
        parentId = created.id;
      }
    } else if (FORCE) {
      counters.parentsUpdated += 1;
      if (!DRY_RUN && parentId) {
        await prisma.kbProduct.update({ where: { id: parentId }, data: parentData });
      }
    } else {
      counters.parentsSkipped += 1;
    }

    let variantIndex = 0;
    for (const row of group) {
      variantIndex += 1;
      let variantSku = (row.sku ?? '').trim() || `${parentSku}-V${variantIndex}`;
      if (usedVariantSkus.has(variantSku)) {
        variantSku = `${variantSku}-${variantIndex}`;
      }
      usedVariantSkus.add(variantSku);

      const variantData = {
        name: (row.color ?? '').trim() || `Variante ${variantIndex}`,
        color: row.color ?? null,
        price: toNumber(row.precio_usd),
        sortOrder: variantIndex - 1,
        sourceRowKey: row.source_row_key ?? null,
        especificaciones: buildSpecs(row),
      };

      const existingVariant = await prisma.kbProductVariant.findUnique({
        where: { sku: variantSku },
      });

      if (!existingVariant) {
        counters.variantsCreated += 1;
        if (!DRY_RUN && parentId) {
          await prisma.kbProductVariant.create({
            data: { productId: parentId, sku: variantSku, ...variantData },
          });
        }
      } else if (FORCE) {
        counters.variantsUpdated += 1;
        if (!DRY_RUN) {
          await prisma.kbProductVariant.update({
            where: { id: existingVariant.id },
            data: variantData,
          });
        }
      } else {
        counters.variantsSkipped += 1;
      }
    }
  }

  const prefix = DRY_RUN ? '[dry-run] ' : '';
  console.log(
    `${prefix}ETL completado:\n` +
      `  Filas leídas de Altosa: ${rows.length} (${counters.rowsWithoutName} sin nombre, ignoradas)\n` +
      `  Productos padre: ${counters.parentsCreated} creados, ${counters.parentsUpdated} actualizados, ${counters.parentsSkipped} sin cambios\n` +
      `  Variantes: ${counters.variantsCreated} creadas, ${counters.variantsUpdated} actualizadas, ${counters.variantsSkipped} sin cambios` +
      (FORCE ? '\n  Modo --force: los registros existentes fueron sobreescritos' : '')
  );
}

runEtl()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await disconnectAltosaClient();
  });
