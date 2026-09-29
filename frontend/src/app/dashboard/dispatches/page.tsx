import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Despachos y entregas',
};

export default function DispatchesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">Despachos y entregas</h1>
        <p className="text-sm text-gray-500">Despacho, rutas y seguimiento de entregas</p>
      </div>
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white text-sm text-gray-400">
        Módulo en construcción.
      </div>
    </div>
  );
}
