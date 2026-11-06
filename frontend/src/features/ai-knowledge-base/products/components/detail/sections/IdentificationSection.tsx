'use client';

import { useState } from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { FileText } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormField, detailInputClassName } from '../FormField';
import { SectionCard } from '../SectionCard';
import { useCategories } from '../../../hooks/useCategories';
import type { GeneralFormValues } from '../../../schemas/product-schema';

export function IdentificationSection({
  form,
  onToggleActive,
}: {
  form: UseFormReturn<GeneralFormValues>;
  onToggleActive?: (isActive: boolean) => void | Promise<void>;
}) {
  const { register, control, watch, formState, setValue } = form;
  const [confirmInactivateOpen, setConfirmInactivateOpen] = useState(false);
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const selectedCategoryId = watch('categoryId');
  const selectedCategory = categories?.find(
    (category) => category.id === selectedCategoryId
  );

  return (
    <>
    <SectionCard
      icon={FileText}
      title="Identificación del producto"
      headerRight={
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-slate-400">Estado:</span>
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={(value) => {
                  if (!value) {
                    setConfirmInactivateOpen(true);
                    return;
                  }
                  field.onChange(true);
                  void onToggleActive?.(true);
                }}
                aria-label="Activar o desactivar producto"
              />
            )}
          />
          <span className="text-xs font-medium text-gray-700 dark:text-slate-300">
            {watch('isActive') ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Nombre del producto"
          required
          htmlFor="detail-product-name"
          error={formState.errors.name?.message}
        >
          <input
            id="detail-product-name"
            className={detailInputClassName}
            placeholder="Ej: Silla Sandy"
            {...register('name')}
          />
        </FormField>

        <FormField
          label="SKU / Código interno"
          required
          htmlFor="detail-product-sku"
          error={formState.errors.sku?.message}
        >
          <input
            id="detail-product-sku"
            className={detailInputClassName}
            placeholder="Ej: ALT-P-1042"
            {...register('sku')}
          />
        </FormField>

        <FormField
          label="Categoría"
          required
          error={formState.errors.categoryId?.message}
        >
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select
                value={field.value ? String(field.value) : undefined}
                onValueChange={(value) => {
                  const id = Number(value);
                  const category = categories?.find((item) => item.id === id);
                  field.onChange(id);
                  setValue('category', category?.nombre ?? '', {
                    shouldDirty: true,
                  });
                  setValue('line', category?.nombre ?? '', {
                    shouldDirty: true,
                  });
                  setValue('subcategoryId', 0, { shouldDirty: true });
                  setValue('subcategory', '', { shouldDirty: true });
                }}
                disabled={categoriesLoading}
              >
                <SelectTrigger className="h-10 border-gray-200 dark:border-slate-800">
                  <SelectValue
                    placeholder={
                      categoriesLoading
                        ? 'Cargando categorías…'
                        : 'Selecciona una categoría'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        <FormField
          label="Subcategoría"
          required
          error={formState.errors.subcategoryId?.message}
        >
          <Controller
            control={control}
            name="subcategoryId"
            render={({ field }) => (
              <Select
                value={field.value ? String(field.value) : undefined}
                onValueChange={(value) => {
                  const id = Number(value);
                  const subcategory = selectedCategory?.subcategorias.find(
                    (item) => item.id === id
                  );
                  field.onChange(id);
                  setValue('subcategory', subcategory?.nombre ?? '', {
                    shouldDirty: true,
                  });
                }}
                disabled={!selectedCategory}
              >
                <SelectTrigger className="h-10 border-gray-200 dark:border-slate-800">
                  <SelectValue
                    placeholder={
                      selectedCategory
                        ? 'Selecciona una subcategoría'
                        : 'Primero selecciona una categoría'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {selectedCategory?.subcategorias.map((subcategory) => (
                    <SelectItem
                      key={subcategory.id}
                      value={String(subcategory.id)}
                    >
                      {subcategory.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
      </div>
    </SectionCard>

    <Dialog
      open={confirmInactivateOpen}
      onOpenChange={setConfirmInactivateOpen}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Inactivar producto</DialogTitle>
          <DialogDescription>
            ¿Seguro que quieres inactivar este producto? Se inactivarán
            automáticamente todas sus variantes.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setConfirmInactivateOpen(false)}
            className="border-gray-300 text-gray-700 dark:text-slate-300"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              form.setValue('isActive', false, { shouldDirty: true });
              setConfirmInactivateOpen(false);
              void onToggleActive?.(false);
            }}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            Inactivar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
