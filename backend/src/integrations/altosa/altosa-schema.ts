import { z } from 'zod';

export const altosaIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const altosaSkuParamSchema = z.object({
  sku: z.string().trim().min(1).max(120),
});

export const altosaProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  subcategoryId: z.coerce.number().int().positive().optional(),
  withVariants: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

export const altosaDocumentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().trim().max(120).optional(),
  source: z.string().trim().max(80).optional(),
  includeContent: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

export const altosaActiveQuerySchema = z.object({
  active: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
});

export type AltosaProductsQuery = z.infer<typeof altosaProductsQuerySchema>;
export type AltosaDocumentsQuery = z.infer<typeof altosaDocumentsQuerySchema>;
export type AltosaActiveQuery = z.infer<typeof altosaActiveQuerySchema>;
