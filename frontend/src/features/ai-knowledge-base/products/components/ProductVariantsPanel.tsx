'use client';

import Image from 'next/image';
import { ImageIcon, PackageOpen, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatCurrency } from '@/lib/formatters';
import type { Product } from '../types/product.types';

interface ProductVariantsPanelProps {
  product: Product;
  onEditVariant: (variantId: string) => void;
}

export function ProductVariantsPanel({ product, onEditVariant }: ProductVariantsPanelProps) {
  const variants = product.variantDetails;

  return (
    <div className="border-l-2 border-l-blue-500/60 px-6 py-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
          Variantes del producto
        </p>
        <span className="text-xs text-gray-500 dark:text-slate-400">
          {variants.length} {variants.length === 1 ? 'variante' : 'variantes'}
        </span>
      </div>

      {variants.length === 0 ? (
        <div className="flex items-center gap-2 rounded-md border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500 dark:border-slate-700 dark:text-slate-400">
          <PackageOpen className="h-4 w-4" />
          Este producto todavía no tiene variantes registradas.
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-slate-800">
          {variants.map((variant) => (
            <li
              key={variant.id}
              className="flex flex-wrap items-center gap-3 py-3 first:pt-1 last:pb-1"
            >
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                {variant.imageUrl ? (
                  <Image
                    src={variant.imageUrl}
                    alt={`Imagen de ${variant.name}`}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                ) : (
                  <ImageIcon className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-gray-300 dark:text-slate-600" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-slate-100">
                  {variant.name}
                </p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">{variant.sku}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {variant.metaRetailerId && (
                  <StatusBadge variant="info">
                    <span title={variant.metaRetailerId}>Meta</span>
                  </StatusBadge>
                )}
                {variant.contificoId && (
                  <StatusBadge variant="info">
                    <span title={variant.contificoId}>Contífico</span>
                  </StatusBadge>
                )}
                <StatusBadge variant={variant.isActive ? 'approved' : 'neutral'} dot>
                  {variant.isActive ? 'Activa' : 'Inactiva'}
                </StatusBadge>
                <span className="w-24 text-right text-sm font-medium text-gray-900 dark:text-slate-100">
                  {variant.price === null ? (
                    <span className="text-xs font-normal text-gray-400 dark:text-slate-500">
                      Sin precio
                    </span>
                  ) : (
                    formatCurrency(variant.price)
                  )}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onEditVariant(variant.id)}
                  className="gap-1.5 border-gray-300 text-gray-700 dark:border-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar variante
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
