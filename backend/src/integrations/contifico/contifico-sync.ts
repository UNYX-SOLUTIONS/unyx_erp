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
import { ApiError } from '../../utils/api-error';
import {
  deactivateProductsBySku as deactivateAltosaProductsBySku,
  syncProducts as syncAltosaProducts,
} from '../altosa/altosa-sync-client';
import type { AltosaSyncProduct } from '../altosa/altosa-schema';
import * as altosaService from '../altosa/altosa-service';
import {
  fetchAllContificoProducts,
  fetchContificoCategories,
  fetchContificoProductById,
  searchContificoProducts,
} from './contifico-catalog';
import { mapContificoProduct, resolveContificoSku } from './contifico-mappers';
import type {
  ContificoCanonicalProduct,
  ContificoCanonicalVariant,
  ContificoImportResult,
  ContificoProductDto,
  ContificoSyncCounters,
  ContificoSyncOptions,
} from './contifico-types';

const DEFAULT_COMPANY_TAX_ID = '0000000000001';
const ALTOSA_BATCH_SIZE = 50;
const ALTOSA_DEACTIVATE_BATCH_SIZE = 200;

type LocalProductWithVariants = KbProduct & { variants: KbProductVariant[] };

function createEmptyCounters(dryRun: boolean): ContificoSyncCounters {
  return {
    source: 'contifico',
    dryRun,
    durationMs: 0,
    categoriesFetched: 0,
    products: { fetched: 0, created: 0, updated: 0, skipped: 0, ignored: 0, pruned: 0 },
    variants: { created: 0, updated: 0, skipped: 0 },
    altosa: {
      configured: Boolean(env.ALTOSA_API_KEY),
      pushed: 0,
      failed: 0,
      deactivatedVariants: 0,
      deactivatedProducts: 0,
      deactivationFailed: 0,
    },
  };
}

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
  matchByName: boolean,
  createMissing: boolean
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

  if (!createMissing) {
    counters.products.ignored += 1;
    return null;
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

async function deactivateAltosaSkus(
  skus: string[],
  counters: ContificoSyncCounters
): Promise<void> {
  if (!env.ALTOSA_API_KEY || skus.length === 0) {
    return;
  }

  const unique = Array.from(new Set(skus.filter((sku) => sku.trim().length > 0)));
  for (let index = 0; index < unique.length; index += ALTOSA_DEACTIVATE_BATCH_SIZE) {
    const batch = unique.slice(index, index + ALTOSA_DEACTIVATE_BATCH_SIZE);
    try {
      const response = await deactivateAltosaProductsBySku(batch);
      counters.altosa.deactivatedVariants += response.data.variantsDeactivated ?? 0;
      counters.altosa.deactivatedProducts += response.data.productsDeactivated ?? 0;
    } catch (error) {
      counters.altosa.deactivationFailed += batch.length;
      counters.altosa.error =
        error instanceof Error ? error.message : 'Error desconocido desactivando Altosa';
      logger.warn(
        { err: error, batchSize: batch.length },
        'No se pudo desactivar un lote de SKUs en Altosa'
      );
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
  options: { updateTaxonomy?: boolean; matchByName?: boolean } = {}
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
    await syncAltosaProducts(
      [options.updateTaxonomy ? { ...payload, updateTaxonomy: true } : payload],
      { matchByName: options.matchByName ?? false }
    );
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
  const prune = options.prune ?? false;
  const createMissing = options.createMissing ?? false;

  if (prune && options.onlySku) {
    throw new ApiError(
      400,
      'No se puede combinar --prune con --only. La reconciliación debe correr sobre el catálogo completo.',
      'CONTIFICO_PRUNE_ONLY_CONFLICT'
    );
  }

  const counters = createEmptyCounters(dryRun);

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
  const touchedProductIds = new Set<string>();
  const deactivateSkus = new Set<string>();

  for (const product of products) {
    try {
      const local = await upsertCanonicalProduct(
        companyId,
        product,
        counters,
        dryRun,
        matchByName,
        createMissing
      );
      if (local) {
        touchedProductIds.add(local.id);
        altosaItems.push(
          dryRun ? buildAltosaPayloadFromCanonical(product) : buildAltosaPayloadFromLocal(local)
        );
      } else if (createMissing) {
        // Dry-run: el producto se crearía.
        altosaItems.push(buildAltosaPayloadFromCanonical(product));
      }
      // Si createMissing=false y no existe, se ignora: no se agrega a Altosa.
    } catch (error) {
      counters.products.skipped += 1;
      logger.warn(
        { err: error, sku: product.sku, contificoId: product.externalId },
        'No se pudo sincronizar un producto de Contifico'
      );
    }
  }

  if (prune) {
    if (products.length === 0) {
      logger.warn('Se omitió la reconciliación: Contifico devolvió 0 productos.');
    } else if (counters.products.skipped > 0) {
      logger.warn(
        { skipped: counters.products.skipped },
        'Se omitió la reconciliación para no desactivar productos por errores de sincronización.'
      );
    } else {
      const touched = Array.from(touchedProductIds);
      const candidates = await prisma.kbProduct.findMany({
        where: {
          companyId,
          deletedAt: null,
          ...(touched.length > 0 ? { id: { notIn: touched } } : {}),
        },
        include: { variants: { where: { deletedAt: null } } },
      });

      counters.products.pruned = candidates.length;

      for (const candidate of candidates) {
        const candidateSkus =
          candidate.variants.length > 0
            ? candidate.variants.map((variant) => variant.sku)
            : [candidate.sku];
        for (const sku of candidateSkus) {
          deactivateSkus.add(sku);
        }

        if (!dryRun) {
          await prisma.$transaction([
            prisma.kbProductVariant.updateMany({
              where: { productId: candidate.id, deletedAt: null },
              data: { isActive: false },
            }),
            prisma.kbProduct.update({
              where: { id: candidate.id },
              data: {
                isActive: false,
                syncStatus: 'SIN_SINCRONIZAR' as KbSyncStatus,
                lastSyncedAt: new Date(),
              },
            }),
          ]);
        }
      }

      counters.prunedSkuSample = Array.from(deactivateSkus).slice(0, 20);
      logger.info(
        {
          pruned: counters.products.pruned,
          sampleSkus: counters.prunedSkuSample,
          dryRun,
        },
        'Reconciliación de productos que ya no están en Contifico'
      );
    }
  }

  if (!dryRun && shouldPushToAltosa && altosaItems.length > 0) {
    await pushToAltosa(altosaItems, counters, matchByName);
  }

  if (!dryRun && shouldPushToAltosa && deactivateSkus.size > 0) {
    await deactivateAltosaSkus(Array.from(deactivateSkus), counters);
  }

  if (options.exportPath) {
    const payload = {
      generatedAt: new Date().toISOString(),
      items: altosaItems,
      deactivateSkus: Array.from(deactivateSkus),
    };
    await mkdir(dirname(options.exportPath), { recursive: true });
    await writeFile(options.exportPath, JSON.stringify(payload, null, 2), 'utf8');
    counters.exportedTo = options.exportPath;
  }

  counters.durationMs = Date.now() - startedAt;
  return counters;
}

/**
 * Importa un único producto de Contifico a demanda (buscador del ERP).
 * Crea/actualiza en la DB local, lo replica a Altosa y devuelve el ID de
 * Altosa para que la UI pueda abrir el panel de detalle.
 */
export async function importContificoProduct(input: {
  contificoId?: string;
  sku?: string;
}): Promise<ContificoImportResult> {
  let raw: ContificoProductDto | null = null;

  if (input.contificoId) {
    raw = await fetchContificoProductById(input.contificoId);
  } else if (input.sku) {
    const sku = input.sku;
    const matches = await searchContificoProducts(sku, 20);
    raw =
      matches.find(
        (product) => resolveContificoSku(product).toLowerCase() === sku.toLowerCase()
      ) ?? null;
  }

  if (!raw) {
    throw new ApiError(
      404,
      'Producto no encontrado en Contifico.',
      'CONTIFICO_PRODUCT_NOT_FOUND'
    );
  }

  const categories = await fetchContificoCategories();
  const categoryById = new Map(categories.map((category) => [category.id, category.nombre]));
  const canonical = mapContificoProduct(
    raw,
    raw.categoria_id ? categoryById.get(raw.categoria_id) ?? null : null
  );

  const companyId = await resolveSyncCompanyId();
  const counters = createEmptyCounters(false);
  const local = await upsertCanonicalProduct(
    companyId,
    canonical,
    counters,
    false,
    true,
    true
  );

  if (!local) {
    throw new ApiError(
      500,
      'No se pudo importar el producto de Contifico.',
      'CONTIFICO_IMPORT_FAILED'
    );
  }

  // Un producto agregado a demanda se reactiva si estaba soft-deleted.
  // La validación se calcula igual que en el sync (precio > 0 => aprobado).
  await prisma.$transaction([
    prisma.kbProduct.update({
      where: { id: local.id },
      data: {
        deletedAt: null,
        isActive: canonical.isActive,
      },
    }),
    prisma.kbProductVariant.updateMany({
      where: { productId: local.id },
      data: { deletedAt: null },
    }),
  ]);

  await syncLocalProductToAltosa(local.id, { matchByName: true });

  let altosaProductId: number | undefined;
  if (env.ALTOSA_API_KEY) {
    try {
      const lookupSku = local.variants[0]?.sku ?? local.sku;
      const lookup = await altosaService.getProductByVariantSku(lookupSku);
      const lookupData = lookup.data as
        | { producto?: { id?: number }; id?: number }
        | undefined;
      altosaProductId = lookupData?.producto?.id ?? lookupData?.id;
    } catch (error) {
      logger.warn(
        { err: error, productId: local.id },
        'No se pudo obtener el ID de Altosa del producto importado'
      );
    }
  }

  return {
    localProductId: local.id,
    altosaProductId,
    sku: canonical.sku,
    name: canonical.name,
    created: counters.products.created > 0,
    updated: counters.products.updated > 0,
  };
}
