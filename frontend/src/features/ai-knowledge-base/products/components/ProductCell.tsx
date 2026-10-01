import { Package } from 'lucide-react';
import type { Product } from '../types/product.types';

export function ProductCell({ product }: { product: Product }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-gray-200 dark:border-slate-800 bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500">
        <Package className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-slate-100">{product.name}</p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">{product.sku}</p>
        <p className="mt-0.5 text-xs text-blue-600">{product.line}</p>
      </div>
    </div>
  );
}
