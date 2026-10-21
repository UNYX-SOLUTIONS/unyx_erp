'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getApiErrorMessage } from '@/lib/utils';
import { searchKommoTemplates, syncKommoTemplates } from '../../../api/products.api';
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
  const debouncedSearch = useDebouncedValue(search.trim());
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ['kommo-templates', debouncedSearch],
    queryFn: () => searchKommoTemplates(debouncedSearch || undefined),
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });

  const templates = useMemo(() => templatesQuery.data?.data ?? [], [templatesQuery.data]);

  const syncMutation = useMutation({
    mutationFn: syncKommoTemplates,
    onSuccess: (response) => {
      const result = response.data;
      void queryClient.invalidateQueries({ queryKey: ['kommo-templates'] });
      toast.success(
        `Plantillas de Kommo sincronizadas: ${result.fetched} leídas, ${result.created} nuevas, ${result.updated} actualizadas`
      );
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, 'No se pudieron sincronizar las plantillas de Kommo')
      );
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-gray-500 dark:text-slate-400">
          Busca por nombre o contenido y asigna la plantilla a esta variante.
        </p>
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
          Sincronizar
        </Button>
      </div>

      <div className="relative mt-3 h-10">
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
          <Search className="h-4 w-4" />
        </div>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar plantilla de Kommo…"
          className="h-10 bg-white pl-9 pr-9 dark:bg-slate-900"
          autoFocus
        />
        {templatesQuery.isFetching && (
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          </div>
        )}
      </div>

      <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
        {templatesQuery.isError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
            {getApiErrorMessage(
              templatesQuery.error,
              'No se pudieron cargar las plantillas de Kommo.'
            )}
          </p>
        ) : templates.length === 0 && !templatesQuery.isFetching ? (
          <p className="rounded-lg border border-dashed border-blue-200 px-3 py-3 text-xs text-gray-500 dark:border-slate-700 dark:text-slate-400">
            No hay plantillas sincronizadas. Usa <strong>Sincronizar</strong> para
            traerlas de Kommo.
          </p>
        ) : (
          templates.map((template) => {
            const isSelected = selectedId === template.id;
            return (
              <div
                key={template.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-blue-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium text-gray-900 dark:text-slate-100">
                      {template.name}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {template.type}
                    </span>
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
