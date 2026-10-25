'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Search,
  TriangleAlert,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getApiErrorMessage } from '@/lib/utils';
import {
  searchKommoTemplates,
  syncKommoTemplates,
  type KommoSyncResult,
} from '../../../api/products.api';
import type { KommoTemplateDto } from '../../../types/product.types';

interface KommoTemplatePickerProps {
  selectedId: string | null;
  onSelect: (template: KommoTemplateDto) => void;
}

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export function KommoTemplatePicker({
  selectedId,
  onSelect,
}: KommoTemplatePickerProps) {
  const [search, setSearch] = useState('');
  const [lastSync, setLastSync] = useState<KommoSyncResult | null>(null);
  const trimmedSearch = search.trim();
  const effectiveSearch = trimmedSearch.length >= 2 ? trimmedSearch : '';
  const debouncedSearch = useDebouncedValue(effectiveSearch);
  const isTooShort = trimmedSearch.length === 1;
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ['kommo-templates', debouncedSearch],
    queryFn: () => searchKommoTemplates(debouncedSearch || undefined, 50),
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });

  const templates = useMemo(() => templatesQuery.data?.data ?? [], [templatesQuery.data]);
  const hasSearch = debouncedSearch.length >= 2;
  const isInitialLoading = templatesQuery.isFetching && templates.length === 0;

  const syncMutation = useMutation({
    mutationFn: syncKommoTemplates,
    onSuccess: (response) => {
      setLastSync(response.data);
      void queryClient.invalidateQueries({ queryKey: ['kommo-templates'] });
      toast.success(
        `Plantillas de Kommo sincronizadas: ${response.data.fetched} leídas`
      );
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, 'No se pudieron sincronizar las plantillas de Kommo')
      );
    },
  });

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Busca por nombre, contenido o ID y asigna la plantilla a esta variante.
          </p>
          {!isInitialLoading && templates.length > 0 && (
            <p className="mt-0.5 text-[11px] text-gray-400 dark:text-slate-500">
              {templates.length} {hasSearch ? 'resultado' : 'plantilla'}
              {templates.length === 1 ? '' : 's'}
              {templates.length === 50 ? ' (máx. 50)' : ''}
              {templatesQuery.isFetching ? ' · actualizando…' : ''}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="gap-1.5 border-blue-200 bg-white text-blue-700 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-blue-300"
        >
          {syncMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {syncMutation.isPending ? 'Sincronizando…' : 'Sincronizar'}
        </Button>
      </div>

      {lastSync && !syncMutation.isPending && (
        <div className="mt-3 flex min-w-0 items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 break-words">
            Sincronizado: {lastSync.fetched} leídas · {lastSync.created} nuevas ·{' '}
            {lastSync.updated} actualizadas
            {lastSync.unchanged > 0 ? ` · ${lastSync.unchanged} sin cambios` : ''}
            {lastSync.deactivated > 0
              ? ` · ${lastSync.deactivated} desactivadas`
              : ''}
          </span>
        </div>
      )}

      {syncMutation.isError && (
        <div className="mt-3 flex min-w-0 items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 break-words">
            {getApiErrorMessage(
              syncMutation.error,
              'No se pudieron sincronizar las plantillas.'
            )}
          </span>
        </div>
      )}

      <div className="relative mt-3 h-10">
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
          <Search className="h-4 w-4" />
        </div>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre, contenido o ID…"
          maxLength={120}
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
        ) : templatesQuery.isFetching ? (
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          </div>
        ) : null}
      </div>

      {isTooShort && (
        <p className="mt-1.5 text-[11px] text-gray-400 dark:text-slate-500">
          Escribe al menos 2 caracteres para filtrar.
        </p>
      )}

      <div className="mt-3 max-h-80 min-w-0 space-y-2 overflow-y-auto overflow-x-hidden pr-1">
        {isInitialLoading ? (
          <div className="space-y-2" aria-busy="true" aria-label="Cargando plantillas">
            <div className="h-16 animate-pulse rounded-lg bg-blue-50 dark:bg-slate-800" />
            <div className="h-16 animate-pulse rounded-lg bg-blue-50 dark:bg-slate-800" />
            <div className="h-16 animate-pulse rounded-lg bg-blue-50 dark:bg-slate-800" />
          </div>
        ) : templatesQuery.isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/20">
            <p className="text-xs text-red-600 dark:text-red-400">
              {getApiErrorMessage(
                templatesQuery.error,
                'No se pudieron cargar las plantillas de Kommo.'
              )}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void templatesQuery.refetch()}
              className="mt-2 border-red-200 text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:text-red-300"
            >
              Reintentar
            </Button>
          </div>
        ) : templates.length === 0 ? (
          <div className="rounded-lg border border-dashed border-blue-200 px-3 py-4 text-center dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {hasSearch
                ? `No se encontraron plantillas para “${debouncedSearch}”.`
                : 'No hay plantillas sincronizadas todavía.'}
            </p>
            {!hasSearch && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                className="mt-2 gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-slate-700 dark:text-blue-300"
              >
                {syncMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Sincronizar ahora
              </Button>
            )}
          </div>
        ) : (
          templates.map((template) => {
            const isSelected = selectedId === template.id;
            return (
              <div
                key={template.id}
                className="flex w-full min-w-0 items-start justify-between gap-3 rounded-lg border border-blue-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium text-gray-900 dark:text-slate-100">
                      {template.name}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {template.type}
                    </span>
                    {template.isActive === false && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        Inactiva
                      </span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 whitespace-pre-line text-xs text-gray-500 dark:text-slate-400">
                    {template.content || 'Sin contenido'}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onSelect(template)}
                  disabled={isSelected}
                  className="shrink-0 gap-1.5 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-emerald-600 disabled:opacity-100"
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
