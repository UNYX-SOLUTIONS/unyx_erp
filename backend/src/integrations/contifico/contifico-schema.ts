import { z } from 'zod';

export const contificoSyncBodySchema = z.object({
  dryRun: z.boolean().optional().default(false),
  pushToAltosa: z.boolean().optional().default(true),
  onlySku: z.string().trim().min(1).max(80).optional(),
  matchByName: z.boolean().optional().default(false),
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
