import { altosaRequest } from './altosa-client';
import type { AltosaSyncProduct } from './altosa-schema';

/**
 * Cliente del endpoint de sincronización masiva de altosa-api.
 *
 * Vive en su propio módulo para que `contifico-sync` no dependa de
 * `altosa-service` (que a su vez usa el servicio de productos del ERP para
 * el write-through del CRUD).
 */
export async function syncProducts(
  items: AltosaSyncProduct[],
  options?: { matchByName?: boolean; syncExternals?: boolean }
) {
  return altosaRequest<unknown>('POST', '/api/v1/sync/products', {
    body: {
      items,
      matchByName: options?.matchByName ?? false,
      syncExternals: options?.syncExternals ?? false,
    },
    timeoutMs: 60_000,
  });
}

export interface AltosaDeactivateResult {
  variantsDeactivated: number;
  productsDeactivated: number;
}

export async function deactivateProductsBySku(
  skus: string[]
): Promise<{ data: AltosaDeactivateResult }> {
  return altosaRequest<AltosaDeactivateResult>('POST', '/api/v1/sync/products/deactivate', {
    body: { skus },
    timeoutMs: 60_000,
  });
}
