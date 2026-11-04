import Image from 'next/image';
import { ChevronRight, Package } from 'lucide-react';
import type { Product } from '../types/product.types';

export function ProductCell({ product }: { product: Product }) {
  return (
    <div className="flex items-center gap-3">
      <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 group-data-[expanded=true]:rotate-90 dark:text-slate-500" />
      {product.thumbnailUrl ? (
        <Image
          src={product.thumbnailUrl}
          alt={product.name}
          width={48}
          height={48}
          sizes="48px"
          className="h-12 w-12 shrink-0 rounded-md border border-gray-200 object-cover dark:border-slate-800"
        />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-gray-200 dark:border-slate-800 bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500">
          <Package className="h-5 w-5" />
        </span>
      )}
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 dark:text-slate-100">
            {product.name}
          </p>
          {product.isActive === false ? (
            <span className="shrink-0 rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              Inactivo
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">{product.sku}</p>
        <p className="mt-0.5 text-xs text-blue-600">{product.line}</p>
      </div>
    </div>
  );
}
