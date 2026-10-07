// frontend/src/features/orders/components/OrderStatusTabs.tsx

'use client';

import { cn } from '@/lib/utils';
import type { OrderTabFilter } from '../types/order.types';

interface Props {
  active: OrderTabFilter;
  counts: Record<OrderTabFilter, number>;
  onChange: (tab: OrderTabFilter) => void;
}

const TABS: { id: OrderTabFilter; label: string; isAlert?: boolean }[] = [
  { id: 'ALL',          label: 'Todos' },
  { id: 'DRAFT',        label: 'Borradores' },
  { id: 'RESERVED',     label: 'Reservados' },
  { id: 'IN_PROGRESS',  label: 'En proceso' },
  { id: 'DELIVERED',    label: 'Entregados' },
  { id: 'WITH_ISSUE',   label: 'Con novedad', isAlert: true },
];

export function OrderStatusTabs({ active, counts, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
              tab.isAlert && !isActive && 'text-red-600',
            )}
          >
            {tab.isAlert && <span className="text-red-500 font-bold">!</span>}
            <span>{tab.label}</span>
            <span
              className={cn(
                'rounded-full px-1.5 text-xs',
                isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600',
                tab.isAlert && 'bg-red-50 text-red-600',
              )}
            >
              {counts[tab.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}