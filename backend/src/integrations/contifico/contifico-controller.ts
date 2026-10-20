import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { sendSuccess } from '../../utils/api-response';
import { env } from '../../config/env';
import {
  fetchAllContificoProducts,
  fetchContificoCategories,
  fetchContificoProductById,
} from './contifico-catalog';
import { mapContificoProduct } from './contifico-mappers';
import { isContificoConfigured, syncCatalog } from './contifico-service';
import type { ContificoProductsQuery, ContificoSyncBody } from './contifico-schema';

export const status = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, {
    configured: isContificoConfigured(),
    apiUrl: env.CONTIFICO_API_URL,
    hasPosToken: Boolean(env.CONTIFICO_API_TOKEN),
  });
});

export const sync = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as ContificoSyncBody;
  const counters = await syncCatalog({
    dryRun: body.dryRun,
    pushToAltosa: body.pushToAltosa,
    onlySku: body.onlySku,
    matchByName: body.matchByName,
  });
  sendSuccess(res, counters);
});

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ContificoProductsQuery;
  const products = await fetchAllContificoProducts();
  const search = query.search?.toLowerCase();
  const mapped = products
    .map((product) => mapContificoProduct(product, null))
    .filter((product) => {
      if (!search) {
        return true;
      }
      return (
        product.name.toLowerCase().includes(search) ||
        product.sku.toLowerCase().includes(search) ||
        (product.barcode ?? '').toLowerCase().includes(search)
      );
    })
    .slice(0, query.limit)
    .map((product) => ({
      externalId: product.externalId,
      sku: product.sku,
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      barcode: product.barcode,
      isActive: product.isActive,
    }));

  sendSuccess(res, mapped, {
    page: 1,
    limit: query.limit,
    total: mapped.length,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await fetchContificoProductById(req.params.id as string);
  sendSuccess(res, mapContificoProduct(product, null));
});

export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await fetchContificoCategories());
});
