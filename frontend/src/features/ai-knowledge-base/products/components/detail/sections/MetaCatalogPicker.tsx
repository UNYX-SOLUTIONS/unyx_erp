'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ImageIcon, Loader2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getApiErrorMessage } from '@/lib/utils';
import { searchMetaCatalog } from '../../../api/products.api';
import type { MetaCatalogItem } from '../../../types/product.types';

interface MetaCatalogPickerProps {
  selectedRetailerId: string | null;
  isSaving?: boolean;
  onSelect: (item: MetaCatalogItem) => void;
}

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function normalizeRetailerId(value: string): string {
  return value.trim().toLowerCase();
}

export function MetaCatalogPicker({
  selectedRetailerId,
  isSaving = false,
  onSelect,
}: MetaCatalogPickerProps) {
  const [search, setSearch] = useState('');
  const trimmedSearch = search.trim();
  const effectiveSearch = trimmedSearch.length >= 2 ? trimmedSearch : '';
  const debouncedSearch = useDebouncedValue(effectiveSearch);
  const isTooShort = trimmedSearch.length === 1;

  const itemsQuery = useQuery({
    queryKey: ['meta-catalog-search', debouncedSearch],
    queryFn: () => searchMetaCatalog(debouncedSearch, 30),
    enabled: debouncedSearch.length >= 2,
    staleTime: 60_000,
    placeholderData: (previousData) => previousData,
  });

  const items = itemsQuery.data?.data.items ?? [];
  const hasSearch = debouncedSearch.length >= 2;
  const isInitialLoading = itemsQuery.isFetching && items.length === 0;
  const selectedKey = selectedRetailerId
    ? normalizeRetailerId(selectedRetailerId)
    : null;

  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-500 dark:text-slate-400">
        Busca por nombre o Retailer ID. Asignar un ítem deja el mapeo manual y bloqueado.
      </p>

      <div className="relative mt-3 h-10">
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
          <Search className="h-4 w-4" />
        </div>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Ej. WC-240482 o nombre del producto…"
          maxLength={80}
          className="h-10 bg-white pl-9 pr-9 dark:bg-slate-900"
          autoFocus
        />
        {search ? (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-1 top-0 flex h-10 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-slate-200"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        ) : itemsQuery.isFetching ? (
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          </div>
        ) : null}
      </div>

      {isTooShort && (
        <p className="mt-1.5 text-[11px] text-gray-400 dark:text-slate-500">
          Escribe al menos 2 caracteres para buscar.
        </p>
      )}

      <div className="mt-3 max-h-80 min-w-0 space-y-2 overflow-y-auto overflow-x-hidden pr-1">
        {!hasSearch ? (
          <div className="rounded-lg border border-dashed border-emerald-200 px-3 py-4 text-center dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Escribe el nombre o el Retailer ID del ítem de Meta.
            </p>
          </div>
        ) : isInitialLoading ? (
          <div className="space-y-2" aria-busy="true" aria-label="Buscando en el catálogo Meta">
            <div className="h-20 animate-pulse rounded-lg bg-emerald-50 dark:bg-slate-800" />
            <div className="h-20 animate-pulse rounded-lg bg-emerald-50 dark:bg-slate-800" />
            <div className="h-20 animate-pulse rounded-lg bg-emerald-50 dark:bg-slate-800" />
          </div>
        ) : itemsQuery.isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/20">
            <p className="text-xs text-red-600 dark:text-red-400">
              {getApiErrorMessage(
                itemsQuery.error,
                'No se pudo consultar el catálogo de Meta.'
              )}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void itemsQuery.refetch()}
              className="mt-2 border-red-200 text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:text-red-300"
            >
              Reintentar
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-emerald-200 px-3 py-4 text-center dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-slate-400">
              No se encontraron ítems para “{debouncedSearch}”.
            </p>
          </div>
        ) : (
          items.map((item) => {
            const isSelected =
              selectedKey !== null &&
              normalizeRetailerId(item.retailerId) === selectedKey;
            return (
              <div
                key={item.retailerId}
                className="flex w-full min-w-0 items-start justify-between gap-3 rounded-lg border border-emerald-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex min-w-0 gap-3">
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-gray-50 dark:border-slate-800 dark:bg-slate-800">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name || item.retailerId}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-gray-300 dark:text-slate-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium text-gray-900 dark:text-slate-100">
                        {item.name || '(Sin nombre)'}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        {item.retailerId}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                      {item.price || 'Sin precio'}
                      {item.availability ? ` · ${item.availability}` : ''}
                      {item.visibility ? ` · ${item.visibility}` : ''}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onSelect(item)}
                  disabled={isSaving || isSelected}
                  className="shrink-0 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-600 disabled:opacity-100"
                >
                  {isSelected ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Asignada
                    </>
                  ) : (
                    'Asignar'
                  )}
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
