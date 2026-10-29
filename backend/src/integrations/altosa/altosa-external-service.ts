import { logger } from '../../config/logger';
import { fetchAllContificoProducts } from '../contifico/contifico-catalog';
import { mapContificoProduct } from '../contifico/contifico-mappers';
import { altosaGet, altosaRequest } from './altosa-client';
import type {
  AltosaExternalImportItem,
  AltosaExternalPendingQuery,
} from './altosa-schema';

export type ExternalSource = 'meta' | 'contifico';

export interface ExternalPendingItem {
  source: ExternalSource;
  sources: ExternalSource[];
  externalId: string;
  sku: string | null;
  metaRetailerId: string | null;
  contificoId: string | null;
  contificoSku: string | null;
  name: string;
  price: number | null;
  imageUrl: string | null;
  url: string | null;
  stock: number | null;
  category: string | null;
  barcode: string | null;
  availability: string | null;
}

export interface ExternalPendingResult {
  items: ExternalPendingItem[];
  counts: { meta: number; contifico: number; total: number };
  warnings: string[];
}

interface MetaPendingRaw {
  retailerId: string;
  name: string;
  imageUrl: string | null;
  price: string | null;
  availability: string | null;
  visibility: string | null;
  url: string | null;
}

interface ExternalLink {
  idVariante: number;
  idProducto: number;
  sku: string | null;
  color: string | null;
  metaRetailerId: string | null;
  contificoId: string | null;
  contificoSku: string | null;
  producto: { producto: string } | null;
}

interface PendingCache {
  expiresAt: number;
  items: ExternalPendingItem[];
  metaCount: number;
  contificoCount: number;
  warnings: string[];
}

const CACHE_TTL_MS = 2 * 60 * 1000;
let cache: PendingCache | null = null;
let inFlight: Promise<PendingCache> | null = null;

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function parseMetaPrice(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const match = value.replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

async function loadMetaPending(): Promise<{
  items: ExternalPendingItem[];
  total: number;
}> {
  const { data } = await altosaGet<{ items: MetaPendingRaw[]; total: number }>(
    '/api/v1/external/meta/pending',
    { limit: 500 },
    { timeoutMs: 45_000 }
  );

  return {
    total: data.total,
    items: data.items.map((item) => ({
      source: 'meta',
      sources: ['meta'],
      externalId: item.retailerId,
      sku: null,
      metaRetailerId: item.retailerId,
      contificoId: null,
      contificoSku: null,
      name: item.name || item.retailerId,
      price: parseMetaPrice(item.price),
      imageUrl: item.imageUrl,
      url: item.url,
      stock: null,
      category: null,
      barcode: null,
      availability: item.availability,
    })),
  };
}

async function loadContificoPending(links: ExternalLink[]): Promise<ExternalPendingItem[]> {
  const products = await fetchAllContificoProducts();

  const mappedIds = new Set(
    links
      .map((link) => normalize(link.contificoId))
      .filter((value): value is string => Boolean(value))
  );
  const mappedSkus = new Set(
    links
      .map((link) => normalize(link.contificoSku ?? link.sku))
      .filter((value): value is string => Boolean(value))
  );
  const existingNames = new Set<string>();
  for (const link of links) {
    const productName = link.producto?.producto?.trim();
    if (!productName) {
      continue;
    }
    existingNames.add(normalize(productName));
    const color = link.color?.trim();
    if (color && !/^est[aá]ndar$/i.test(color)) {
      existingNames.add(normalize(`${productName} ${color}`));
    }
  }

  return products
    .map((product) => mapContificoProduct(product, null))
    .filter((product) => product.isActive)
    .filter((product) => {
      const id = normalize(product.externalId);
      const sku = normalize(product.sku);
      return (
        !mappedIds.has(id) &&
        !mappedSkus.has(sku) &&
        !existingNames.has(normalize(product.name))
      );
    })
    .map((product) => ({
      source: 'contifico' as const,
      sources: ['contifico' as const],
      externalId: product.externalId,
      sku: product.sku,
      metaRetailerId: null,
      contificoId: product.externalId,
      contificoSku: product.sku,
      name: product.name,
      price: product.price,
      imageUrl: product.thumbnailUrl,
      url: null,
      stock: product.stock,
      category: product.category,
      barcode: product.barcode,
      availability: 'in stock',
    }));
}

/**
 * Un mismo ítem plano puede existir en Meta y Contifico. Se agrupa por nombre
 * para que la ingesta cree UNA variante con ambos IDs externos, no dos.
 */
function mergeExternalItems(
  meta: ExternalPendingItem[],
  contifico: ExternalPendingItem[]
): ExternalPendingItem[] {
  const groups = new Map<string, ExternalPendingItem>();

  const add = (item: ExternalPendingItem) => {
    const key = normalize(item.name);
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, { ...item, sources: [...item.sources] });
      return;
    }

    if (!existing.sources.includes(item.source)) {
      existing.sources.push(item.source);
    }
    if (item.source === 'meta') {
      existing.metaRetailerId = item.metaRetailerId ?? item.externalId;
    } else {
      existing.contificoId = item.contificoId ?? item.externalId;
      existing.contificoSku = item.contificoSku ?? item.sku;
    }
    existing.sku ??= item.sku;
    existing.price ??= item.price;
    existing.imageUrl ??= item.imageUrl;
    existing.url ??= item.url;
    existing.stock ??= item.stock;
    existing.category ??= item.category;
    existing.barcode ??= item.barcode;
    existing.availability ??= item.availability;
  };

  meta.forEach(add);
  contifico.forEach(add);
  return Array.from(groups.values());
}

