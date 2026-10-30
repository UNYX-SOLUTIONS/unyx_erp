'use client';

import { useState } from 'react';
import { Package, PackageOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/formatters';
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
        className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
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
    <>
      {variants.length === 0 ? (
        <TableRow className="hover:bg-transparent">
          <TableCell
            colSpan={7}
            className="border-l-2 border-l-blue-500/60 px-4 py-4"
          >
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
              <PackageOpen className="h-4 w-4" />
              Este producto todavía no tiene variantes registradas.
            </div>
          </TableCell>
        </TableRow>
      ) : (
        variants.map((variant, index) => (
          <TableRow
            key={variant.id}
            className={cn(
              'border-b border-gray-100 hover:bg-transparent dark:border-slate-800/60',
              index % 2 === 0
                ? 'bg-slate-50/80 dark:bg-slate-900/50'
                : 'bg-white dark:bg-slate-900'
            )}
          >
            {/* Variante: ocupa Producto + Variantes para alinear el precio */}
            <TableCell
              colSpan={2}
              className="border-l-2 border-l-blue-500/60 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
                  <Package className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold leading-tight text-gray-900 dark:text-slate-100">
                    {variant.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => onEditVariant(variant.id)}
                    title="Editar variante"
                    className="mt-0.5 break-all text-left text-xs font-medium text-gray-500 underline-offset-2 hover:text-blue-700 hover:underline dark:text-slate-400 dark:hover:text-blue-400"
                  >
                    {variant.sku || 'Sin SKU'}
                  </button>
                </div>
              </div>
            </TableCell>

            {/* Precio: misma columna que la fila principal */}
            <TableCell className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-slate-100">
              {variant.price === null ? (
                <span className="text-xs font-normal text-gray-400 dark:text-slate-500">
                  —
                </span>
              ) : (
                formatCurrency(variant.price)
              )}
            </TableCell>

            {/* Validación */}
            <TableCell className="px-4 py-3">
              <VariantStatus variant={variant} />
            </TableCell>

            {/* Sincronización */}
            <TableCell className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-1.5">
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
            </TableCell>

            {/* Stock */}
            <TableCell className="whitespace-nowrap px-4 py-3 text-xs text-gray-500 dark:text-slate-400">
              Stock:{' '}
              <span className="font-medium text-gray-700 dark:text-slate-200">
                {variant.stock} uds
              </span>
            </TableCell>

            {/* Acción */}
            <TableCell className="px-4 py-3 text-right">
              <button
                type="button"
                onClick={() => onEditVariant(variant.id)}
                className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Editar
              </button>
            </TableCell>
          </TableRow>
        ))
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
    </>
  );
}
