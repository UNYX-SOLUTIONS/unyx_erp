import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Movimientos',
};

export default function MovementsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">Movimientos</h1>
        <p className="text-sm text-gray-500">Entradas, salidas y ajustes de inventario</p>
      </div>
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white text-sm text-gray-400">
        Módulo en construcción.
      </div>
    </div>
  );
}
