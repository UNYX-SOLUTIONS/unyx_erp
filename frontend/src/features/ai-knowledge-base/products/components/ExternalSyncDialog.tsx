'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckSquare, Loader2, Plus, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/formatters';
import { getApiErrorMessage } from '@/lib/utils';
import {
  getExternalPending,
  importExternalItems,
} from '../api/products.api';
import type {
  ExternalPendingItem,
  ExternalSource,
} from '../types/product.types';

interface ExternalSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SourceFilter = ExternalSource | 'all';

const MAX_IMPORT_BATCH = 100;

function itemKey(item: ExternalPendingItem): string {
  return `${item.source}:${item.externalId}`;
}

export function ExternalSyncDialog({ open, onOpenChange }: ExternalSyncDialogProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [source, setSource] = useState<SourceFilter>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const pendingQuery = useQuery({
    queryKey: ['external-pending'],
    queryFn: () => getExternalPending({ limit: 1000 }),
    enabled: open,
    staleTime: 120_000,
    refetchOnWindowFocus: false,
  });

  const importMutation = useMutation({
    mutationFn: (items: ExternalPendingItem[]) => importExternalItems(items),
    onSuccess: (response) => {
      const result = response.data;
      toast.success(
        `${result.productsCreated} producto(s) y ${result.variantsCreated} variante(s) agregados. Quedan inactivos para revisión.`
      );
      if (result.errors.length > 0) {
        toast.warning(
          `${result.errors.length} ítem(s) no se pudieron importar. Revisa los detalles.`
        );
      }
      setSelected(new Set());
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      void queryClient.invalidateQueries({ queryKey: ['external-pending'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudieron importar los ítems externos'));
    },
  });

  const data = pendingQuery.data?.data;
  const items = useMemo(() => data?.items ?? [], [data]);
  const counts = data?.counts ?? { meta: 0, contifico: 0, total: 0 };
  const warnings = data?.warnings ?? [];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      if (source !== 'all' && !item.sources.includes(source)) {
        return false;
      }
      if (!term) {
        return true;
      }
      return [
        item.name,
        item.sku,
        item.externalId,
        item.metaRetailerId,
        item.contificoId,
        item.contificoSku,
        item.category,
      ]
        .filter(Boolean)
        .some((value) => (value as string).toLowerCase().includes(term));
    });
  }, [items, search, source]);

  const visibleKeys = useMemo(() => filtered.map(itemKey), [filtered]);
  const allVisibleSelected =
    visibleKeys.length > 0 && visibleKeys.every((key) => selected.has(key));

  const toggleItem = (item: ExternalPendingItem) => {
    const key = itemKey(item);
    if (!selected.has(key) && selected.size >= MAX_IMPORT_BATCH) {
      toast.warning(`Puedes importar máximo ${MAX_IMPORT_BATCH} ítems por lote.`);
      return;
    }
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelected((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        for (const key of visibleKeys) {
          next.delete(key);
        }
      } else {
        for (const key of visibleKeys) {
          if (next.size >= MAX_IMPORT_BATCH) {
            break;
          }
          next.add(key);
        }
      }
      return next;
    });
  };

  const selectedItems = useMemo(
    () => items.filter((item) => selected.has(itemKey(item))),
    [items, selected]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Sincronizar productos externos</DialogTitle>
          <DialogDescription>
            Ítems planos de Meta y Contífico que todavía no están en Altosa. Se crean
            como productos padre con sus variantes, inactivos para revisión.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[14rem] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, SKU o ID externo…"
              maxLength={80}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-1 rounded-md border border-gray-200 p-0.5 dark:border-slate-800">
            {(
              [
                ['all', `Todos (${counts.total})`],
                ['meta', `Meta (${counts.meta})`],
                ['contifico', `Contífico (${counts.contifico})`],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setSource(value)}
                className={
                  source === value
                    ? 'rounded bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'rounded px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }
              >
                {label}
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void pendingQuery.refetch()}
            disabled={pendingQuery.isFetching}
            className="gap-1.5 border-gray-300 text-gray-700 dark:border-slate-700 dark:text-slate-300"
          >
            <RefreshCw
              className={
                pendingQuery.isFetching
                  ? 'h-3.5 w-3.5 animate-spin'
                  : 'h-3.5 w-3.5'
              }
            />
            Actualizar
          </Button>
        </div>

        {warnings.length > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300">
            {warnings.join(' ')}
          </div>
        )}

        <div className="flex items-center justify-between border-b border-gray-100 pb-2 dark:border-slate-800">
          <button
            type="button"
            onClick={toggleAllVisible}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 text-xs font-medium text-gray-600 transition-colors hover:text-gray-900 disabled:opacity-50 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <CheckSquare className="h-4 w-4" />
            {allVisibleSelected ? 'Quitar selección' : 'Seleccionar visibles'}
          </button>
          <span className="text-xs text-gray-500 dark:text-slate-400">
            {selectedItems.length} seleccionado(s) · {counts.total} pendiente(s) ·
            máx. {MAX_IMPORT_BATCH} por lote
          </span>
        </div>

        <div className="max-h-[50vh] min-h-56 overflow-y-auto rounded-lg border border-gray-200 dark:border-slate-800">
          {pendingQuery.isLoading ? (
            <div className="flex h-56 items-center justify-center gap-2 text-sm text-gray-500 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Consultando Meta y Contífico…
            </div>
          ) : pendingQuery.isError ? (
            <div className="flex h-56 items-center justify-center px-6 text-center text-sm text-red-600">
              {getApiErrorMessage(
                pendingQuery.error,
                'No se pudieron consultar los ítems externos.'
              )}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-56 items-center justify-center px-6 text-center text-sm text-gray-500 dark:text-slate-400">
              No hay ítems pendientes con este filtro.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-slate-800">
              {filtered.map((item) => {
                const key = itemKey(item);
                return (
                  <li
                    key={key}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/40"
                  >
                    <Checkbox
                      checked={selected.has(key)}
                      onCheckedChange={() => toggleItem(item)}
                      aria-label={`Seleccionar ${item.name}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-slate-100">
                          {item.name}
                        </p>
                        {item.sources.map((itemSource) => (
                          <span
                            key={itemSource}
                            className={
                              itemSource === 'meta'
                                ? 'rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                : 'rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
                            }
                          >
                            {itemSource === 'meta' ? 'Meta' : 'Contífico'}
                          </span>
                        ))}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                        {item.contificoSku || item.sku || item.metaRetailerId || item.externalId}
                        {item.category ? ` · ${item.category}` : ''}
                        {item.stock !== null ? ` · ${item.stock} en stock` : ''}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-medium text-gray-900 dark:text-slate-100">
                      {item.price === null ? 'Sin precio' : formatCurrency(item.price)}
                    </span>
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
            className="border-gray-300 text-gray-700 dark:text-slate-300"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => importMutation.mutate(selectedItems)}
            disabled={selectedItems.length === 0 || importMutation.isPending}
            className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
          >
            {importMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Agregar al ERP ({selectedItems.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
