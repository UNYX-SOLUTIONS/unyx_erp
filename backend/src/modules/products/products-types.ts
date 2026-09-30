import type { KbSyncStatus, KbValidationStatus } from '@prisma/client';
import type { z } from 'zod';
import type { createProductSchema, listProductsQuerySchema, updateProductSchema } from './products-schema';
import type { PaginationMeta } from '../../utils/pagination';

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;

export interface ProductListFilters {
  page?: number;
  limit?: number;
  search?: string;
  validation?: KbValidationStatus;
  syncStatus?: KbSyncStatus;
  line?: string;
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
  color: string | null;
  price: number | null;
  validation: KbValidationStatus;
  syncStatus: KbSyncStatus;
  isActive: boolean;
  thumbnailUrl: string | null;
  sourceUrl: string | null;
  variantCount: number;
  variantLabel: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResult {
  items: ProductDto[];
  meta: PaginationMeta;
}
