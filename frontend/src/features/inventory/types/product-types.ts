export interface Product {
  id: string;
  sku: string;
  name: string;
  line: string | null;
  category: string | null;
  price: number | null;
  isActive: boolean;
  createdAt: string;
}

export interface ProductStock {
  productId: string;
  quantity: number;
  reserved: number;
}

export interface CreateProductInput {
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  salePrice: number;
  costPrice: number;
  minStock?: number;
  maxStock?: number;
  categoryId?: string;
  unitId?: string;
  trackStock?: boolean;
}

export type UpdateProductInput = Partial<CreateProductInput>;
