'use client';

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
import { FormField, detailInputClassName } from '../FormField';
import { SectionCard } from '../SectionCard';
import type { GeneralFormValues } from '../../../schemas/product-schema';

const LINE_OPTIONS = [
  'Sillas Tapizadas',
  'Sillas de Plastico',
  'Bases y mesas',
  'Taburetes',
  'Sillas de Oficina',
  'Sillines',
  'Mesas Auxiliares',
  'Sillas de Espera',
  'Sillas Ejecutivas',
  'Sillas Operativas',
  'Sillas Lounge',
];

export function IdentificationSection({ form }: { form: UseFormReturn<GeneralFormValues> }) {
  const { register, control, watch, formState } = form;

  return (
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
                onCheckedChange={field.onChange}
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

        <FormField label="Línea" required error={formState.errors.line?.message}>
          <Controller
            control={control}
            name="line"
            render={({ field }) => {
              const options =
                field.value && !LINE_OPTIONS.includes(field.value)
                  ? [field.value, ...LINE_OPTIONS]
                  : LINE_OPTIONS;
              return (
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <SelectTrigger className="h-10 border-gray-200 dark:border-slate-800">
                    <SelectValue placeholder="Selecciona una línea" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            }}
          />
        </FormField>

        <FormField
          label="Categoría"
          required
          htmlFor="detail-product-category"
          error={formState.errors.category?.message}
        >
          <input
            id="detail-product-category"
            className={detailInputClassName}
            placeholder="Ej: Sillas Tapizadas"
            {...register('category')}
          />
        </FormField>

        <FormField
          label="Subcategoría / Uso"
          htmlFor="detail-product-subcategory"
          className="sm:col-span-2"
          error={formState.errors.subcategory?.message}
        >
          <input
            id="detail-product-subcategory"
            className={detailInputClassName}
            placeholder="Ej: Interiores / Oficina ejecutiva y residencial"
            {...register('subcategory')}
          />
        </FormField>
      </div>
    </SectionCard>
  );
}
