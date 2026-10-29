import { prisma } from '../../config/database';
import { env } from '../../config/env';
import {
  createContificoProduct,
  deactivateContificoProduct,
  fetchContificoCategories,
  searchContificoProducts,
  updateContificoProduct,
} from './contifico-catalog';
import { mapContificoProduct, resolveContificoSku } from './contifico-mappers';
import { resolveSyncCompanyId, syncContificoCatalog } from './contifico-sync';
import type {
  ContificoProductDto,
  ContificoProductSuggestion,
  ContificoSyncCounters,
  ContificoSyncOptions,
} from './contifico-types';

export function isContificoConfigured(): boolean {
  return Boolean(env.CONTIFICO_API_KEY);
}

export function contificoIdFromSourceRowKey(sourceRowKey: string | null | undefined): string | null {
  if (!sourceRowKey?.startsWith('contifico:')) {
    return null;
  }
  const id = sourceRowKey.slice('contifico:'.length).trim();
  return id.length > 0 ? id : null;
}

export interface ErpProductToContifico {
  sku: string;
  name: string;
  description?: string | null;
  commercialDescription?: string | null;
  category?: string | null;
  line?: string | null;
  isActive?: boolean;
  price?: number | null;
}

function resolveCategoryName(input: ErpProductToContifico): string | undefined {
  return input.category?.trim() || input.line?.trim() || 'General';
}

export async function createContificoProductFromErp(
  input: ErpProductToContifico
): Promise<ContificoProductDto | null> {
  if (!isContificoConfigured()) {
    return null;
  }

  // Antes de crear, valida por SKU para no duplicar un producto que ya existe
  // en el catálogo plano de Contifico (alta desde el ERP).
  const matches = await searchContificoProducts(input.sku, 10);
  const existing = matches.find(
    (product) =>
      resolveContificoSku(product).trim().toLowerCase() ===
      input.sku.trim().toLowerCase()
  );
  if (existing) {
    return existing;
  }

  const price = input.price ?? 0;
  return createContificoProduct({
    codigo: input.sku,
    nombre: input.name,
    descripcion: input.commercialDescription?.trim() || input.description?.trim() || undefined,
    categoriaNombre: resolveCategoryName(input),
    pvp1: price,
    pvpManual: price <= 0,
    estado: input.isActive === false ? 'I' : 'A',
  });
}

export async function updateContificoProductFromErp(
  id: string,
  input: Partial<ErpProductToContifico>
): Promise<ContificoProductDto | null> {
  if (!isContificoConfigured()) {
    return null;
  }

  return updateContificoProduct(id, {
    ...(input.name !== undefined ? { nombre: input.name } : {}),
    ...(input.commercialDescription !== undefined || input.description !== undefined
      ? { descripcion: input.commercialDescription?.trim() || input.description?.trim() || '' }
      : {}),
    ...(input.category !== undefined || input.line !== undefined
      ? { categoriaNombre: resolveCategoryName(input as ErpProductToContifico) }
      : {}),
    ...(input.isActive !== undefined ? { estado: input.isActive ? 'A' : 'I' } : {}),
    ...(input.price !== undefined
      ? { pvp1: input.price ?? 0, pvpManual: (input.price ?? 0) <= 0 }
      : {}),
    // La imagen se mantiene en la DB local y Altosa. No se envía a Contifico
    // porque su API v2 espera un objeto Foto, no una URL plana.
  });
}

export async function deactivateContificoProductFromErp(
  id: string
): Promise<ContificoProductDto | null> {
  if (!isContificoConfigured()) {
    return null;
  }
  return deactivateContificoProduct(id);
}

export async function syncCatalog(
  options: ContificoSyncOptions = {}
): Promise<ContificoSyncCounters> {
  return syncContificoCatalog(options);
}

/**
 * Sugerencias para el buscador del panel de producto: consulta Contifico y
 * marca cuáles ya existen en el catálogo local del ERP.
 */
export async function searchProductSuggestions(
  query: string,
  limit = 8
): Promise<ContificoProductSuggestion[]> {
  const raw = await searchContificoProducts(query, limit);
  if (raw.length === 0) {
    return [];
  }

  const categories = await fetchContificoCategories();
  const categoryById = new Map(categories.map((category) => [category.id, category.nombre]));
  const products = raw.map((product) =>
    mapContificoProduct(
      product,
      product.categoria_id ? categoryById.get(product.categoria_id) ?? null : null
    )
  );

  const companyId = await resolveSyncCompanyId();
  const skus = products.map((product) => product.sku);
  const localProducts = await prisma.kbProduct.findMany({
    where: { companyId, sku: { in: skus }, deletedAt: null },
    select: { id: true, sku: true },
  });
  const localBySku = new Map(localProducts.map((product) => [product.sku, product.id]));

  return products.map((product) => ({
    contificoId: product.externalId,
    sku: product.sku,
    name: product.name,
    category: product.category,
    price: product.price,
    stock: product.stock,
    imageUrl: product.thumbnailUrl,
    barcode: product.barcode,
    alreadyAdded: localBySku.has(product.sku),
    localProductId: localBySku.get(product.sku) ?? null,
  }));
}
