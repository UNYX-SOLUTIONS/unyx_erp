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

const optionalUrl = z.string().trim().url().max(500).optional().or(z.literal(''));

export const altosaVariantBodySchema = z.object({
  sku: z.string().trim().max(80).optional(),
  color: z.string().trim().max(80).optional(),
  descripcion: z.string().trim().max(2000).optional(),
  precioUsd: z.coerce.number().min(0).max(1_000_000).optional(),
  material: z.string().trim().max(200).optional(),
  tapizado: z.string().trim().max(200).optional(),
  estructura: z.string().trim().max(200).optional(),
  mecanismo: z.string().trim().max(200).optional(),
  proteccionUv: z.string().trim().max(200).optional(),
  resistenciaIntemperie: z.string().trim().max(200).optional(),
  apilable: z.string().trim().max(100).optional(),
  brazos: z.string().trim().max(200).optional(),
  soporteLumbar: z.string().trim().max(200).optional(),
  cabecera: z.string().trim().max(200).optional(),
  usoRecomendado: z.string().trim().max(500).optional(),
  especificacionesAdicionales: z.string().trim().max(2000).optional(),
  imagenUrl: optionalUrl,
  urlProducto: optionalUrl,
  anchoTotalCm: z.coerce.number().min(0).max(100000).optional(),
  profundidadAsientoCm: z.coerce.number().min(0).max(100000).optional(),
  alturaTotalCm: z.string().trim().max(50).optional(),
  alturaAsientoCm: z.string().trim().max(50).optional(),
  anchoAsientoCm: z.coerce.number().min(0).max(100000).optional(),
  pesoKg: z.coerce.number().min(0).max(100000).optional(),
  garantiaId: z.coerce.number().int().positive().optional(),
  catalogoId: z.coerce.number().int().positive().optional(),
  estadoId: z.coerce.number().int().positive().max(32767).optional(),
  kommoTemplateId: z.string().trim().min(1).max(80).nullable().optional(),
  metaRetailerId: z.string().trim().max(100).nullable().optional(),
  metaMappingLocked: z.boolean().optional(),
});

export const altosaUpdateVariantBodySchema = altosaVariantBodySchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const altosaMetaCatalogSearchQuerySchema = z.object({
  q: z.string().trim().min(2).max(80),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const altosaMetaCatalogItemQuerySchema = z.object({
  retailerId: z.string().trim().min(1).max(100),
});

export const altosaCreateProductBodySchema = z.object({
  sku: z.string().trim().min(1).max(80).optional(),
  nombre: z.string().trim().min(1).max(200),
  line: z.string().trim().max(120).optional(),
  category: z.string().trim().max(120).optional(),
  subcategory: z.string().trim().max(160).optional(),
  descripcion: z.string().trim().max(2000).optional(),
  usoRecomendado: z.string().trim().max(500).optional(),
  subcategoryId: z.coerce.number().int().positive().optional(),
  estadoId: z.coerce.number().int().positive().max(32767).optional(),
  kommoTemplateId: z.string().trim().min(1).max(80).nullable().optional(),
  variantes: z.array(altosaVariantBodySchema).max(100).optional(),
});

export const altosaUpdateProductBodySchema = z.object({
  sku: z.string().trim().min(1).max(80).optional(),
  nombre: z.string().trim().min(1).max(200).optional(),
  line: z.string().trim().max(120).optional(),
  category: z.string().trim().max(120).optional(),
  subcategory: z.string().trim().max(160).optional(),
  descripcion: z.string().trim().max(2000).nullable().optional(),
  usoRecomendado: z.string().trim().max(500).nullable().optional(),
  subcategoryId: z.coerce.number().int().positive().optional(),
  estadoId: z.coerce.number().int().positive().max(32767).optional(),
  isActive: z.boolean().optional(),
  kommoTemplateId: z.string().trim().min(1).max(80).nullable().optional(),
});

export const altosaVariantProductQuerySchema = z.object({
  productId: z.coerce.number().int().positive().optional(),
});

export const altosaSyncVariantSchema = z.object({
  sku: z.string().trim().min(1).max(80),
  color: z.string().trim().max(80).nullable().optional(),
  descripcion: z.string().trim().max(2000).nullable().optional(),
  precioUsd: z.number().min(0).max(1_000_000).nullable().optional(),
  imagenUrl: optionalUrl.nullable().optional(),
  especificaciones: z.record(z.unknown()).nullable().optional(),
});

export const altosaSyncProductSchema = z.object({
  codigo: z.string().trim().min(1).max(80),
  nombre: z.string().trim().min(1).max(300),
  descripcion: z.string().trim().max(2000).nullable().optional(),
  usoRecomendado: z.string().trim().max(500).nullable().optional(),
  categoria: z.string().trim().min(1).max(300),
  subcategoria: z.string().trim().max(300).nullable().optional(),
  estado: z.enum(['A', 'I']).default('A'),
  updateTaxonomy: z.boolean().optional().default(false),
  variantes: z.array(altosaSyncVariantSchema).max(100).default([]),
});

export const altosaSyncProductsBodySchema = z.object({
  items: z.array(altosaSyncProductSchema).min(1).max(100),
});

export type AltosaSyncVariant = z.infer<typeof altosaSyncVariantSchema>;
export type AltosaSyncProduct = z.infer<typeof altosaSyncProductSchema>;

export type AltosaVariantBody = z.infer<typeof altosaVariantBodySchema>;
export type AltosaUpdateVariantBody = z.infer<typeof altosaUpdateVariantBodySchema>;
export type AltosaCreateProductBody = z.infer<typeof altosaCreateProductBodySchema>;
export type AltosaUpdateProductBody = z.infer<typeof altosaUpdateProductBodySchema>;

export type AltosaProductsQuery = z.infer<typeof altosaProductsQuerySchema>;
export type AltosaDocumentsQuery = z.infer<typeof altosaDocumentsQuerySchema>;
export type AltosaActiveQuery = z.infer<typeof altosaActiveQuerySchema>;
export type AltosaMetaCatalogSearchQuery = z.infer<typeof altosaMetaCatalogSearchQuerySchema>;
export type AltosaMetaCatalogItemQuery = z.infer<typeof altosaMetaCatalogItemQuerySchema>;
