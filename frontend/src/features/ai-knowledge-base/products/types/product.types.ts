export type KbValidationStatus = 'APROBADO' | 'PENDIENTE' | 'REQUIERE_CORRECCION' | 'SIN_PRECIO';

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

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  validation?: KbValidationStatus;
  syncStatus?: KbSyncStatus;
  line?: string;
}

export interface CreateVariantPayload {
  sku?: string;
  name: string;
  color?: string;
  colorHex?: string;
  price?: number | null;
  stock?: number;
  imageUrl?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export type UpdateVariantPayload = Partial<CreateVariantPayload>;

export interface CreateProductPayload {
  sku: string;
  name: string;
  line?: string;
  category?: string;
  subcategory?: string;
  description?: string;
  commercialDescription?: string;
  keywords?: string[];
  validation?: KbValidationStatus;
  syncStatus?: KbSyncStatus;
  isActive?: boolean;
  thumbnailUrl?: string;
  sourceUrl?: string;
  variants?: CreateVariantPayload[];
}

export type UpdateProductPayload = Omit<Partial<CreateProductPayload>, 'variants'>;
