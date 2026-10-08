// frontend/src/features/orders/components/wizard/OrderTotalsSummary.tsx

'use client';

import { cn } from '@/lib/utils';
import { IVA_RATE } from '../../stores/newOrder.store';
import type { OrderTotals } from '../../types/order.types';

export function OrderTotalsSummary({ totals }: { totals: OrderTotals }) {
  return (
    <div className="space-y-2">
      <Row label="Subtotal" value={totals.subtotal} />
      <Row label="Descuento" value={-totals.discount} muted />
      <Row label="Base imponible" value={totals.base} />
      <Row label={`IVA (${Math.round(IVA_RATE * 100)}%)`} value={totals.iva} muted />
      <div className="border-t border-gray-200 pt-2 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">TOTAL</span>
          <span className="text-base font-bold text-gray-900 dark:text-slate-100">
            ${totals.total.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600 dark:text-slate-400">{label}</span>
      <span
        className={cn(
          'text-sm font-medium',
          muted ? 'text-gray-500 dark:text-slate-400' : 'text-gray-900 dark:text-slate-100'
        )}
      >
        ${value.toFixed(2)}
      </span>
    </div>
  );
}
