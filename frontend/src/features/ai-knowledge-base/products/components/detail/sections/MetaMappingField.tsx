'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ImageIcon,
  Loader2,
  RefreshCw,
  Search,
  Settings2,
  TriangleAlert,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormField } from '../FormField';
import { usePermission } from '@/hooks/usePermission';
import { getApiErrorMessage } from '@/lib/utils';
import { getMetaCatalogItem } from '../../../api/products.api';
import { useUpdateVariantMetaMapping } from '../../../hooks/useUpdateVariantMetaMapping';
import { MetaCatalogPicker } from './MetaCatalogPicker';
import type { MetaCatalogItem } from '../../../types/product.types';

interface MetaMappingFieldProps {
  productId: string;
  variantId: string;
  sku: string;
  variantName: string;
  initialRetailerId?: string | null;
  initialMappingLocked?: boolean;
  isBusy?: boolean;
}

type ConfirmAction = 'clear' | 'unlock' | null;

function isNotFoundError(error: unknown): boolean {
  const status = (error as { response?: { status?: number } } | null)?.response?.status;
  return status === 404;
}

export function MetaMappingField({
  productId,
  variantId,
  sku,
  variantName,
  initialRetailerId = null,
  initialMappingLocked = false,
  isBusy = false,
}: MetaMappingFieldProps) {
  const { can } = usePermission();
  const canEdit = can('products.update');
  const [retailerId, setRetailerId] = useState<string | null>(initialRetailerId);
  const [mappingLocked, setMappingLocked] = useState(initialMappingLocked);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  useEffect(() => {
    setRetailerId(initialRetailerId);
    setMappingLocked(initialMappingLocked);
  }, [initialRetailerId, initialMappingLocked]);

  const updateMapping = useUpdateVariantMetaMapping(productId);
  const isSaving = updateMapping.isPending;
  const isDisabled = isBusy || isSaving;

  const currentItemQuery = useQuery({
    queryKey: ['meta-catalog-item', retailerId],
    queryFn: () => getMetaCatalogItem(retailerId as string),
    enabled: Boolean(retailerId),
    staleTime: 60_000,
    retry: (failureCount, error) => (isNotFoundError(error) ? false : failureCount < 1),
  });

  const currentItem = currentItemQuery.data?.data ?? null;
  const missingFromCatalog =
    Boolean(retailerId) && currentItemQuery.isError && isNotFoundError(currentItemQuery.error);

  const statusLabel = retailerId
    ? mappingLocked
      ? 'Mapeado (manual)'
      : 'Mapeado (auto)'
    : 'Sin mapear';

  const assign = async (item: MetaCatalogItem) => {
    const response = await updateMapping
      .mutateAsync({
        variantId,
        payload: { metaRetailerId: item.retailerId },
      })
      .catch(() => null);
    if (!response) {
      return;
    }
    setRetailerId(response.data.metaRetailerId ?? item.retailerId);
    setMappingLocked(response.data.metaMappingLocked ?? true);
    setPickerOpen(false);
    toast.success('Mapeo de Meta asignado');
  };

  const confirmMappingChange = async () => {
    if (!confirmAction) {
      return;
    }
    const response = await updateMapping
      .mutateAsync({
        variantId,
        payload:
          confirmAction === 'unlock'
            ? { metaRetailerId: null, metaMappingLocked: false }
            : { metaRetailerId: null },
      })
      .catch(() => null);
    if (!response) {
      return;
    }
    setRetailerId(response.data.metaRetailerId ?? null);
    setMappingLocked(response.data.metaMappingLocked ?? confirmAction !== 'unlock');
    setConfirmAction(null);
    toast.success(
      confirmAction === 'unlock'
        ? 'Modo automático restaurado. El próximo sync evaluará la variante.'
        : 'Mapeo de Meta quitado'
    );
  };

  return (
    <>
      <FormField label="Catálogo Meta / WhatsApp" className="sm:col-span-2">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/20">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  {statusLabel}
                </span>
                {retailerId ? (
                  <span className="truncate font-mono text-xs text-gray-700 dark:text-slate-300">
                    {retailerId}
                  </span>
                ) : (
                  <span className="text-xs text-gray-500 dark:text-slate-400">
                    n8n usará el SKU como fallback
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
                  className="gap-1.5 border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900 dark:text-emerald-300"
                >
                  <Search className="h-3.5 w-3.5" />
                  {retailerId ? 'Cambiar' : 'Buscar en catálogo Meta'}
                </Button>
                {retailerId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmAction('clear')}
                    disabled={isDisabled}
                    className="gap-1 text-gray-500 hover:text-red-600 dark:text-slate-400"
                  >
                    <X className="h-3.5 w-3.5" />
                    Quitar mapeo
                  </Button>
                )}
                {mappingLocked && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmAction('unlock')}
                    disabled={isDisabled}
                    className="gap-1 text-gray-500 hover:text-emerald-700 dark:text-slate-400"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    Restaurar sync automático
                  </Button>
                )}
              </div>
            ) : null}
          </div>

          {retailerId && (
            <div className="mt-3 rounded-lg border border-emerald-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              {currentItemQuery.isLoading ? (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Consultando el ítem en el catálogo de Meta…
                </div>
              ) : missingFromCatalog ? (
                <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
                  <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    El ID ya no está en el catálogo. Puedes quitar el mapeo y buscar uno
                    vigente.
                  </span>
                </div>
              ) : currentItem ? (
                <div className="flex min-w-0 gap-3">
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-gray-50 dark:border-slate-800 dark:bg-slate-800">
                    {currentItem.imageUrl ? (
                      <img
                        src={currentItem.imageUrl}
                        alt={currentItem.name || 'Ítem de Meta'}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-gray-300 dark:text-slate-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-slate-100">
                      {currentItem.name || '(Sin nombre)'}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                      {currentItem.price || 'Sin precio'}
                      {currentItem.availability ? ` · ${currentItem.availability}` : ''}
                      {currentItem.visibility ? ` · ${currentItem.visibility}` : ''}
                    </p>
                    {currentItem.url && (
                      <a
                        href={currentItem.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-300"
                      >
                        Ver en el catálogo
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3 text-xs text-gray-500 dark:text-slate-400">
                  <span>
                    {getApiErrorMessage(
                      currentItemQuery.error,
                      'No se pudo consultar el ítem en el catálogo de Meta.'
                    )}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void currentItemQuery.refetch()}
                    className="shrink-0 border-gray-300 text-gray-700 dark:border-slate-700 dark:text-slate-300"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Reintentar
                  </Button>
                </div>
              )}
            </div>
          )}

          {!retailerId && mappingLocked && (
            <p className="mt-2 text-[11px] font-medium text-amber-600 dark:text-amber-400">
              Mapeo manual bloqueado sin Retailer ID: el sync no llenará esta variante
              hasta que restaures el modo automático.
            </p>
          )}

          {!canEdit && (
            <p className="mt-2 text-[11px] text-gray-500 dark:text-slate-400">
              No tienes permiso para editar el mapeo de esta variante.
            </p>
          )}
        </div>
      </FormField>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-xl overflow-hidden sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Catálogo Meta / WhatsApp</DialogTitle>
            <DialogDescription>
              Selecciona el ítem de Meta que corresponde a {variantName || 'esta variante'}
              {sku ? ` (${sku})` : ''}.
            </DialogDescription>
          </DialogHeader>
          <MetaCatalogPicker
            selectedRetailerId={retailerId}
            isSaving={isSaving}
            onSelect={(item) => {
              void assign(item);
            }}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPickerOpen(false)}
              disabled={isSaving}
              className="border-gray-300 text-gray-700 dark:border-slate-700 dark:text-slate-300"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open && !isSaving) {
            setConfirmAction(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'unlock'
                ? '¿Restaurar el sync automático?'
                : '¿Quitar el mapeo de Meta?'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === 'unlock'
                ? 'Se borrará el Retailer ID actual y se desbloqueará la variante. El próximo sync podrá volver a llenarlo.'
                : 'La variante quedará sin Retailer ID y con el mapeo manual bloqueado. n8n volverá a usar el SKU como fallback.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmAction(null)}
              disabled={isSaving}
              className="border-gray-300 text-gray-700 dark:border-slate-700 dark:text-slate-300"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => void confirmMappingChange()}
              disabled={isSaving}
              className={
                confirmAction === 'unlock'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : confirmAction === 'unlock' ? (
                'Restaurar'
              ) : (
                'Quitar mapeo'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
