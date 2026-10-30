'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { 
  ChevronDown, 
  ChevronUp, 
  ImageIcon, 
  Loader2, 
  MoreVertical, 
  Upload,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useUploadVariantImage } from '../../../hooks/useUploadVariantImage';
import { useWarranties } from '../../../../warranties/hooks/useWarranties';
import { warrantyLabel } from '../../../../warranties/lib/warranty-label';
import { compressImage } from '../../../lib/compress-image';
import { ColorInput } from '../ColorInput';
import { CurrencyInput } from '../CurrencyInput';
import { FormField, detailInputClassName } from '../FormField';
import { KommoTemplateField } from './KommoTemplateField';
import { MetaMappingField } from './MetaMappingField';
import { ContificoMappingField } from './ContificoMappingField';
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
  initialContificoId?: string | null;
  initialContificoSku?: string | null;
  isFocused?: boolean;
  defaultOpen?: boolean;
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
  initialContificoId = null,
  initialContificoSku = null,
  isFocused = false,
  defaultOpen,
  onDuplicate,
  onRemove,
  onToggleActive,
}: VariantCardProps) {
  const { register, control, watch, setValue, formState } = form;
  const variant = watch(`variants.${index}`);
  const errors = formState.errors.variants?.[index];
  const variantNumber = String(index + 1).padStart(2, '0');

  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadImage = useUploadVariantImage();
  const warrantiesQuery = useWarranties('all');

  // Estado local para manejar el acordeón (abierto/cerrado)
  const [isOpen, setIsOpen] = useState(defaultOpen ?? (index === 0 || isFocused));

  useEffect(() => {
    if (!isFocused) return;
    
    setIsOpen(true); // Abrir si está enfocado
    
    const timer = window.setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [isFocused]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';
    if (!file) return;

    try {
      const optimized = await compressImage(file);
      const response = await uploadImage.mutateAsync(optimized);
      setValue(`variants.${index}.imageUrl`, response.data.url, { shouldDirty: true });
    } catch {
      // El toast de error lo maneja el hook.
    }
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        'rounded-xl border transition-all duration-200',
        isOpen 
          ? 'border-blue-300 bg-white shadow-sm dark:border-blue-700 dark:bg-slate-900' 
          : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-800/50',
        isFocused && 'ring-2 ring-blue-500/30 border-blue-400 dark:border-blue-600'
      )}
    >
      {/* HEADER COLAPSABLE */}
      <div
        className="flex cursor-pointer items-center justify-between px-4 py-3"
        onClick={() => setIsOpen((open) => !open)}
      >
        <div className="flex flex-1 items-center gap-4">
          {/* Icono chevron */}
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}

          {/* Nombre */}
          <span className="text-sm font-semibold text-gray-900 dark:text-slate-100 min-w-[180px] truncate">
            {variant?.name || `Variante ${variantNumber}`}
          </span>

          {/* SKU */}
          <span className="rounded bg-gray-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-slate-400 hidden sm:inline-block">
            {variant?.sku || 'Sin SKU'}
          </span>

          {/* Precio */}
          <span className="text-sm font-bold text-gray-900 dark:text-slate-100">
            ${variant?.price?.toFixed(2) || '0.00'}
          </span>

          {/* Estado */}
          <div className="ml-auto flex items-center gap-2">
            <span className={cn(
              "flex items-center gap-1.5 text-xs font-medium",
              variant?.isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-slate-400'
            )}>
              <span className={cn(
                "h-2 w-2 rounded-full",
                variant?.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'
              )} />
              {variant?.isActive ? 'Activa' : 'Inactiva'}
            </span>
          </div>
        </div>

        {/* Menú de acciones */}
        <div
          className="ml-4 pl-4 border-l border-gray-200 dark:border-slate-700"
          onClick={(event) => event.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500"
                onClick={(e) => e.stopPropagation()} // Evitar que se cierre/abra el acordeón al hacer clic aquí
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
              <DropdownMenuItem onClick={() => onRemove(index)} className="text-red-600 focus:text-red-600">
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* CONTENIDO EXPANDIDO */}
      {isOpen && (
        <div className="border-t border-gray-100 dark:border-slate-800 px-6 py-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            
            {/* Fila 1: Nombre y SKU (Ocultos en el form si ya están en el header, pero editables aquí) */}
            <FormField label="NOMBRE DE VARIANTE" required htmlFor={`variant-${index}-name`} error={errors?.name?.message}>
              <input
                id={`variant-${index}-name`}
                className={detailInputClassName}
                placeholder="Ej: Tapiz Blanco"
                {...register(`variants.${index}.name`)}
              />
            </FormField>

            <FormField label="SKU DE VARIANTE" required htmlFor={`variant-${index}-sku`} error={errors?.sku?.message}>
              <input
                id={`variant-${index}-sku`}
                className={detailInputClassName}
                placeholder="Ej: ALT-P-1042"
                {...register(`variants.${index}.sku`)}
              />
            </FormField>

            {/* Fila 2: Color y Precio */}
            <FormField label="COLOR / ACABADO" error={errors?.colorLabel?.message}>
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

            <FormField label="PRECIO USD *" htmlFor={`variant-${index}-price`} error={errors?.price?.message}>
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

            {/* Fila 3: Imagen (Se mantiene tu lógica intacta) */}
            <FormField label="Imagen de la variante" className="sm:col-span-2" error={errors?.imageUrl?.message}>
              <div className="flex items-start gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-slate-800 dark:bg-slate-800">
                  {variant?.imageUrl ? (
                    <Image src={variant.imageUrl} alt="Imagen" fill sizes="80px" className="object-cover" />
                  ) : (
                    <ImageIcon className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-gray-300 dark:text-slate-600" />
                  )}
                </div>
                <div className="flex flex-col items-start gap-2">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  <Button type="button" variant="outline" size="sm" disabled={isBusy || uploadImage.isPending} onClick={() => fileInputRef.current?.click()} className="gap-1.5 border-gray-300">
                    {uploadImage.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {variant?.imageUrl ? 'Cambiar imagen' : 'Subir imagen'}
                  </Button>
                  {variant?.imageUrl && (
                    <Button type="button" variant="ghost" size="sm" disabled={isBusy || uploadImage.isPending} onClick={() => setValue(`variants.${index}.imageUrl`, '', { shouldDirty: true })} className="text-red-600 hover:text-red-700 h-7 px-2">
                      Quitar imagen
                    </Button>
                  )}
                </div>
              </div>
            </FormField>

            {/* Fila 4: Descripción (a todo lo ancho) */}
            <FormField label="DESCRIPCIÓN / DETALLE" htmlFor={`variant-${index}-description`} className="sm:col-span-2" error={errors?.description?.message}>
              <Textarea
                id={`variant-${index}-description`}
                rows={3}
                placeholder="Espuma inyectada de alta densidad, base de aluminio cromado..."
                {...register(`variants.${index}.description`)}
                className="resize-none"
              />
            </FormField>

            {/* Sección especial de Garantía */}
            <FormField
              label="Garantía"
              htmlFor={`variant-${index}-warranty`}
              className="sm:col-span-2"
              error={errors?.garantiaId?.message}
            >
              <div className="relative">
                <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-600" />
                <Controller
                  control={control}
                  name={`variants.${index}.garantiaId`}
                  render={({ field }) => (
                    <select
                      id={`variant-${index}-warranty`}
                      value={field.value ?? ''}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value ? Number(event.target.value) : null
                        )
                      }
                      onBlur={field.onBlur}
                      disabled={isBusy}
                      className={`${detailInputClassName} appearance-none pl-9 pr-9`}
                    >
                      <option value="">Sin garantía</option>
                      {(warrantiesQuery.data?.data ?? []).map((warranty) => (
                        <option
                          key={warranty.id}
                          value={warranty.id}
                          disabled={
                            !warranty.isActive &&
                            Number(field.value) !== warranty.id
                          }
                        >
                          {warrantyLabel(warranty)}
                          {warranty.isActive ? '' : ' (inactiva)'}
                        </option>
                      ))}
                    </select>
                  )}
                />
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              {warrantiesQuery.isError && (
                <p className="text-xs text-amber-600">
                  No se pudieron cargar las garantías.
                </p>
              )}
            </FormField>

            {/* Integraciones (Kommo, Meta, Contifico) */}
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 pt-4 border-t border-gray-100 dark:border-slate-800">
              <KommoTemplateField form={form} index={index} initialTemplate={initialTemplate} />
              
              {variant?.id && (
                <>
                  <MetaMappingField
                    productId={productId}
                    variantId={variant.id}
                    sku={variant.sku}
                    variantName={variant.name}
                    initialRetailerId={initialMetaRetailerId}
                    initialMappingLocked={initialMetaMappingLocked}
                    isBusy={isBusy}
                  />
                  <ContificoMappingField
                    productId={productId}
                    variantId={variant.id}
                    sku={variant.sku}
                    variantName={variant.name}
                    initialContificoId={initialContificoId}
                    initialContificoSku={initialContificoSku}
                    isBusy={isBusy}
                  />
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}