// frontend/src/features/orders/types/product.types.ts

export type ProductType = 'PRODUCT' | 'SERVICE';

export type StockStatus = 'AVAILABLE' | 'BETWEEN_WAREHOUSES' | 'LOW_STOCK';

export interface ProductVariant {
  sku: string;
  name: string;
  price: number;
  gye: number;
  uio: number;
  stockStatus: StockStatus;
  stockLabel?: string;
}

export interface ProductCatalogItem {
  id: string;
  sku: string;
  name: string;
  line: string;
  type: ProductType;
  variants: ProductVariant[];
}
