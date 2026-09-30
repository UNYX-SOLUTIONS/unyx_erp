import { Package } from 'lucide-react';
import type { Product } from '../types/product.types';

export function ProductCell({ product }: { product: Product }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-100 text-gray-400">
        <Package className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900">{product.name}</p>
        <p className="mt-0.5 text-xs text-gray-500">{product.sku}</p>
        <p className="mt-0.5 text-xs text-blue-600">{product.line}</p>
      </div>
    </div>
  );
}
