'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Loader2, PackageSearch, Search } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency } from '@/lib/formatters';
import { getApiErrorMessage } from '@/lib/utils';
import { searchContificoCatalog } from '../../../api/products.api';
import { useUpdateVariantContificoMapping } from '../../../hooks/useUpdateVariantContificoMapping';
import type { ContificoCatalogItem } from '../../../types/product.types';

interface ContificoMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  variantId: string;
  variantName: string;
  sku: string;
  selectedContificoSku: string | null;
}

export function ContificoMappingDialog({
  open,
  onOpenChange,
  productId,
  variantId,
  variantName,
  sku,
  selectedContificoSku,
}: ContificoMappingDialogProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search.trim(), 300);
  const updateMapping = useUpdateVariantContificoMapping(productId);
  const isDisabled = updateMapping.isPending;

  const itemsQuery = useQuery({
    queryKey: ['contifico-catalog-search', debouncedSearch],
    queryFn: () => searchContificoCatalog(debouncedSearch, 20),
    enabled: open && debouncedSearch.length >= 2,
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });

  const items = (itemsQuery.data?.data ?? []).filter((item) => item.isActive);
  const hasSearch = debouncedSearch.length >= 2;

  const assign = async (item: ContificoCatalogItem) => {
    const response = await updateMapping
      .mutateAsync({
        variantId,
        payload: {
          contificoId: item.externalId,
          contificoSku: item.sku,
        },
      })
      .catch(() => null);
    if (!response) {
      return;
    }
    onOpenChange(false);
    toast.success('Mapeo de Contífico asignado');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Mapear variante con Contífico</DialogTitle>
          <DialogDescription>
            Busca el producto plano en Contífico y asígnalo a {variantName || 'esta variante'}
            {sku ? ` (${sku})` : ''}. El mapeo queda guardado en Altosa.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nombre, SKU o código de barra…"
            maxLength={80}
            className="pl-9"
            autoFocus
          />
          {itemsQuery.isFetching && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
          )}
        </div>

        <div className="max-h-80 min-h-40 overflow-y-auto rounded-lg border border-gray-200 dark:border-slate-800">
          {!hasSearch ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 px-6 text-center text-sm text-gray-500 dark:text-slate-400">
              <PackageSearch className="h-6 w-6 text-gray-300 dark:text-slate-600" />
              Escribe al menos 2 caracteres para buscar en Contífico.
            </div>
          ) : itemsQuery.isError ? (
            <div className="flex h-40 items-center justify-center px-6 text-center text-sm text-red-600">
              {getApiErrorMessage(itemsQuery.error, 'No se pudo consultar Contífico.')}
            </div>
          ) : items.length === 0 && !itemsQuery.isFetching ? (
            <div className="flex h-40 items-center justify-center px-6 text-center text-sm text-gray-500 dark:text-slate-400">
              No se encontraron productos en Contífico.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-slate-800">
              {items.map((item) => {
                const isCurrent = item.sku === selectedContificoSku;
                return (
                  <li key={item.externalId}>
                    <button
                      type="button"
                      onClick={() => void assign(item)}
                      disabled={isDisabled || isCurrent}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 disabled:cursor-default disabled:opacity-70 dark:hover:bg-slate-800/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-slate-100">
                          {item.name}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                          {item.sku}
                          {item.category ? ` · ${item.category}` : ''}
                          {item.stock !== undefined ? ` · ${item.stock} en stock` : ''}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                        {item.price === null ? 'Sin precio' : formatCurrency(item.price)}
                      </span>
                      {isCurrent ? (
                        <Check className="h-4 w-4 text-sky-600" />
                      ) : (
                        <span className="text-xs font-medium text-sky-700 dark:text-sky-300">
                          Asignar
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDisabled}
            className="border-gray-300 text-gray-700 dark:text-slate-300"
          >
            {isDisabled ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
