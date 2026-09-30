import type { KbSyncStatus, KbValidationStatus, Prisma } from '@prisma/client';
import type { z } from 'zod';
import type {
  createProductSchema,
  createVariantSchema,
  listProductsQuerySchema,
  updateProductSchema,
  updateVariantSchema,
} from './products-schema';
import type { PaginationMeta } from '../../utils/pagination';

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;

export interface ProductListFilters {
  page?: number;
  limit?: number;
  search?: string;
  validation?: KbValidationStatus;
  syncStatus?: KbSyncStatus;
  line?: string;
}

export interface VariantDto {
  id: string;
  productId: string;
  sku: string;
  name: string;
  color: string | null;
  colorHex: string | null;
  price: number | null;
  stock: number;
  imageUrl: string | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  especificaciones: Prisma.JsonValue | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDto {
  id: string;
  sku: string;
  name: string;
  line: string | null;
  category: string | null;
  subcategory: string | null;
  description: string | null;
  commercialDescription: string | null;
  keywords: string[];
  thumbnailUrl: string | null;
  sourceUrl: string | null;
  validation: KbValidationStatus;
  syncStatus: KbSyncStatus;
  isActive: boolean;
  variantCount: number;
  price: number | null;
  priceFrom: boolean;
  primaryColor: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDetailDto extends ProductDto {
  variants: VariantDto[];
}

export interface ProductListResult {
  items: ProductDto[];
  meta: PaginationMeta;
}
