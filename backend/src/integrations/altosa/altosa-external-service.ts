import { altosaGet, altosaRequest } from './altosa-client';
import type {
  AltosaExternalHealthQuery,
  AltosaExternalImportItem,
  AltosaExternalPendingQuery,
  AltosaExternalRepairBody,
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

export type ExternalHealthStatus =
  | 'ok'
  | 'inactive'
  | 'missing'
  | 'mismatch'
  | 'unmapped'
  | 'unknown';

export interface ExternalHealthItem {
  variantId: number;
  productId: number;
  productName: string;
  variantName: string | null;
  sku: string | null;
  contifico: ExternalHealthStatus;
  meta: ExternalHealthStatus;
  contificoId: string | null;
  metaRetailerId: string | null;
}

export interface ExternalHealthResult {
  checkedAt: string;
  counts: {
    contificoMissing: number;
    contificoInactive: number;
    contificoMismatch: number;
    metaMissing: number;
    totalIssues: number;
    warnings: number;
  };
  items: ExternalHealthItem[];
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

export async function getExternalHealth(
  query: AltosaExternalHealthQuery
): Promise<ExternalHealthResult> {
  const { data } = await altosaGet<ExternalHealthResult>(
    '/api/v1/external/health',
    { refresh: query.refresh ? 'true' : 'false' },
    { timeoutMs: 120_000 }
  );
  return data;
}

export async function repairExternalMapping(
  input: AltosaExternalRepairBody
): Promise<unknown> {
  const { data } = await altosaRequest<unknown>('POST', '/api/v1/external/repair', {
    body: input,
    timeoutMs: 60_000,
  });
  cache = null;
  return data;
}
