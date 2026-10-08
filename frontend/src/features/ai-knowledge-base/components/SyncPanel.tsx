import { ExternalLink, RefreshCw } from 'lucide-react';
import { BadgeDot } from '@/components/ui/badge-dot';
import { Button } from '@/components/ui/button';
import { SYNC_ITEMS, SYNC_LAST_AT } from '../data/mock';
import { SyncStatusBadge } from './SyncStatusBadge';

export function SyncPanel({ className }: { className?: string }) {
  return (
    <section className={className}>
      <div className="flex h-full flex-col rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <header className="flex items-start justify-between border-b border-gray-100 dark:border-slate-800 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Sincronización de conocimiento</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
              Canal directo entre inventario y respuestas de asistente comerciales
            </p>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400">
            <RefreshCw className="h-4 w-4" />
          </span>
        </header>

        <div className="mx-5 mt-4 rounded-lg border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/60 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
            Última sincronización
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-slate-100">{SYNC_LAST_AT}</p>
          <BadgeDot label="Operativo y actualizado" tone="green" className="mt-2" />
        </div>

        <ul className="flex-1 divide-y divide-gray-100 dark:divide-slate-800 px-5">
          {SYNC_ITEMS.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400">
                <item.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-slate-100">{item.label}</p>
                <p className="truncate text-xs text-gray-500 dark:text-slate-400">{item.description}</p>
              </div>
              <SyncStatusBadge status={item.status} />
            </li>
          ))}
        </ul>

        <footer className="border-t border-gray-100 dark:border-slate-800 px-5 py-3">
          <Button variant="outline" size="sm" className="gap-1.5 border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300">
            <ExternalLink className="h-3.5 w-3.5" />
            Ver detalles
          </Button>
        </footer>
      </div>
    </section>
  );
}
