export type KbValidationStatus = 'APROBADO' | 'PENDIENTE' | 'REQUIERE_CORRECCION' | 'SIN_PRECIO';

export type KbSyncStatus = 'SINCRONIZADO' | 'SIN_SINCRONIZAR';

export type ProductStatus = 'approved' | 'pending' | 'needsCorrection' | 'noPrice';

export type ProductSyncStatus = 'synced' | 'notSynced';

export type ProductLine = string;

export type ProductDetailTab = 'general' | 'variants' | 'specifications' | 'warranty';

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
  variantDetails: VariantDto[];
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
  kommoTemplateId?: string | null;
  kommoTemplate?: KommoTemplateDto | null;
  metaRetailerId?: string | null;
  metaMappingLocked?: boolean;
  contificoId?: string | null;
  contificoSku?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MetaCatalogItem {
  retailerId: string;
  name: string;
  imageUrl: string | null;
  price: string | null;
  availability: string | null;
  visibility: string | null;
  url: string | null;
}

export interface KommoTemplateDto {
  id: string;
  kommoId: number;
  name: string;
  type: string;
  content: string | null;
  isActive?: boolean;
  updatedAt?: string;
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
  variants?: VariantDto[];
  kommoTemplateId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDetailDto extends ProductDto {
  variants: VariantDto[];
  kommoTemplate?: KommoTemplateDto | null;
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
  kommoTemplateId?: string | null;
}

export type UpdateVariantPayload = Partial<CreateVariantPayload> & {
  metaRetailerId?: string | null;
  metaMappingLocked?: boolean;
  contificoId?: string | null;
  contificoSku?: string | null;
};

export type ExternalSource = 'meta' | 'contifico';

export interface ExternalPendingItem {
  source: ExternalSource;
  sources: ExternalSource[];
  externalId: string;
  sku: string | null;
  metaRetailerId: string | null;
  contificoId: string | null;
  contificoSku: string | null;
  name: string;
  price: number | null;
  imageUrl: string | null;
  url: string | null;
  stock: number | null;
  category: string | null;
  barcode: string | null;
  availability: string | null;
}

export interface ExternalPendingResult {
  items: ExternalPendingItem[];
  counts: { meta: number; contifico: number; total: number };
  warnings: string[];
}

export interface ExternalImportResult {
  productsCreated: number;
  productsReused: number;
  variantsCreated: number;
  variantsSkipped: number;
  created: Array<{
    productId: number;
    productName: string;
    variantId: number;
    sku: string;
  }>;
  errors: string[];
}

export interface ContificoCatalogItem {
  externalId: string;
  sku: string;
  name: string;
  category: string | null;
  price: number | null;
  stock: number;
  barcode: string | null;
  isActive: boolean;
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
  validation?: KbValidationStatus;
  syncStatus?: KbSyncStatus;
  isActive?: boolean;
  thumbnailUrl?: string;
  sourceUrl?: string;
  variants?: CreateVariantPayload[];
}

export type UpdateProductPayload = Omit<Partial<CreateProductPayload>, 'variants'>;
