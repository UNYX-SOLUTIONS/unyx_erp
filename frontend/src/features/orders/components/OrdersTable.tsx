// frontend/src/features/orders/components/OrdersTable.tsx

'use client';

import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Order } from '../types/order.types';
import { OrderStatusBadge } from './OrderStatusBadge';

interface Props {
  orders: Order[];
  onView: (order: Order) => void;
  onAction: (order: Order) => void;
}

export function OrdersTable({ orders, onView, onAction }: Props) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <table className="w-full">
        <thead className="border-b border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Pedido
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Cliente
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Fecha
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Total
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Estado
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Acción
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const isDraft = order.status === 'DRAFT';
            const hasIssue = order.status === 'WITH_ISSUE';

            return (
              <tr
                key={order.id}
                className="cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
                onClick={() => onView(order)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {order.id}
                    </span>
                    {isDraft && (
                      <span className="text-gray-400 dark:text-slate-500" title="Borrador">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <circle cx="3" cy="6" r="1.2" fill="currentColor" />
                          <circle cx="9" cy="6" r="1.2" fill="currentColor" />
                        </svg>
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-900 dark:text-slate-100">
                      {order.customer.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-slate-400">
                      {order.customer.ruc}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-700 dark:text-slate-300">
                    {order.dateLabel}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                    ${order.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={order.status} detail={order.statusDetail} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction(order);
                    }}
                    className={cn(
                      'inline-flex items-center gap-1 text-sm font-medium transition-colors',
                      hasIssue
                        ? 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300'
                        : 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300',
                    )}
                  >
                    {hasIssue ? (
                      <>
                        Resolver
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    ) : isDraft ? (
                      <>
                        Continuar
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    ) : (
                      <>
                        Ver pedido
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
