import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type {
  KbProduct,
  KbProductVariant,
  KbSyncStatus,
  KbValidationStatus,
  Prisma,
} from '@prisma/client';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { syncProducts as syncAltosaProducts } from '../altosa/altosa-sync-client';
import type { AltosaSyncProduct } from '../altosa/altosa-schema';
import { fetchAllContificoProducts, fetchContificoCategories } from './contifico-catalog';
import { mapContificoProduct } from './contifico-mappers';
import type {
  ContificoCanonicalProduct,
  ContificoCanonicalVariant,
  ContificoSyncCounters,
  ContificoSyncOptions,
} from './contifico-types';

const DEFAULT_COMPANY_TAX_ID = '0000000000001';
const ALTOSA_BATCH_SIZE = 50;

type LocalProductWithVariants = KbProduct & { variants: KbProductVariant[] };

export async function resolveSyncCompanyId(): Promise<string> {
  const company =
    (await prisma.company.findUnique({ where: { taxId: DEFAULT_COMPANY_TAX_ID } })) ??
    (await prisma.company.findFirst({ orderBy: { createdAt: 'asc' } }));
  if (!company) {
    throw new Error('No hay una empresa configurada para sincronizar productos.');
  }
  return company.id;
}

function toJson(value: Record<string, unknown>): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function stockAsInt(value: number): number {
  return Math.round(value);
}

function buildValidation(price: number | null): KbValidationStatus {
  return price !== null && price > 0 ? 'APROBADO' : 'SIN_PRECIO';
}

function buildAltosaPayloadFromCanonical(product: ContificoCanonicalProduct): AltosaSyncProduct {
  return {
    codigo: product.sku,
    nombre: product.name,
    descripcion: product.commercialDescription ?? product.description ?? null,
    usoRecomendado: product.description,
    categoria: product.category ?? product.line ?? 'General',
    subcategoria: product.subcategory ?? 'General',
    estado: product.isActive ? 'A' : 'I',
    updateTaxonomy: false,
    variantes: product.variants.map((variant) => ({
      sku: variant.sku,
      color: variant.name,
      descripcion: variant.description,
      precioUsd: variant.price,
      imagenUrl: variant.imageUrl,
      especificaciones: {
        ...variant.especificaciones,
        stock: variant.stock,
      },
    })),
  };
}

function buildAltosaPayloadFromLocal(
  product: LocalProductWithVariants
): AltosaSyncProduct {
  const variants = product.variants.filter((variant) => variant.deletedAt === null);

  const mappedVariants =
    variants.length > 0
      ? variants.map((variant) => ({
          sku: variant.sku,
          color: variant.name,
          descripcion: variant.description,
          precioUsd: variant.price === null ? null : Number(variant.price),
          imagenUrl: variant.imageUrl,
          especificaciones: {
            ...((variant.especificaciones as Record<string, unknown> | null) ?? {}),
            stock: variant.stock,
          },
        }))
      : [
          {
            sku: product.sku,
            color: 'Estándar',
            descripcion: product.description,
            precioUsd: null,
            imagenUrl: product.thumbnailUrl,
            especificaciones: { stock: 0 },
          },
        ];

  return {
    codigo: product.sku,
    nombre: product.name,
    descripcion: product.commercialDescription ?? product.description ?? null,
    usoRecomendado: product.description,
    categoria: product.category ?? product.line ?? 'General',
    subcategoria: product.subcategory ?? 'General',
    estado: product.isActive ? 'A' : 'I',
    updateTaxonomy: false,
    variantes: mappedVariants,
  };
}

async function upsertVariant(
  productId: string,
  canonical: ContificoCanonicalVariant,
  counters: ContificoSyncCounters
): Promise<void> {
  const sourceRowKey = `contifico:${String(canonical.especificaciones.contifico_id ?? canonical.sku)}`;
  const existing = await prisma.kbProductVariant.findFirst({
    where: {
      OR: [
        { sourceRowKey },
        { sku: canonical.sku },
        // Migración inicial desde el ETL de Altosa: reutiliza la variante
        // principal existente aunque su SKU sea ALT-<id>.
        { productId, sortOrder: canonical.sortOrder },
      ],
    },
  });

  const hasExplicitColor =
    canonical.color !== null ||
    canonical.colorHex !== null ||
    canonical.name !== 'Estándar';
  const existingSpecs = (existing?.especificaciones as Record<string, unknown> | null) ?? {};
  const existingName = existing?.name ?? canonical.name;

  const data = {
    sku: canonical.sku,
    name: hasExplicitColor ? canonical.name : existingName,
    color: hasExplicitColor ? canonical.color : (existing?.color ?? canonical.color),
    colorHex: hasExplicitColor ? canonical.colorHex : (existing?.colorHex ?? canonical.colorHex),
    price: canonical.price,
    stock: stockAsInt(canonical.stock),
    imageUrl: canonical.imageUrl ?? existing?.imageUrl ?? null,
    description: canonical.description ?? existing?.description ?? null,
    isActive: canonical.isActive,
    sortOrder: canonical.sortOrder,
    sourceRowKey,
    especificaciones: toJson({
      ...existingSpecs,
      ...canonical.especificaciones,
      stock: canonical.stock,
    }),
  };

  if (existing) {
    await prisma.kbProductVariant.update({
      where: { id: existing.id },
      data: { ...data, productId },
    });
    counters.variants.updated += 1;
    return;
  }

  await prisma.kbProductVariant.create({
    data: { productId, ...data },
  });
  counters.variants.created += 1;
}

