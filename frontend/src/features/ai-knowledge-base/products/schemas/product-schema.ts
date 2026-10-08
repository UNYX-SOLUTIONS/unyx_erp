import { z } from 'zod';

export const generalSchema = z.object({
  name: z.string().trim().min(2, 'El nombre del producto es requerido'),
  sku: z.string().trim().min(2, 'El SKU es requerido'),
  line: z.string().min(1, 'La línea es requerida'),
  category: z.string().trim().min(2, 'La categoría es requerida'),
  subcategory: z.string().trim().optional().or(z.literal('')),
  isActive: z.boolean(),
  commercialDescription: z.string().trim().max(1200).optional().or(z.literal('')),
  keywords: z.array(z.string()),
});

export const variantSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, 'El nombre de la variante es requerido'),
  sku: z.string().trim().min(1, 'El SKU de la variante es requerido'),
  color: z.string().optional().or(z.literal('')),
  colorLabel: z.string().trim().optional().or(z.literal('')),
  price: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
  description: z.string().trim().optional().or(z.literal('')),
  isActive: z.boolean(),
});

export const variantsSchema = z.object({
  variants: z.array(variantSchema),
});

export const productDetailSchema = z.object({
  general: generalSchema,
  variants: variantsSchema,
});

export type GeneralFormValues = z.infer<typeof generalSchema>;
export type VariantFormValues = z.infer<typeof variantSchema>;
export type VariantsFormValues = z.infer<typeof variantsSchema>;
export type ProductDetailFormValues = z.infer<typeof productDetailSchema>;
