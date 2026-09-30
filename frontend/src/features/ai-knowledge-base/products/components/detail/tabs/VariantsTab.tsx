'use client';

import type { UseFieldArrayReturn, UseFormReturn } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAddVariant } from '../../../hooks/useAddVariant';
import { useDeleteVariant } from '../../../hooks/useDeleteVariant';
import { useUpdateVariant } from '../../../hooks/useUpdateVariant';
import { VariantCard } from '../sections/VariantCard';
import type { ProductDetailDto } from '../../../types/product.types';
import type { VariantsFormValues } from '../../../schemas/product-schema';

interface VariantsTabProps {
  product: ProductDetailDto;
  form: UseFormReturn<VariantsFormValues>;
  variantsArray: UseFieldArrayReturn<VariantsFormValues, 'variants'>;
  addVariant: ReturnType<typeof useAddVariant>;
  updateVariant: ReturnType<typeof useUpdateVariant>;
  deleteVariant: ReturnType<typeof useDeleteVariant>;
}

export function VariantsTab({
  form,
  variantsArray,
  addVariant,
  updateVariant,
  deleteVariant,
}: VariantsTabProps) {
  const { fields } = variantsArray;
  const isBusy = addVariant.isPending || updateVariant.isPending || deleteVariant.isPending;

  const handleAdd = () => {
    addVariant.mutate({ name: `Variante ${fields.length + 1}` });
  };

  const handleDuplicate = (index: number) => {
    const current = form.getValues(`variants.${index}`);
    addVariant.mutate({
      name: `${current.name} (copia)`,
      color: current.colorLabel || undefined,
      colorHex: current.color || undefined,
      price: current.price,
      description: current.description || undefined,
    });
  };

  const handleRemove = (index: number) => {
    deleteVariant.mutate(form.getValues(`variants.${index}.id`));
  };

  const handleToggleActive = (index: number) => {
    const current = form.getValues(`variants.${index}`);
    updateVariant.mutate({
      variantId: current.id,
      payload: { isActive: !current.isActive },
    });
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Variantes del producto</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Administra las variantes y precios disponibles para este producto.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
            {fields.length} {fields.length === 1 ? 'variante' : 'variantes'}
          </span>
          <Button
            variant="outline"
            onClick={handleAdd}
            disabled={isBusy}
            className="gap-1 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            Agregar variante
          </Button>
        </div>
      </div>

      {fields.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-gray-300 px-6 py-12 text-center">
          <p className="text-sm font-medium text-gray-900">Sin variantes todavía</p>
          <p className="text-xs text-gray-500">
            Agrega la primera variante para este producto (color, SKU y precio).
          </p>
          <Button
            variant="outline"
            onClick={handleAdd}
            disabled={isBusy}
            className="mt-1 gap-1 border-gray-300 text-gray-700"
          >
            <Plus className="h-4 w-4" />
            Agregar variante
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <VariantCard
              key={field.id}
              form={form}
              index={index}
              isBusy={isBusy}
              onDuplicate={handleDuplicate}
              onRemove={handleRemove}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}
    </div>
  );
}
