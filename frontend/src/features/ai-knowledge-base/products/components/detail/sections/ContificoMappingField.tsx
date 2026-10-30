'use client';

import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { usePermission } from '@/hooks/usePermission';
import { useUpdateVariantContificoMapping } from '../../../hooks/useUpdateVariantContificoMapping';
import { ContificoMappingDialog } from './ContificoMappingDialog';
import { FormField } from '../FormField';

interface ContificoMappingFieldProps {
  productId: string;
  variantId: string;
  sku: string;
  variantName: string;
  initialContificoId?: string | null;
  initialContificoSku?: string | null;
  isBusy?: boolean;
}

export function ContificoMappingField({
  productId,
  variantId,
  sku,
  variantName,
  initialContificoId = null,
  initialContificoSku = null,
  isBusy = false,
}: ContificoMappingFieldProps) {
  const { can } = usePermission();
  const canEdit = can('products.update');
  const [contificoId, setContificoId] = useState<string | null>(initialContificoId);
  const [contificoSku, setContificoSku] = useState<string | null>(initialContificoSku);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    setContificoId(initialContificoId);
    setContificoSku(initialContificoSku);
  }, [initialContificoId, initialContificoSku]);

  const updateMapping = useUpdateVariantContificoMapping(productId);
  const isDisabled = isBusy || updateMapping.isPending;
  const isMapped = Boolean(contificoId || contificoSku);

  const clear = async () => {
    const response = await updateMapping
      .mutateAsync({
        variantId,
        payload: { contificoId: null, contificoSku: null },
      })
      .catch(() => null);
    if (!response) {
      return;
    }
    setContificoId(null);
    setContificoSku(null);
    toast.success('Mapeo de Contífico quitado');
  };

  return (
    <>
      <FormField label="Catálogo Contífico" className="sm:col-span-2">
        <div className="rounded-lg border border-sky-200 bg-sky-50/40 p-3 dark:border-sky-900/60 dark:bg-sky-950/20">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                  {isMapped ? 'Mapeado' : 'Sin mapear'}
                </span>
                {contificoSku ? (
                  <span className="truncate font-mono text-xs text-gray-700 dark:text-slate-300">
                    {contificoSku}
                  </span>
                ) : (
                  <span className="text-xs text-gray-500 dark:text-slate-400">
                    Cada variante es un producto plano en Contífico
                  </span>
                )}
                {contificoId && (
                  <span className="truncate text-[11px] text-gray-400 dark:text-slate-500">
                    ID {contificoId}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                Variante {variantName || '(sin nombre)'} · SKU {sku || '(sin SKU)'}
              </p>
            </div>

            {canEdit ? (
              <div className="flex shrink-0 flex-wrap items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPickerOpen(true)}
                  disabled={isDisabled}
                  className="gap-1.5 border-sky-200 bg-white text-sky-700 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-900 dark:text-sky-300"
                >
                  <Search className="h-3.5 w-3.5" />
                  {isMapped ? 'Cambiar' : 'Sincronizar con Contífico'}
                </Button>
                {isMapped && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clear}
                    disabled={isDisabled}
                    className="gap-1 text-gray-500 hover:text-red-600 dark:text-slate-400"
                  >
                    <X className="h-3.5 w-3.5" />
                    Quitar mapeo
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </FormField>

      <ContificoMappingDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        productId={productId}
        variantId={variantId}
        variantName={variantName}
        sku={sku}
        selectedContificoSku={contificoSku}
      />
    </>
  );
}
