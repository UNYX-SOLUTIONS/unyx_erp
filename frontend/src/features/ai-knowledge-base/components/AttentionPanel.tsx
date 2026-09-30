import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ATTENTION_ITEMS } from '../data/mock';

export function AttentionPanel({ className }: { className?: string }) {
  return (
    <section className={className}>
      <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
        <header className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-900">Atención requerida</h2>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {ATTENTION_ITEMS.length}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Acciones recomendadas para priorizar las resoluciones de la IA.
          </p>
        </header>

        <ul className="flex-1 divide-y divide-gray-100">
          {ATTENTION_ITEMS.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-5 py-3.5">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.iconClass}`}
              >
                <item.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{item.title}</p>
                <p className="truncate text-xs text-gray-500">{item.subtitle}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-gray-300" />
            </li>
          ))}
        </ul>

        <footer className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
          <span className="text-xs text-gray-500">Prioridad operativa alta</span>
          <Link
            href="/dashboard/ai/knowledge-base/products"
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            Ver pendientes ({ATTENTION_ITEMS.length})
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </footer>
      </div>
    </section>
  );
}
