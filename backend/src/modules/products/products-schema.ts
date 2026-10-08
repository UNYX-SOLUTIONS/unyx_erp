import { z } from 'zod';

const validationEnum = z.enum(['APROBADO', 'PENDIENTE', 'REQUIERE_CORRECCION', 'SIN_PRECIO']);
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

export const variantParamsSchema = z.object({
  id: z.string().min(1),
  variantId: z.string().min(1),
});

export const variantBodySchema = z.object({
  sku: z.string().trim().min(2).max(80).optional(),
  name: z.string().trim().min(1, 'El nombre de la variante es requerido').max(120),
  color: z.string().trim().max(80).optional().or(z.literal('')),
  colorHex: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Color hex inválido')
    .optional()
    .or(z.literal('')),
  price: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0').nullable().optional(),
  stock: z.coerce.number().int().min(0).optional(),
  imageUrl: z.string().trim().url().optional().or(z.literal('')),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
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
  validation: validationEnum.optional(),
  syncStatus: syncStatusEnum.optional(),
  isActive: z.boolean().optional(),
  thumbnailUrl: z.string().trim().url().optional().or(z.literal('')),
  sourceUrl: z.string().trim().url().optional().or(z.literal('')),
  variants: z.array(variantBodySchema).max(200).optional(),
});

export const updateProductSchema = createProductSchema.omit({ variants: true }).partial();

export const createVariantSchema = variantBodySchema;

export const updateVariantSchema = variantBodySchema.partial();
