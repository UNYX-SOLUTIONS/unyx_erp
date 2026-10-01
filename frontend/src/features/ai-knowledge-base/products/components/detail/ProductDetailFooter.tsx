'use client';

import { Clock, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ProductLastUpdate } from '../../types/product.types';

interface ProductDetailFooterProps {
  lastUpdate: ProductLastUpdate;
  canSave: boolean;
  isSaving?: boolean;
  onCancel: () => void;
  onSave: () => void;
}

export function ProductDetailFooter({
  lastUpdate,
  canSave,
  isSaving = false,
  onCancel,
  onSave,
}: ProductDetailFooterProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4">
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
        <Clock className="h-3.5 w-3.5" />
        <span>
          {lastUpdate.author
            ? `Último cambio por ${lastUpdate.author} (${lastUpdate.label})`
            : `Último cambio: ${lastUpdate.label}`}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          className="border-gray-300 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/50"
        >
          Cancelar
        </Button>
        <Button
          onClick={onSave}
          disabled={!canSave || isSaving}
          className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
