import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transferencias',
};

export default function TransfersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">Transferencias</h1>
        <p className="text-sm text-gray-500">Traslados de stock entre bodegas</p>
      </div>
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white text-sm text-gray-400">
        Módulo en construcción.
      </div>
    </div>
  );
}