async function upsertCanonicalProduct(
  companyId: string,
  canonical: ContificoCanonicalProduct,
  counters: ContificoSyncCounters,
  dryRun: boolean,
  matchByName: boolean
): Promise<LocalProductWithVariants | null> {
  const sourceRowKey = `contifico:${canonical.externalId}`;
  const existingBySku = await prisma.kbProduct.findUnique({
    where: { companyId_sku: { companyId, sku: canonical.sku } },
    include: { variants: { where: { deletedAt: null } } },
  });
  const existingBySource = await prisma.kbProduct.findFirst({
    where: { companyId, sourceRowKey },
    include: { variants: { where: { deletedAt: null } } },
  });
  const existingByName =
    matchByName && !existingBySku && !existingBySource
      ? await prisma.kbProduct.findFirst({
          where: {
            companyId,
            deletedAt: null,
            name: { equals: canonical.name, mode: 'insensitive' },
          },
          include: { variants: { where: { deletedAt: null } } },
        })
      : null;
  const existing = existingBySource ?? existingBySku ?? existingByName;

  if (existing) {
    counters.products.updated += 1;
    if (dryRun) {
      return existing;
    }

    const preserveCommercial = Boolean(existing.commercialDescription?.trim());
    const preserveKeywords = existing.keywords.length > 0;
    const nextValidation: KbValidationStatus =
      existing.validation === 'SIN_PRECIO' && canonical.price !== null && canonical.price > 0
        ? 'APROBADO'
        : existing.validation;

    const updated = await prisma.kbProduct.update({
      where: { id: existing.id },
      data: {
        sku: canonical.sku,
        name: canonical.name,
        line: canonical.line ?? existing.line,
        category: canonical.category ?? existing.category,
        subcategory: canonical.subcategory ?? existing.subcategory,
        description: canonical.description ?? existing.description,
        ...(preserveCommercial
          ? {}
          : { commercialDescription: canonical.commercialDescription }),
        ...(preserveKeywords ? {} : { keywords: canonical.keywords }),
        thumbnailUrl: canonical.thumbnailUrl ?? existing.thumbnailUrl,
        sourceUrl: canonical.sourceUrl ?? existing.sourceUrl,
        validation: nextValidation,
        syncStatus: 'SINCRONIZADO' as KbSyncStatus,
        isActive: canonical.isActive,
        sourceRowKey,
        lastSyncedAt: new Date(),
      },
      include: { variants: { where: { deletedAt: null } } },
    });

    for (const variant of canonical.variants) {
      await upsertVariant(updated.id, variant, counters);
    }

    return prisma.kbProduct.findUniqueOrThrow({
      where: { id: updated.id },
      include: { variants: { where: { deletedAt: null } } },
    });
  }

  counters.products.created += 1;
  if (dryRun) {
    return null;
  }

  const created = await prisma.kbProduct.create({
    data: {
      companyId,
      sku: canonical.sku,
      name: canonical.name,
      line: canonical.line,
      category: canonical.category,
      subcategory: canonical.subcategory,
      description: canonical.description,
      commercialDescription: canonical.commercialDescription,
      keywords: canonical.keywords,
      thumbnailUrl: canonical.thumbnailUrl,
      sourceUrl: canonical.sourceUrl,
      validation: buildValidation(canonical.price),
      syncStatus: 'SINCRONIZADO' as KbSyncStatus,
      isActive: canonical.isActive,
      sourceRowKey,
      lastSyncedAt: new Date(),
    },
  });

  for (const variant of canonical.variants) {
    await upsertVariant(created.id, variant, counters);
  }

  return prisma.kbProduct.findUniqueOrThrow({
    where: { id: created.id },
    include: { variants: { where: { deletedAt: null } } },
  });
}

