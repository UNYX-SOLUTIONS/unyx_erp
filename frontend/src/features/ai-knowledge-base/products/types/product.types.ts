export type KbValidationStatus = 'APROBADO' | 'PENDIENTE' | 'REQUIERE_CORRECCION';

export type KbSyncStatus = 'SINCRONIZADO' | 'SIN_SINCRONIZAR';

export type ProductStatus = 'approved' | 'pending' | 'needsCorrection' | 'noPrice';

export type ProductSyncStatus = 'synced' | 'notSynced';

export type ProductLine = string;

export interface ProductVariantInfo {
  count: number;
  label?: string;
}

export interface ProductLastUpdate {
  label: string;
  author?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  line: string;
  variants: ProductVariantInfo;
  price: number | null;
  priceFrom: boolean;
  status: ProductStatus;
  syncStatus: ProductSyncStatus;
  lastUpdate: ProductLastUpdate;
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

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  validation?: KbValidationStatus;
  syncStatus?: KbSyncStatus;
  line?: string;
}

export interface CreateProductPayload {
  sku: string;
  name: string;
  line?: string;
  category?: string;
  subcategory?: string;
  description?: string;
  commercialDescription?: string;
  keywords?: string[];
  color?: string;
  price?: number | null;
  validation?: KbValidationStatus;
  syncStatus?: KbSyncStatus;
  isActive?: boolean;
  thumbnailUrl?: string;
  sourceUrl?: string;
}

export type UpdateProductPayload = Partial<CreateProductPayload>;
