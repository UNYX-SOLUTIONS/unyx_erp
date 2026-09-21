export interface Product {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  costPrice: number;
  salePrice: number;
  minStock: number;
  maxStock: number;
  imageUrl: string | null;
  isActive: boolean;
  isService: boolean;
  trackStock: boolean;
  categoryId: string | null;
  brandId: string | null;
  unitId: string | null;
  taxId: string | null;
  createdAt: string;
  updatedAt: string;
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
