'use client';

import { useState } from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatCurrency } from '@/lib/formatters';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Product, VariantDto } from '../types/product.types';
import { ContificoMappingDialog } from './detail/sections/ContificoMappingDialog';
import { MetaMappingDialog } from './detail/sections/MetaMappingDialog';

interface ProductVariantsPanelProps {
  product: Product;
  onEditVariant: (variantId: string) => void;
}

function VariantStatus({ variant }: { variant: VariantDto }) {
  if (!variant.isActive) {
    return (
      <StatusBadge variant="neutral" dot>
        Inactiva
      </StatusBadge>
    );
  }

  if (!variant.contificoId) {
    return (
      <StatusBadge
        variant="warning"
        className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/60"
      >
        <span className="flex flex-col items-start leading-tight">
          <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
            Falta precio
          </span>
          <span className="text-xs font-medium">Contifico</span>
        </span>
      </StatusBadge>
    );
  }

  if (variant.price === null || variant.price <= 0) {
    return (
      <StatusBadge variant="warning" dot>
        Falta precio
      </StatusBadge>
    );
  }

  return (
    <StatusBadge variant="info" dot>
      Válido
    </StatusBadge>
  );
}

export function ProductVariantsPanel({ product, onEditVariant }: ProductVariantsPanelProps) {
  const variants = product.variantDetails;
  const [contificoVariant, setContificoVariant] = useState<VariantDto | null>(null);
  const [metaVariant, setMetaVariant] = useState<VariantDto | null>(null);

  return (
    <div className="border-l-2 border-l-blue-500/60 bg-white dark:bg-slate-900">
      {variants.length === 0 ? (
        <div className="flex items-center gap-2 px-6 py-5 text-sm text-gray-500 dark:text-slate-400">
          <PackageOpen className="h-4 w-4" />
          Este producto todavía no tiene variantes registradas.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {variants.map((variant, index) => (
              <div
                key={variant.id}
                className={cn(
                  'grid grid-cols-[minmax(120px,0.9fr)_minmax(170px,1.4fr)_78px_92px_120px_auto_92px_58px] items-center gap-3 px-4 py-3',
                  index % 2 === 0
                    ? 'bg-slate-50/80 dark:bg-slate-900/50'
                    : 'bg-white dark:bg-slate-900',
                  'border-b border-gray-100 dark:border-slate-800/60'
                )}
              >
                {/* Imagen de la variante */}
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-gray-100 dark:bg-slate-800">
                  {variant.imageUrl ? (
                    <Image
                      src={variant.imageUrl}
                      alt={variant.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <PackageOpen className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                  )}
                </div>
                {/* Nombre y SKU de la Variante*/}
                <div className="flex min-w-0 items-center gap-2 flex-col">
                  <p className="min-w-0 text-sm font-semibold leading-tight text-gray-900 dark:text-slate-100">
                    {variant.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => onEditVariant(variant.id)}
                    title="Editar variante"
                    className="break-all text-left text-xs font-medium text-gray-600 underline-offset-2 hover:text-blue-700 hover:underline dark:text-slate-300 dark:hover:text-blue-400"
                  >
                    {variant.sku || 'Sin SKU'}
                  </button>
                </div>

                {/* Precio */}
                <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                  {variant.price === null ? (
                    <span className="text-xs font-normal text-gray-400 dark:text-slate-500">—</span>
                  ) : (
                    formatCurrency(variant.price)
                  )}
                </span>

                {/* Estado */}
                <div className="flex justify-start">
                  <VariantStatus variant={variant} />
                </div>

                {/* Integraciones */}
                <div className="flex items-center gap-2">
                  {variant.contificoId ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setContificoVariant(variant)}
                      className="h-7 gap-1 border-blue-200 bg-blue-50/60 px-2 text-xs text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                    >
                      <span className="text-blue-500">✓</span> Contifico
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setContificoVariant(variant)}
                      className="h-7 gap-1 border-gray-200 px-2 text-xs text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300"
                    >
                      + Contifico
                    </Button>
                  )}

                  {variant.metaRetailerId ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMetaVariant(variant)}
                      className="h-7 gap-1 border-gray-200 px-2 text-xs text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300"
                    >
                      <span className="text-gray-400">✓</span> Meta
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMetaVariant(variant)}
                      className="h-7 gap-1 border-gray-200 px-2 text-xs text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300"
                    >
                      + Meta
                    </Button>
                  )}
                </div>

                {/* Stock */}
                <span className="whitespace-nowrap text-xs text-gray-500 dark:text-slate-400">
                  Stock:{' '}
                  <span className="font-medium text-gray-700 dark:text-slate-200">
                    {variant.stock} uds
                  </span>
                </span>

                {/* Editar */}
                <button
                  type="button"
                  onClick={() => onEditVariant(variant.id)}
                  className="justify-self-end text-sm font-medium text-blue-600 transition-colors hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Editar
                </button>
              </div>
            ))}
          </div>
        </div>
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
