import { z } from 'zod';

const validationEnum = z.enum(['APROBADO', 'PENDIENTE', 'REQUIERE_CORRECCION']);
const syncStatusEnum = z.enum(['SINCRONIZADO', 'SIN_SINCRONIZAR']);

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().min(1).optional(),
  validation: validationEnum.optional(),
  syncStatus: syncStatusEnum.optional(),
  line: z.string().trim().min(1).optional(),
});

export const productIdParamSchema = z.object({
  id: z.string().min(1),
});

export const createProductSchema = z.object({
  sku: z.string().trim().min(2, 'El SKU es requerido').max(60),
  name: z.string().trim().min(2, 'El nombre es requerido').max(200),
  line: z.string().trim().max(120).optional().or(z.literal('')),
  category: z.string().trim().max(120).optional().or(z.literal('')),
  subcategory: z.string().trim().max(160).optional().or(z.literal('')),
  description: z.string().trim().max(4000).optional().or(z.literal('')),
  commercialDescription: z.string().trim().max(4000).optional().or(z.literal('')),
  keywords: z.array(z.string().trim().min(1)).max(50).optional(),
  color: z.string().trim().max(80).optional().or(z.literal('')),
  price: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0').nullable().optional(),
  validation: validationEnum.optional(),
  syncStatus: syncStatusEnum.optional(),
  isActive: z.boolean().optional(),
  thumbnailUrl: z.string().trim().url().optional().or(z.literal('')),
  sourceUrl: z.string().trim().url().optional().or(z.literal('')),
  variantCount: z.coerce.number().int().min(0).optional(),
  variantLabel: z.string().trim().max(120).optional().or(z.literal('')),
});

export const updateProductSchema = createProductSchema.partial();
