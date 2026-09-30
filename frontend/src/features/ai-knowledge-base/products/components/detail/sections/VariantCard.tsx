'use client';

import { Controller, type UseFormReturn } from 'react-hook-form';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { ColorInput } from '../ColorInput';
import { CurrencyInput } from '../CurrencyInput';
import { FormField, detailInputClassName } from '../FormField';
import type { VariantsFormValues } from '../../../schemas/product-schema';

interface VariantCardProps {
  form: UseFormReturn<VariantsFormValues>;
  index: number;
  onDuplicate: (index: number) => void;
  onRemove: (index: number) => void;
}

export function VariantCard({ form, index, onDuplicate, onRemove }: VariantCardProps) {
  const { register, control, watch, setValue, formState } = form;
  const variant = watch(`variants.${index}`);
  const errors = formState.errors.variants?.[index];
  const variantNumber = String(index + 1).padStart(2, '0');

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <h4 className="text-sm font-semibold text-gray-900">Variante {variantNumber}</h4>
          <span
            className={
              variant?.isActive
                ? 'ml-3 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs text-green-700'
                : 'ml-3 rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs text-gray-500'
            }
          >
            {variant?.isActive ? 'Activa' : 'Inactiva'}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500"
              aria-label={`Acciones de la variante ${variantNumber}`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onDuplicate(index)}>Duplicar</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                setValue(`variants.${index}.isActive`, !variant?.isActive, { shouldDirty: true })
              }
            >
              {variant?.isActive ? 'Marcar inactiva' : 'Marcar activa'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onRemove(index)}
              className="text-red-600 focus:text-red-600"
            >
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Nombre de variante"
          required
          htmlFor={`variant-${index}-name`}
          error={errors?.name?.message}
        >
          <input
            id={`variant-${index}-name`}
            className={detailInputClassName}
            placeholder="Ej: Taupe"
            {...register(`variants.${index}.name`)}
          />
        </FormField>

        <FormField
          label="SKU de variante"
          required
          htmlFor={`variant-${index}-sku`}
          error={errors?.sku?.message}
        >
          <input
            id={`variant-${index}-sku`}
            className={detailInputClassName}
            placeholder="Ej: ALT-P-1042-1"
            {...register(`variants.${index}.sku`)}
          />
        </FormField>

        <FormField label="Color / Acabado" error={errors?.colorLabel?.message}>
          <Controller
            control={control}
            name={`variants.${index}.colorLabel`}
            render={({ field }) => (
              <ColorInput
                color={variant?.color ?? '#9CA3AF'}
                label={field.value ?? ''}
                onLabelChange={field.onChange}
              />
            )}
          />
        </FormField>

        <FormField
          label="Precio"
          required
          htmlFor={`variant-${index}-price`}
          error={errors?.price?.message}
        >
          <Controller
            control={control}
            name={`variants.${index}.price`}
            render={({ field }) => (
              <CurrencyInput
                id={`variant-${index}-price`}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                hasError={Boolean(errors?.price?.message)}
              />
            )}
          />
        </FormField>

        <FormField
          label="Descripción / Detalle"
          htmlFor={`variant-${index}-description`}
          className="sm:col-span-2"
          error={errors?.description?.message}
        >
          <Textarea
            id={`variant-${index}-description`}
            rows={2}
            placeholder="Información adicional de esta variante..."
            {...register(`variants.${index}.description`)}
          />
        </FormField>
      </div>
    </div>
  );
}
