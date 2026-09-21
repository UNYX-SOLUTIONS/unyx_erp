import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es requerido').max(160),
  sku: z
    .string()
    .trim()
    .min(2, 'El SKU es requerido')
    .max(40)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Solo letras, números, punto y guion'),
  barcode: z.string().trim().max(64).optional().or(z.literal('')),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  salePrice: z.coerce.number().min(0, 'Debe ser mayor o igual a 0'),
  costPrice: z.coerce.number().min(0, 'Debe ser mayor o igual a 0'),
  minStock: z.coerce.number().min(0).optional(),
  maxStock: z.coerce.number().min(0).optional(),
  categoryId: z.string().optional(),
  unitId: z.string().optional(),
  trackStock: z.boolean().optional(),
});

export type CreateProductFormValues = z.infer<typeof createProductSchema>;
