import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/auth-middleware';
import { requirePermission } from '../../middlewares/rbac-middleware';
import { validate } from '../../middlewares/validate-middleware';
import { asyncHandler } from '../../utils/async-handler';
import { sendSuccess } from '../../utils/api-response';
import { altosaRequest } from './altosa-client';

const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(120),
  limit: z.coerce.number().int().min(1).max(20).default(8),
});

const productsQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const idParamSchema = z.object({ id: z.string().trim().min(1).max(100) });

const importBodySchema = z
  .object({
    contificoId: z.string().trim().min(1).max(100).optional(),
    sku: z.string().trim().min(1).max(120).optional(),
  })
  .refine((value) => Boolean(value.contificoId || value.sku), {
    message: 'Debes indicar contificoId o sku.',
  });

const syncBodySchema = z.object({
  dryRun: z.boolean().optional(),
  onlySku: z.string().trim().max(120).optional(),
  matchByName: z.boolean().optional(),
  prune: z.boolean().optional(),
  createMissing: z.boolean().optional(),
});

/**
 * Compatibilidad del contrato del ERP: estas rutas ya no hablan con Contifico
 * ni leen CONTIFICO_API_KEY. Son un proxy fino hacia Altosa, que es la única
 * dueña del token y de la lógica de integración.
 */
export const contificoProxyRoutes = Router();

contificoProxyRoutes.use(authenticate);

contificoProxyRoutes.get(
  '/status',
  asyncHandler(async (_req, res) => {
    const { data } = await altosaRequest<unknown>('GET', '/api/v1/contifico/status');
    sendSuccess(res, data);
  })
);

contificoProxyRoutes.get(
  '/search',
  validate(searchQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof searchQuerySchema>;
    const { data } = await altosaRequest<unknown>('GET', '/api/v1/contifico/search', {
      query: { q: query.q, limit: query.limit },
      timeoutMs: 30_000,
    });
    sendSuccess(res, data);
  })
);

contificoProxyRoutes.get(
  '/products',
  validate(productsQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof productsQuerySchema>;
    const { data } = await altosaRequest<unknown>('GET', '/api/v1/contifico/products', {
      query: { search: query.search, limit: query.limit },
      timeoutMs: 45_000,
    });
    sendSuccess(res, data);
  })
);

contificoProxyRoutes.get(
  '/products/:id',
  validate(idParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    const { data } = await altosaRequest<unknown>(
      'GET',
      `/api/v1/contifico/products/${encodeURIComponent(String(req.params.id))}`,
      { timeoutMs: 30_000 }
    );
    sendSuccess(res, data);
  })
);

contificoProxyRoutes.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const { data } = await altosaRequest<unknown>(
      'GET',
      '/api/v1/contifico/categories',
      { timeoutMs: 30_000 }
    );
    sendSuccess(res, data);
  })
);

contificoProxyRoutes.post(
  '/import',
  validate(importBodySchema),
  asyncHandler(async (req, res) => {
    const { data } = await altosaRequest<unknown>('POST', '/api/v1/contifico/import', {
      body: req.body,
      timeoutMs: 60_000,
    });
    sendSuccess(res, data);
  })
);

contificoProxyRoutes.post(
  '/sync',
  requirePermission('products.update'),
  validate(syncBodySchema),
  asyncHandler(async (req, res) => {
    const { data } = await altosaRequest<unknown>('POST', '/api/v1/contifico/sync', {
      body: req.body,
      timeoutMs: 300_000,
    });
    sendSuccess(res, data);
  })
);
