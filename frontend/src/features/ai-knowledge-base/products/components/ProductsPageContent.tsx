'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProductDetailStore } from '../stores/product-detail-store';
import { ProductDetailSheet } from './detail/ProductDetailSheet';
import { ExternalSyncButton } from './ExternalSyncButton';
import { ProductsSummaryIndicators } from './ProductsSummaryIndicators';
import { ProductsTable } from './ProductsTable';

export function ProductsPageContent() {
  const openCreate = useProductDetailStore((state) => state.openCreate);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-slate-100">
            Productos
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Administra la información de productos y variantes disponible para el asistente
            comercial.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <ProductsSummaryIndicators />
          <ExternalSyncButton />
          <Button
            onClick={openCreate}
            className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Nuevo producto
          </Button>
        </div>
      </div>

      <ProductsTable />

      <ProductDetailSheet />
    </div>
  );
}
