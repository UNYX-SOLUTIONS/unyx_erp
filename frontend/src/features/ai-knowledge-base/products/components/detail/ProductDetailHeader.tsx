'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SheetTitle } from '@/components/ui/sheet';
import { mapProductDtoToUi } from '../../mappers';
import { SyncCell } from '../SyncCell';
import { ValidationCell } from '../ValidationCell';
import type { ProductDto } from '../../types/product.types';

function buildIdBase(sku: string): string {
  return `#KB-${sku.replace(/^ALT-P-/, '')}-UNX`;
}

interface ProductDetailHeaderProps {
  product: ProductDto;
  onClose: () => void;
}

export function ProductDetailHeader({ product, onClose }: ProductDetailHeaderProps) {
  const ui = mapProductDtoToUi(product);

  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-200 dark:border-slate-800 px-6 py-5">
      <div className="min-w-0">
        <SheetTitle className="text-xl font-semibold text-gray-900 dark:text-slate-100">{product.name}</SheetTitle>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <ValidationCell status={ui.status} />
          <SyncCell status={ui.syncStatus} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
          <span className="font-medium text-blue-600">{product.sku}</span>
          <span className="text-gray-300">•</span>
          <span className="text-gray-500 dark:text-slate-400">{ui.line || '—'}</span>
          <span className="text-gray-300">•</span>
          <span className="text-gray-400 dark:text-slate-500">ID Base: {buildIdBase(product.sku)}</span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        aria-label="Cerrar detalle"
        className="shrink-0 text-gray-500 dark:text-slate-400"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
