// frontend/src/features/orders/components/OrderStatusBadge.tsx

import { cn } from '@/lib/utils';
import { ORDER_STATUS_META, type OrderStatus } from '../types/order.types';

interface Props {
  status: OrderStatus;
  detail?: string;
  className?: string;
}

const COLOR_CLASSES: Record<string, string> = {
  gray:   'bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  blue:   'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-500/30',
  orange: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30',
  green:  'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30',
  red:    'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30',
  purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30',
};

export function OrderStatusBadge({ status, detail, className }: Props) {
  const meta = ORDER_STATUS_META[status];
  const colorClass = COLOR_CLASSES[meta.color];

  const text = detail ? `${meta.label} - ${detail}` : meta.label;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium',
        colorClass,
        className,
      )}
    >
      {status === 'WITH_ISSUE' && (
        <span className="text-red-600 font-bold dark:text-red-400">!</span>
      )}
      {text}
    </span>
  );
}
