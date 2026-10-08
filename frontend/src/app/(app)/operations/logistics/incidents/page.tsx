import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Incidencias',
};

export default function IncidentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-slate-100">Incidencias</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">Registro y seguimiento de incidencias operativas</p>
      </div>
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white dark:bg-slate-900 text-sm text-gray-400 dark:text-slate-500">
        Módulo en construcción.
      </div>
    </div>
  );
}