async function loadPending(): Promise<PendingCache> {
  const { data: links } = await altosaGet<{ items: ExternalLink[] }>(
    '/api/v1/external/links',
    undefined,
    { timeoutMs: 30_000 }
  );

  const warnings: string[] = [];

  const [meta, contifico] = await Promise.all([
    loadMetaPending().catch((error) => {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      warnings.push(`No se pudieron consultar los pendientes de Meta: ${message}`);
      logger.warn({ err: error }, 'No se pudieron cargar los pendientes de Meta');
      return { items: [], total: 0 };
    }),
    loadContificoPending(links.items).catch((error) => {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      warnings.push(`No se pudieron consultar los pendientes de Contifico: ${message}`);
      logger.warn({ err: error }, 'No se pudieron cargar los pendientes de Contifico');
      return [] as ExternalPendingItem[];
    }),
  ]);

  return {
    expiresAt: Date.now() + CACHE_TTL_MS,
    items: mergeExternalItems(meta.items, contifico),
    metaCount: meta.total,
    contificoCount: contifico.length,
    warnings,
  };
}

async function getPendingCache(): Promise<PendingCache> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache;
  }
  if (inFlight) {
    return inFlight;
  }

  inFlight = loadPending()
    .then((data) => {
      cache = data;
      return data;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export async function getExternalPending(
  query: AltosaExternalPendingQuery
): Promise<ExternalPendingResult> {
  const data = await getPendingCache();
  const term = normalize(query.search);
  const matches = (item: ExternalPendingItem): boolean => {
    if (query.source !== 'all' && !item.sources.includes(query.source)) {
      return false;
    }
    if (!term) {
      return true;
    }
    return [
      item.name,
      item.sku,
      item.externalId,
      item.metaRetailerId,
      item.contificoId,
      item.contificoSku,
      item.category,
    ].some((value) => normalize(value).includes(term));
  };

  const filtered = data.items
    .filter(matches)
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, query.limit);

  return {
    items: filtered,
    counts: {
      meta: data.metaCount,
      contifico: data.contificoCount,
      total: data.items.length,
    },
    warnings: data.warnings,
  };
}

export async function importExternalItems(
  items: AltosaExternalImportItem[]
): Promise<unknown> {
  const { data } = await altosaRequest<unknown>('POST', '/api/v1/external/import', {
    body: { items },
    timeoutMs: 120_000,
  });
  cache = null;
  return data;
}
