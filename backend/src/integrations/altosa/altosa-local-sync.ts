import type { KbProduct, KbProductVariant, KbSyncStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { syncProducts as syncAltosaProducts } from './altosa-sync-client';
import type { AltosaSyncProduct } from './altosa-schema';

const ALTOSA_RETRY_ATTEMPTS = 3;
const ALTOSA_RETRY_BASE_DELAY_MS = 400;

type LocalProductWithVariants = KbProduct & { variants: KbProductVariant[] };

function contificoIdFromSourceRowKey(
  sourceRowKey: string | null | undefined
): string | null {
  if (!sourceRowKey?.startsWith('contifico:')) {
    return null;
  }
  const id = sourceRowKey.slice('contifico:'.length).trim();
  return id.length > 0 ? id : null;
}

async function withRetries<T>(operation: () => Promise<T>, label: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= ALTOSA_RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === ALTOSA_RETRY_ATTEMPTS) {
        break;
      }
      const retryInMs = ALTOSA_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
      logger.warn(
        { err: error, attempt, retryInMs, label },
        'Reintentando operación contra Altosa'
      );
      await new Promise((resolve) => setTimeout(resolve, retryInMs));
    }
  }
  throw lastError;
}

export function buildAltosaPayloadFromLocal(
  product: LocalProductWithVariants
): AltosaSyncProduct {
  const variants = product.variants.filter((variant) => variant.deletedAt === null);

  const mappedVariants =
    variants.length > 0
      ? variants.map((variant, index) => {
          const isPrimaryVariant =
            variants.length === 1 ||
            index === 0 ||
            (variant.sourceRowKey?.startsWith('contifico:') ?? false) ||
            variant.sku === product.sku;
          const contificoId =
            contificoIdFromSourceRowKey(variant.sourceRowKey) ??
            (isPrimaryVariant
              ? contificoIdFromSourceRowKey(product.sourceRowKey)
              : null);
          return {
            sku: variant.sku,
            color: variant.name,
            descripcion: variant.description,
            precioUsd: variant.price === null ? null : Number(variant.price),
            imagenUrl: variant.imageUrl,
            especificaciones: {
              ...((variant.especificaciones as Record<string, unknown> | null) ?? {}),
              stock: variant.stock,
            },
            isActive: variant.isActive,
            ...(contificoId
              ? { contificoId, contificoSku: variant.sku }
              : {}),
          };
        })
      : [
          {
            sku: product.sku,
            color: 'Estándar',
            descripcion: product.description,
            precioUsd: null,
            imagenUrl: product.thumbnailUrl,
            especificaciones: { stock: 0 },
            isActive: product.isActive,
            ...(contificoIdFromSourceRowKey(product.sourceRowKey)
              ? {
                  contificoId: contificoIdFromSourceRowKey(product.sourceRowKey),
                  contificoSku: product.sku,
                }
              : {}),
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

/**
 * Sincroniza un producto local (después de un CRUD del ERP) hacia Altosa.
 * La escritura a Contifico/Meta la decide Altosa con los flags del request.
 * Es best-effort: si Altosa falla, el producto local queda SIN_SINCRONIZAR.
 */
export async function syncLocalProductToAltosa(
  productId: string,
  options: {
    updateTaxonomy?: boolean;
    matchByName?: boolean;
    syncExternals?: boolean;
    writeThroughMeta?: boolean;
    writeThroughContifico?: boolean;
  } = {}
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
    const response = await withRetries(
      () =>
        syncAltosaProducts(
          [options.updateTaxonomy ? { ...payload, updateTaxonomy: true } : payload],
          {
            matchByName: options.matchByName ?? false,
            syncExternals: options.syncExternals ?? false,
            writeThroughMeta: options.writeThroughMeta ?? false,
            writeThroughContifico: options.writeThroughContifico ?? false,
          }
        ),
      'push de producto a Altosa'
    );

    const warnings = (
      response.data as
        | {
            meta?: { warnings?: string[] };
            contifico?: { warnings?: string[] };
          }
        | undefined
    );
    const allWarnings = [
      ...(warnings?.meta?.warnings ?? []),
      ...(warnings?.contifico?.warnings ?? []),
    ];
    if (allWarnings.length > 0) {
      logger.warn(
        { productId, warnings: allWarnings },
        'El producto se sincronizó a Altosa, pero hubo advertencias externas'
      );
    }

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
