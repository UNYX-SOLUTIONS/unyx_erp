'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SheetTitle } from '@/components/ui/sheet';
import { SyncCell } from '../SyncCell';
import { ValidationCell } from '../ValidationCell';
import type { Product } from '../../types/product.types';

function buildIdBase(sku: string): string {
  return `#KB-${sku.replace(/^ALT-P-/, '')}-UNX`;
}

interface ProductDetailHeaderProps {
  product: Product;
  onClose: () => void;
}

export function ProductDetailHeader({ product, onClose }: ProductDetailHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5">
      <div className="min-w-0">
        <SheetTitle className="text-xl font-semibold text-gray-900">{product.name}</SheetTitle>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <ValidationCell status={product.status} />
          <SyncCell status={product.syncStatus} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
          <span className="font-medium text-blue-600">{product.sku}</span>
          <span className="text-gray-300">•</span>
          <span className="text-gray-500">{product.line}</span>
          <span className="text-gray-300">•</span>
          <span className="text-gray-400">ID Base: {buildIdBase(product.sku)}</span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        aria-label="Cerrar detalle"
        className="shrink-0 text-gray-500"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
