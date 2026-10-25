'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { ImageIcon, Loader2, MoreVertical, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { useUploadVariantImage } from '../../../hooks/useUploadVariantImage';
import { compressImage } from '../../../lib/compress-image';
import { ColorInput } from '../ColorInput';
import { CurrencyInput } from '../CurrencyInput';
import { FormField, detailInputClassName } from '../FormField';
import { KommoTemplateField } from './KommoTemplateField';
import { MetaMappingField } from './MetaMappingField';
import type { VariantsFormValues } from '../../../schemas/product-schema';
import type { KommoTemplateDto } from '../../../types/product.types';

interface VariantCardProps {
  productId: string;
  form: UseFormReturn<VariantsFormValues>;
  index: number;
  isBusy?: boolean;
  initialTemplate?: KommoTemplateDto | null;
  initialMetaRetailerId?: string | null;
  initialMetaMappingLocked?: boolean;
  onDuplicate: (index: number) => void;
  onRemove: (index: number) => void;
  onToggleActive: (index: number) => void;
}

export function VariantCard({
  productId,
  form,
  index,
  isBusy = false,
  initialTemplate,
  initialMetaRetailerId = null,
  initialMetaMappingLocked = false,
  onDuplicate,
  onRemove,
  onToggleActive,
}: VariantCardProps) {
  const { register, control, watch, setValue, formState } = form;
  const variant = watch(`variants.${index}`);
  const errors = formState.errors.variants?.[index];
  const variantNumber = String(index + 1).padStart(2, '0');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadImage = useUploadVariantImage();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';
    if (!file) {
      return;
    }
    try {
      const optimized = await compressImage(file);
      const response = await uploadImage.mutateAsync(optimized);
      setValue(`variants.${index}.imageUrl`, response.data.url, { shouldDirty: true });
    } catch {
      // El toast de error lo maneja el hook.
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Variante {variantNumber}</h4>
          <span
            className={
              variant?.isActive
                ? 'ml-3 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs text-green-700'
                : 'ml-3 rounded-full border border-gray-200 dark:border-slate-800 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 text-xs text-gray-500 dark:text-slate-400'
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
              className="h-8 w-8 text-gray-500 dark:text-slate-400"
              aria-label={`Acciones de la variante ${variantNumber}`}
              disabled={isBusy}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onDuplicate(index)}>Duplicar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleActive(index)}>
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
          label="Imagen de la variante"
          className="sm:col-span-2"
          error={errors?.imageUrl?.message}
        >
          <div className="flex items-start gap-4">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50 dark:border-slate-800 dark:bg-slate-800">
              {variant?.imageUrl ? (
                <Image
                  src={variant.imageUrl}
                  alt={`Imagen de ${variant.name || 'la variante'}`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <ImageIcon className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-gray-300 dark:text-slate-600" />
              )}
            </div>
            <div className="flex flex-col items-start gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isBusy || uploadImage.isPending}
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5 border-gray-300 text-gray-700 dark:text-slate-300"
              >
                {uploadImage.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                {variant?.imageUrl ? 'Cambiar imagen' : 'Subir imagen'}
              </Button>
              {variant?.imageUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isBusy || uploadImage.isPending}
                  onClick={() => setValue(`variants.${index}.imageUrl`, '', { shouldDirty: true })}
                  className="text-red-600 hover:text-red-700"
                >
                  Quitar imagen
                </Button>
              )}
              <p className="text-xs text-gray-500 dark:text-slate-400">
                JPG, PNG, WEBP o GIF · máx. 10 MB (se optimiza automáticamente)
              </p>
            </div>
          </div>
        </FormField>

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

        <KommoTemplateField
          form={form}
          index={index}
          initialTemplate={initialTemplate}
        />

        {variant?.id && (
          <MetaMappingField
            productId={productId}
            variantId={variant.id}
            sku={variant.sku}
            variantName={variant.name}
            initialRetailerId={initialMetaRetailerId}
            initialMappingLocked={initialMetaMappingLocked}
            isBusy={isBusy}
          />
        )}
      </div>
    </div>
  );
}
