import { z } from 'zod';

export const contificoSyncBodySchema = z.object({
  dryRun: z.boolean().optional().default(false),
  pushToAltosa: z.boolean().optional().default(true),
  onlySku: z.string().trim().min(1).max(80).optional(),
  matchByName: z.boolean().optional().default(false),
  prune: z.boolean().optional().default(false),
  createMissing: z.boolean().optional().default(false),
});

export const contificoSearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(120),
  limit: z.coerce.number().int().min(1).max(20).default(8),
});

export const contificoImportBodySchema = z
  .object({
    contificoId: z.string().trim().min(1).max(80).optional(),
    sku: z.string().trim().min(1).max(80).optional(),
  })
  .refine((data) => Boolean(data.contificoId || data.sku), {
    message: 'Indica contificoId o sku.',
  });

export const contificoProductIdParamSchema = z.object({
  id: z.string().trim().min(1).max(80),
});

export const contificoProductsQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type ContificoSyncBody = z.infer<typeof contificoSyncBodySchema>;
export type ContificoProductsQuery = z.infer<typeof contificoProductsQuerySchema>;
export type ContificoSearchQuery = z.infer<typeof contificoSearchQuerySchema>;
export type ContificoImportBody = z.infer<typeof contificoImportBodySchema>;
