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

const CACHE_TTL_MS = 2 * 60 * 1000;
let cache: { key: string; expiresAt: number; data: ExternalPendingResult } | null = null;

/**
 * El ERP ya no consulta Meta ni Contifico: Altosa posee ambos tokens y arma
 * la bandeja unificada. Aquí solo se hace un proxy con cache corto.
 */
export async function getExternalPending(
  query: AltosaExternalPendingQuery
): Promise<ExternalPendingResult> {
  const cacheKey = JSON.stringify({
    limit: query.limit,
    search: query.search ?? '',
    source: query.source,
  });
  if (cache && cache.key === cacheKey && cache.expiresAt > Date.now()) {
    return cache.data;
  }

  const { data } = await altosaGet<ExternalPendingResult>(
    '/api/v1/external/pending',
    {
      limit: query.limit,
      search: query.search,
      source: query.source,
    },
    { timeoutMs: 120_000 }
  );
  cache = {
    key: cacheKey,
    expiresAt: Date.now() + CACHE_TTL_MS,
    data,
  };
  return data;
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
