import { Boxes } from 'lucide-react';
import type { ProductVariantInfo } from '../types/product.types';

export function VariantsCell({ variants }: { variants: ProductVariantInfo }) {
  return (
    <div className="flex items-start gap-2">
      <Boxes className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
      <div>
        <p className="text-sm font-medium text-gray-900">
          {variants.count} {variants.count === 1 ? 'variante' : 'variantes'}
        </p>
        {variants.label && <p className="mt-0.5 text-xs text-gray-500">{variants.label}</p>}
      </div>
    </div>
  );
}
