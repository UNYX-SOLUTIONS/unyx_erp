export type ProductLine =
  | 'Sillines'
  | 'Mesas Auxiliares'
  | 'Sillas de Espera'
  | 'Sillas Ejecutivas'
  | 'Sillas Operativas'
  | 'Sillas Lounge';

export type ProductStatus = 'approved' | 'pending' | 'needsCorrection' | 'noPrice';

export type ProductSyncStatus = 'synced' | 'notSynced';

export interface ProductVariantInfo {
  count: number;
  label?: string;
}

export interface ProductLastUpdate {
  label: string;
  author: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  line: ProductLine;
  variants: ProductVariantInfo;
  price: number | null;
  priceFrom: boolean;
  status: ProductStatus;
  syncStatus: ProductSyncStatus;
  lastUpdate: ProductLastUpdate;
}
