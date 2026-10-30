'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PackageOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatCurrency } from '@/lib/formatters';
import type { Product, VariantDto } from '../types/product.types';
import { ContificoMappingDialog } from './detail/sections/ContificoMappingDialog';
import { MetaMappingDialog } from './detail/sections/MetaMappingDialog';

interface ProductVariantsPanelProps {
  product: Product;
  onEditVariant: (variantId: string) => void;
}

export function ProductVariantsPanel({ product, onEditVariant }: ProductVariantsPanelProps) {
  const variants = product.variantDetails;
  const [contificoVariant, setContificoVariant] = useState<VariantDto | null>(null);
  const [metaVariant, setMetaVariant] = useState<VariantDto | null>(null);

  return (
    <div className="border-l-2 border-l-blue-500/60 px-6 py-4">
      {/* Header del panel */}
      <div className="mb-4 flex items-center justify-between gap-3">
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
        <ul className="flex flex-col">
          {variants.map((variant, index) => (
            <li
              key={variant.id}
              className={`grid grid-cols-[auto_1.5fr_1fr_1fr_auto_auto] items-center gap-4 py-3 ${
                index !== variants.length - 1 ? 'border-b border-gray-100 dark:border-slate-800/60' : ''
              }`}
            >
              {/* 1. Imagen y SKU */}
              <div className="flex items-center gap-3">
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800 flex items-center justify-center">
                  {variant.imageUrl ? (
                    <Image
                      src={variant.imageUrl}
                      alt={`Imagen de ${variant.name}`}
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-gray-300 dark:bg-slate-600" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onEditVariant(variant.id)}
                  title="Editar variante"
                  className="text-xs font-medium text-blue-600 underline-offset-2 whitespace-nowrap hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {variant.sku || 'SKU hijo'}
                </button>
              </div>

              {/* 2. Nombre / Color */}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-slate-100">
                  {variant.name}
                </p>
              </div>

              {/* 3. Precio */}
              <div className="text-sm font-medium text-gray-900 dark:text-slate-100">
                {variant.price === null ? (
                  <span className="text-xs font-normal text-gray-400 dark:text-slate-500">—</span>
                ) : (
                  formatCurrency(variant.price)
                )}
              </div>

              {/* 4. Estado (Válido / Falta precio) */}
              <div className="flex justify-start">
                {variant.isActive && variant.price !== null ? (
                  <StatusBadge variant="approved" className="bg-blue-50 text-blue-700 border-blue-200">
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                      Válido
                    </span>
                  </StatusBadge>
                ) : (
                  <StatusBadge variant="warning" className="bg-orange-50 text-orange-700 border-orange-200">
                    <span className="flex flex-col items-start leading-tight">
                      <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Falta precio</span>
                      <span className="text-xs font-medium">Contifico</span>
                    </span>
                  </StatusBadge>
                )}
              </div>

              {/* 5. Integraciones (Contifico / Meta) */}
              <div className="flex items-center gap-2">
                {variant.contificoId ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setContificoVariant(variant)}
                    className="h-8 border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300 gap-1 px-2.5"
                  >
                    <span className="text-blue-500">✓</span> Contifico
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setContificoVariant(variant)}
                    className="h-8 border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 gap-1 px-2.5"
                  >
                    + Contifico
                  </Button>
                )}

                {variant.metaRetailerId ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMetaVariant(variant)}
                    className="h-8 border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 gap-1 px-2.5"
                  >
                    <span className="text-gray-400">✓</span> Meta
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMetaVariant(variant)}
                    className="h-8 border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 gap-1 px-2.5"
                  >
                    + Meta
                  </Button>
                )}
              </div>

              {/* 6. Stock */}
              <div className="text-sm text-gray-500 dark:text-slate-400 whitespace-nowrap min-w-[80px]">
                Stock: <span className="font-medium text-gray-700 dark:text-slate-200">14 uds</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {contificoVariant && (
        <ContificoMappingDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setContificoVariant(null);
            }
          }}
          productId={product.id}
          variantId={contificoVariant.id}
          variantName={contificoVariant.name}
          sku={contificoVariant.sku}
          selectedContificoSku={contificoVariant.contificoSku ?? null}
        />
      )}

      {metaVariant && (
        <MetaMappingDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setMetaVariant(null);
            }
          }}
          productId={product.id}
          variantId={metaVariant.id}
          variantName={metaVariant.name}
          sku={metaVariant.sku}
          selectedRetailerId={metaVariant.metaRetailerId ?? null}
        />
      )}
    </div>
  );
}