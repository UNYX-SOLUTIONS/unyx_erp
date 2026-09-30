'use client';

import type { UseFieldArrayReturn, UseFormReturn } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VariantCard } from '../sections/VariantCard';
import type { VariantsFormValues } from '../../../schemas/product-schema';

interface VariantsTabProps {
  form: UseFormReturn<VariantsFormValues>;
  variantsArray: UseFieldArrayReturn<VariantsFormValues, 'variants'>;
}

export function VariantsTab({ form, variantsArray }: VariantsTabProps) {
  const { fields, append, remove } = variantsArray;

  const handleAdd = () => {
    append({
      id: crypto.randomUUID(),
      name: '',
      sku: '',
      color: '#9CA3AF',
      colorLabel: '',
      price: 0,
      description: '',
      isActive: true,
    });
  };

  const handleDuplicate = (index: number) => {
    const current = form.getValues(`variants.${index}`);
    append({
      ...current,
      id: crypto.randomUUID(),
      sku: `${current.sku}-copy`,
      name: `${current.name} (copia)`,
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
            className="gap-1 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            Agregar variante
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <VariantCard
            key={field.id}
            form={form}
            index={index}
            onDuplicate={handleDuplicate}
            onRemove={remove}
          />
        ))}
      </div>
    </div>
  );
}
