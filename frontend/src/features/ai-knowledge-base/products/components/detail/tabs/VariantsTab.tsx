'use client';

import { useState } from 'react';
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
  focusVariantId?: string | null;
}

export function VariantsTab({
  product,
  form,
  variantsArray,
  addVariant,
  updateVariant,
  deleteVariant,
  focusVariantId,
}: VariantsTabProps) {
  const { fields } = variantsArray;
  const watchedVariants = form.watch('variants');
  const activeCount = watchedVariants.filter((variant) => variant.isActive).length;
  const [autoOpenIndex, setAutoOpenIndex] = useState<number | null>(null);
  const isBusy = addVariant.isPending || updateVariant.isPending || deleteVariant.isPending;

  const handleAdd = () => {
    const nextNumber = fields.length + 1;
    const nextIndex = fields.length;
    variantsArray.append({
      id: '',
      name: `Variante ${nextNumber}`,
      sku: '',
      color: '#9CA3AF',
      colorLabel: `Variante ${nextNumber}`,
      price: 0,
      description: '',
      imageUrl: '',
      isActive: true,
      kommoTemplateId: null,
      garantiaId: null,
    });
    setAutoOpenIndex(nextIndex);
  };

  const handleDuplicate = (index: number) => {
    const current = form.getValues(`variants.${index}`);
    const nextIndex = fields.length;
    variantsArray.append({
      ...current,
      id: '',
      name: `${current.name} (copia)`,
      sku: '',
    });
    setAutoOpenIndex(nextIndex);
  };

  const handleRemove = (index: number) => {
    const current = form.getValues(`variants.${index}`);
    if (!current.id) {
      variantsArray.remove(index);
      return;
    }
    deleteVariant.mutate(current.id);
  };

  const handleToggleActive = (index: number) => {
    const current = form.getValues(`variants.${index}`);
    if (!current.id) {
      form.setValue(`variants.${index}.isActive`, !current.isActive, {
        shouldDirty: true,
      });
      return;
    }
    updateVariant.mutate({
      variantId: current.id,
      payload: { isActive: !current.isActive },
    });
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
              Variantes del producto
            </h3>
            <span className="rounded-full bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
              {activeCount} {activeCount === 1 ? 'activa' : 'activas'}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            Administra atributos, precios y garantías específicas para cada variante.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleAdd}
          disabled={isBusy}
          className="gap-1.5 border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40"
        >
          <Plus className="h-4 w-4" />
          Agregar variante
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-gray-300 px-6 py-12 text-center">
          <p className="text-sm font-medium text-gray-900 dark:text-slate-100">Sin variantes todavía</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Agrega la primera variante para este producto (color, SKU y precio).
          </p>
          <Button
            variant="outline"
            onClick={handleAdd}
            disabled={isBusy}
            className="mt-1 gap-1.5 border-gray-300 text-gray-700 dark:text-slate-300"
          >
            <Plus className="h-4 w-4" />
            Agregar variante
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <VariantCard
              key={field.id}
              productId={product.id}
              form={form}
              index={index}
              isBusy={isBusy}
              initialTemplate={product.variants[index]?.kommoTemplate ?? null}
              initialMetaRetailerId={product.variants[index]?.metaRetailerId ?? null}
              initialMetaMappingLocked={product.variants[index]?.metaMappingLocked ?? false}
              initialContificoId={product.variants[index]?.contificoId ?? null}
              initialContificoSku={product.variants[index]?.contificoSku ?? null}
              isFocused={focusVariantId != null && product.variants[index]?.id === focusVariantId}
              defaultOpen={autoOpenIndex === index ? true : undefined}
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