'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, RefreshCw, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePermission } from '@/hooks/usePermission';
import { formatLastUpdate } from '@/lib/formatters';
import {
  useExternalHealth,
  useRefreshExternalHealth,
  useRepairExternalMapping,
} from '../hooks/useExternalHealth';
import type {
  ExternalHealthItem,
  ExternalHealthStatus,
  ExternalRepairAction,
  ExternalRepairSource,
} from '../types/product.types';

interface ExternalHealthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function statusChip(
  label: string,
  tone: 'ok' | 'warning' | 'danger' | 'neutral'
) {
  const classes =
    tone === 'ok'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300'
        : tone === 'danger'
          ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300'
          : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300';
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${classes}`}
    >
      {label}
    </span>
  );
}

function contificoChip(status: ExternalHealthStatus) {
  switch (status) {
    case 'missing':
      return statusChip('Contifico eliminado', 'danger');
    case 'inactive':
      return statusChip('Contifico inactivo', 'warning');
    case 'mismatch':
      return statusChip('Contifico desactualizado', 'warning');
    case 'unknown':
      return statusChip('Contifico sin validar', 'neutral');
    default:
      return statusChip('Contifico OK', 'ok');
  }
}

function metaChip(status: ExternalHealthStatus) {
  switch (status) {
    case 'missing':
      return statusChip('Meta eliminado', 'danger');
    case 'unknown':
      return statusChip('Meta sin validar', 'neutral');
    default:
      return statusChip('Meta OK', 'ok');
  }
}

export function ExternalHealthDialog({
  open,
  onOpenChange,
}: ExternalHealthDialogProps) {
  const { can } = usePermission();
  const canRepair = can('products.update');
  const healthQuery = useExternalHealth();
  const refreshHealth = useRefreshExternalHealth();
  const repair = useRepairExternalMapping();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const data = healthQuery.data?.data;
  const items = data?.items ?? [];
  const warnings = data?.warnings ?? [];
  const isRefreshing = refreshHealth.isPending;

  const repairItem = (
    item: ExternalHealthItem,
    source: ExternalRepairSource,
    action: ExternalRepairAction
  ) => {
    const key = `${item.variantId}:${source}:${action}`;
    setPendingKey(key);
    repair.mutate(
      { variantId: item.variantId, source, action },
      { onSettled: () => setPendingKey(null) }
    );
  };

  const actionButton = (
    item: ExternalHealthItem,
    source: ExternalRepairSource,
    action: ExternalRepairAction,
    label: string
  ) => {
    if (!canRepair) {
      return null;
    }
    const key = `${item.variantId}:${source}:${action}`;
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={repair.isPending}
        onClick={() => repairItem(item, source, action)}
        className="h-7 gap-1 border-blue-200 bg-blue-50/60 px-2 text-xs text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
      >
        {pendingKey === key ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : null}
        {label}
      </Button>
    );
  };

  const unmapButton = (
    item: ExternalHealthItem,
    source: ExternalRepairSource,
    label: string
  ) => {
    if (!canRepair) {
      return null;
    }
    const key = `${item.variantId}:${source}:unmap`;
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={repair.isPending}
        onClick={() => repairItem(item, source, 'unmap')}
        className="h-7 px-2 text-xs text-gray-500 hover:text-rose-600 dark:text-slate-400"
      >
        {pendingKey === key ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : null}
        {label}
      </Button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            Salud de mapeos externos
          </DialogTitle>
          <DialogDescription>
            Detecta variantes mapeadas a Meta o Contifico que fueron eliminadas,
            desactivadas o cuyo ID quedó desactualizado en el catálogo externo.
          </DialogDescription>
        </DialogHeader>

        {data && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600 dark:bg-slate-800 dark:text-slate-300">
              {data.counts.totalIssues} incidencia(s)
            </span>
            {data.counts.contificoMissing > 0 && (
              <span className="rounded-full bg-rose-50 px-2.5 py-1 font-medium text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                Contifico faltantes: {data.counts.contificoMissing}
              </span>
            )}
            {data.counts.contificoInactive > 0 && (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                Contifico inactivos: {data.counts.contificoInactive}
              </span>
            )}
            {data.counts.contificoMismatch > 0 && (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                Contifico desactualizados: {data.counts.contificoMismatch}
              </span>
            )}
            {data.counts.metaMissing > 0 && (
              <span className="rounded-full bg-rose-50 px-2.5 py-1 font-medium text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                Meta faltantes: {data.counts.metaMissing}
              </span>
            )}
            {data.checkedAt && (
              <span className="text-gray-400 dark:text-slate-500">
                Validado {formatLastUpdate(data.checkedAt)}
              </span>
            )}
          </div>
        )}

        {warnings.length > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300">
            {warnings.join(' ')}
          </div>
        )}

        <div className="max-h-[55vh] min-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-slate-800">
          {healthQuery.isLoading ? (
            <div className="flex h-48 items-center justify-center gap-2 text-sm text-gray-500 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Validando mapeos contra Meta y Contifico…
            </div>
          ) : healthQuery.isError ? (
            <div className="flex h-48 items-center justify-center px-6 text-center text-sm text-red-600">
              No se pudo validar la salud de los mapeos.
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 px-6 text-center text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-7 w-7" />
              <p className="font-medium">Todos los mapeos están sanos.</p>
              {healthQuery.isFetching && (
                <span className="text-xs text-gray-500">Revalidando…</span>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-slate-800">
              {items.map((item) => (
                <li key={item.variantId} className="px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                        {item.productName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {item.variantName || 'Variante'}
                        {item.sku ? ` · ${item.sku}` : ''}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {item.contificoId && contificoChip(item.contifico)}
                        {item.metaRetailerId && metaChip(item.meta)}
                      </div>
                    </div>

                    {canRepair && (
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {item.contifico === 'missing' &&
                          actionButton(
                            item,
                            'contifico',
                            'recreate',
                            'Recrear en Contifico'
                          )}
                        {item.contifico === 'mismatch' &&
                          actionButton(
                            item,
                            'contifico',
                            'recreate',
                            'Actualizar mapeo Contifico'
                          )}
                        {item.contifico === 'inactive' &&
                          actionButton(
                            item,
                            'contifico',
                            'reactivate',
                            'Reactivar en Contifico'
                          )}
                        {item.meta === 'missing' &&
                          actionButton(
                            item,
                            'meta',
                            'republish',
                            'Republicar en Meta'
                          )}
                        {item.contificoId &&
                          unmapButton(item, 'contifico', 'Quitar Contifico')}
                        {item.metaRetailerId &&
                          unmapButton(item, 'meta', 'Quitar Meta')}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => refreshHealth.mutate()}
            disabled={isRefreshing || healthQuery.isFetching}
            className="gap-1.5 border-gray-300 text-gray-700 dark:border-slate-700 dark:text-slate-300"
          >
            <RefreshCw
              className={isRefreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'}
            />
            Revalidar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-300 text-gray-700 dark:border-slate-700 dark:text-slate-300"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
