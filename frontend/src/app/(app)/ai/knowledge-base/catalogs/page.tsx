import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Catálogos IA',
};

export default function KnowledgeCatalogsPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-slate-100">Catálogos</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">Catálogos comerciales vigentes para la IA</p>
      </div>
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white dark:bg-slate-900 text-sm text-gray-400 dark:text-slate-500">
        Próximamente
      </div>
    </div>
  );
}
