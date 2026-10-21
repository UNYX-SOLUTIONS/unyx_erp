'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, PackageSearch, Plus, Search, X } from 'lucide-react';
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
    placeholderData: (previousData) => previousData,
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

  const hasQuery = query.trim().length >= 2;
  const showDropdown =
    hasQuery && (search.isFetching || search.isError || search.data !== undefined);
  const showSkeleton = search.isFetching && suggestions.length === 0;

  return (
    <div className="relative rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
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

      <div className="relative mt-3 h-10">
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
          <Search className="h-4 w-4" />
        </div>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar en Contifico por nombre o SKU…"
          className="h-10 bg-white pl-9 pr-10 dark:bg-slate-900"
          autoFocus
        />
        {search.isFetching ? (
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          </div>
        ) : query ? (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-1 top-0 flex h-10 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-slate-200"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Altura estable: evita que el formulario manual salte al buscar. */}
      <p className="mt-2 min-h-[1rem] text-xs text-gray-500 dark:text-slate-400">
        {hasQuery ? ' ' : 'Escribe al menos 2 caracteres para buscar una sugerencia.'}
      </p>

      {showDropdown && (
        <div className="absolute left-4 right-4 top-full z-30 mt-2 max-h-80 overflow-y-auto rounded-xl border border-blue-100 bg-white p-2 shadow-xl animate-in fade-in-0 slide-in-from-top-1 duration-150 dark:border-slate-800 dark:bg-slate-900">
          {showSkeleton ? (
            <div className="space-y-2 p-1">
              <div className="h-16 animate-pulse rounded-lg bg-blue-50 dark:bg-slate-800" />
              <div className="h-16 animate-pulse rounded-lg bg-blue-50 dark:bg-slate-800" />
            </div>
          ) : search.isError ? (
            <p className="px-2 py-3 text-xs text-red-600 dark:text-red-400">
              {getApiErrorMessage(search.error, 'No se pudo consultar Contifico.')}
            </p>
          ) : available.length === 0 ? (
            <p className="px-2 py-3 text-xs text-gray-500 dark:text-slate-400">
              {alreadyAdded.length > 0
                ? 'Ese producto ya está en tu catálogo.'
                : 'No se encontraron productos en Contifico con ese nombre o SKU.'}
            </p>
          ) : (
            <div className="space-y-2">
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
              {alreadyAdded.length > 0 && (
                <p className="px-1 pb-1 pt-0.5 text-xs text-gray-500 dark:text-slate-400">
                  {alreadyAdded.length} resultado(s) ya están en tu catálogo y se omitieron.
                </p>
              )}
            </div>
          )}
        </div>
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
