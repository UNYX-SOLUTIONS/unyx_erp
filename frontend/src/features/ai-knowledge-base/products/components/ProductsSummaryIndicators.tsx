'use client';

import { useProducts } from '../hooks/useProducts';

export function ProductsSummaryIndicators() {
  const totalQuery = useProducts({ page: 1, limit: 1 });
  const pendingQuery = useProducts({ page: 1, limit: 1, validation: 'PENDIENTE' });

  const total = totalQuery.data?.meta?.total;
  const pending = pendingQuery.data?.meta?.total;

  return (
    <>
      <span className="flex items-center gap-2 text-sm text-gray-700">
        <span className="h-2 w-2 rounded-full bg-green-500" />
        {total ?? '—'} productos registrados
      </span>
      <span className="flex items-center gap-2 text-sm text-gray-700">
        <span className="h-2 w-2 rounded-full bg-yellow-400" />
        {pending ?? '—'} pendientes de revisión
      </span>
    </>
  );
}
