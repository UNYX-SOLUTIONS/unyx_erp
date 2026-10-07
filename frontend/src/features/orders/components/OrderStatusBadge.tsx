// frontend/src/features/orders/components/OrderStatusBadge.tsx

import { cn } from '@/lib/utils';
import { ORDER_STATUS_META, type OrderStatus } from '../types/order.types';

interface Props {
  status: OrderStatus;
  detail?: string;
  className?: string;
}

const COLOR_CLASSES: Record<string, string> = {
  gray:   'bg-gray-100 text-gray-700 border-gray-200',
  blue:   'bg-blue-50 text-blue-700 border-blue-200',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  green:  'bg-green-50 text-green-700 border-green-200',
  red:    'bg-red-50 text-red-700 border-red-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
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
        <span className="text-red-600 font-bold">!</span>
      )}
      {text}
    </span>
  );
}