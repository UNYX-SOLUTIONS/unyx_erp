'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, PackageSearch, Plus, Search } from 'lucide-react';
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
import { getApiErrorMessage } from '@/lib/utils';
import {
  searchContificoProducts,
  type ContificoProductSuggestion,
} from '../../api/products.api';
import { useImportContificoProduct } from '../../hooks/useImportContificoProduct';
import { useProductDetailStore } from '../../stores/product-detail-store';

function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export function ContificoProductSearch() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ContificoProductSuggestion | null>(null);
  const debouncedQuery = useDebouncedValue(query.trim());
  const importProduct = useImportContificoProduct();
  const openProduct = useProductDetailStore((state) => state.open);
  const close = useProductDetailStore((state) => state.close);

  const search = useQuery({
    queryKey: ['contifico-product-search', debouncedQuery],
    queryFn: () => searchContificoProducts(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30_000,
  });

  const suggestions = useMemo(() => search.data?.data ?? [], [search.data]);
  const available = useMemo(
    () => suggestions.filter((suggestion) => !suggestion.alreadyAdded),
    [suggestions]
  );
  const alreadyAdded = useMemo(
    () => suggestions.filter((suggestion) => suggestion.alreadyAdded),
    [suggestions]
  );

  const handleConfirm = () => {
    if (!selected) {
      return;
    }

    importProduct.mutate(
      { contificoId: selected.contificoId, sku: selected.sku },
      {
        onSuccess: (response) => {
          const result = response.data;
          setSelected(null);

          if (result.altosaProductId) {
            openProduct(String(result.altosaProductId));
          } else {
            toast.warning(
              'El producto se agregó localmente, pero Altosa no confirmó el registro. Revisa la sincronización.'
            );
            close();
          }
        },
      }
    );
  };

  const showEmpty = debouncedQuery.length >= 2 && !search.isFetching && available.length === 0;

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-slate-100">
            <PackageSearch className="h-4 w-4 text-blue-600" />
            Buscar en Contifico
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            Busca por nombre o SKU. Solo se agregará el producto que elijas.
          </p>
        </div>
      </div>

      <div className="relative mt-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar en Contifico por nombre o SKU…"
          className="bg-white pl-9 pr-9 dark:bg-slate-900"
          autoFocus
        />
        {search.isFetching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-blue-600" />
        )}
      </div>

      {debouncedQuery.length < 2 ? (
        <p className="mt-3 text-xs text-gray-500 dark:text-slate-400">
          Escribe al menos 2 caracteres para buscar una sugerencia.
        </p>
      ) : search.isError ? (
        <p className="mt-3 text-xs text-red-600 dark:text-red-400">
          {getApiErrorMessage(search.error, 'No se pudo consultar Contifico.')}
        </p>
      ) : showEmpty ? (
        <p className="mt-3 text-xs text-gray-500 dark:text-slate-400">
          {alreadyAdded.length > 0
            ? 'Ese producto ya está en tu catálogo.'
            : 'No se encontraron productos en Contifico con ese nombre o SKU.'}
        </p>
      ) : available.length > 0 ? (
        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
          {available.map((suggestion) => (
            <div
              key={suggestion.contificoId}
              className="flex items-start justify-between gap-3 rounded-lg border border-blue-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium text-gray-900 dark:text-slate-100">
                    {suggestion.name}
                  </span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    Sugerencia Contifico
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-slate-400">
                  <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
                    {suggestion.sku}
                  </span>
                  {suggestion.category && <span>{suggestion.category}</span>}
                  <span>Stock: {suggestion.stock.toLocaleString('es-EC')}</span>
                  {suggestion.price !== null && (
                    <span>${suggestion.price.toFixed(2)}</span>
                  )}
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => setSelected(suggestion)}
                className="shrink-0 gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      {available.length > 0 && alreadyAdded.length > 0 && (
        <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
          {alreadyAdded.length} resultado(s) ya están en tu catálogo y se omitieron.
        </p>
      )}

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open && !importProduct.isPending) {
            setSelected(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sugerencia de Contifico</DialogTitle>
            <DialogDescription>
              ¿Deseas agregar «{selected?.name}» (SKU {selected?.sku}) a tu catálogo? Se
              importará la información de Contifico y podrás editarla después.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={importProduct.isPending}
              onClick={() => setSelected(null)}
              className="border-gray-300 text-gray-700 dark:border-slate-700 dark:text-slate-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={importProduct.isPending}
              className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
            >
              {importProduct.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {importProduct.isPending ? 'Agregando…' : 'Agregar producto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