async function pushToAltosa(
  items: AltosaSyncProduct[],
  counters: ContificoSyncCounters,
  matchByName: boolean
): Promise<void> {
  const configured = Boolean(env.ALTOSA_API_KEY);
  counters.altosa.configured = configured;
  if (!configured) {
    return;
  }

  for (let index = 0; index < items.length; index += ALTOSA_BATCH_SIZE) {
    const batch = items.slice(index, index + ALTOSA_BATCH_SIZE);
    try {
      await syncAltosaProducts(batch, { matchByName });
      counters.altosa.pushed += batch.length;
    } catch (error) {
      counters.altosa.failed += batch.length;
      counters.altosa.error =
        error instanceof Error ? error.message : 'Error desconocido sincronizando Altosa';
      logger.warn({ err: error, batchSize: batch.length }, 'No se pudo sincronizar un lote a Altosa');
    }
  }
}

/**
 * Sincroniza un producto local (después de un CRUD del ERP) hacia Altosa.
 * Es best-effort: si Altosa falla, el producto local queda marcado como
 * SIN_SINCRONIZAR para que el usuario lo pueda reintentar.
 */
export async function syncLocalProductToAltosa(
  productId: string,
  options: { updateTaxonomy?: boolean } = {}
): Promise<boolean> {
  if (!env.ALTOSA_API_KEY) {
    return false;
  }

  const product = await prisma.kbProduct.findUnique({
    where: { id: productId },
    include: { variants: { where: { deletedAt: null } } },
  });
  if (!product) {
    return false;
  }

  try {
    const payload = buildAltosaPayloadFromLocal(product);
    await syncAltosaProducts([
      options.updateTaxonomy ? { ...payload, updateTaxonomy: true } : payload,
    ]);
    await prisma.kbProduct.update({
      where: { id: productId },
      data: { syncStatus: 'SINCRONIZADO' as KbSyncStatus },
    });
    return true;
  } catch (error) {
    logger.warn({ err: error, productId }, 'No se pudo sincronizar el producto con Altosa');
    await prisma.kbProduct.update({
      where: { id: productId },
      data: { syncStatus: 'SIN_SINCRONIZAR' as KbSyncStatus },
    });
    return false;
  }
}

export async function syncContificoCatalog(
  options: ContificoSyncOptions = {}
): Promise<ContificoSyncCounters> {
  const startedAt = Date.now();
  const dryRun = options.dryRun ?? false;
  const shouldPushToAltosa = options.pushToAltosa ?? true;
  const matchByName = options.matchByName ?? false;
  const counters: ContificoSyncCounters = {
    source: 'contifico',
    dryRun,
    durationMs: 0,
    categoriesFetched: 0,
    products: { fetched: 0, created: 0, updated: 0, skipped: 0 },
    variants: { created: 0, updated: 0, skipped: 0 },
    altosa: { configured: Boolean(env.ALTOSA_API_KEY), pushed: 0, failed: 0 },
  };

  const companyId = await resolveSyncCompanyId();
  const categories = await fetchContificoCategories();
  counters.categoriesFetched = categories.length;
  const categoryById = new Map(categories.map((category) => [category.id, category.nombre]));

  const rawProducts = await fetchAllContificoProducts();
  const products = rawProducts
    .map((product) =>
      mapContificoProduct(product, product.categoria_id ? categoryById.get(product.categoria_id) ?? null : null)
    )
    .filter((product) => {
      if (!options.onlySku) {
        return true;
      }
      return product.sku.toLowerCase() === options.onlySku.toLowerCase();
    });

  counters.products.fetched = products.length;

  const altosaItems: AltosaSyncProduct[] = [];

  for (const product of products) {
    try {
      const local = await upsertCanonicalProduct(
        companyId,
        product,
        counters,
        dryRun,
        matchByName
      );
      altosaItems.push(
        dryRun || !local
          ? buildAltosaPayloadFromCanonical(product)
          : buildAltosaPayloadFromLocal(local)
      );
    } catch (error) {
      counters.products.skipped += 1;
      logger.warn(
        { err: error, sku: product.sku, contificoId: product.externalId },
        'No se pudo sincronizar un producto de Contifico'
      );
    }
  }

  if (!dryRun && shouldPushToAltosa && altosaItems.length > 0) {
    await pushToAltosa(altosaItems, counters, matchByName);
  }

  if (options.exportPath) {
    const payload = { generatedAt: new Date().toISOString(), items: altosaItems };
    await mkdir(dirname(options.exportPath), { recursive: true });
    await writeFile(options.exportPath, JSON.stringify(payload, null, 2), 'utf8');
    counters.exportedTo = options.exportPath;
  }

  counters.durationMs = Date.now() - startedAt;
  return counters;
}
