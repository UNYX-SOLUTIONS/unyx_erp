import { StatusBadge } from '@/components/ui/status-badge';
import { formatCurrency } from '@/lib/formatters';

interface PriceCellProps {
  price: number | null;
  priceFrom: boolean;
}

export function PriceCell({ price, priceFrom }: PriceCellProps) {
  if (price === null) {
    return <StatusBadge variant="neutral">Sin precio</StatusBadge>;
  }

  return (
    <div className="flex flex-col">
      {priceFrom && <span className="text-xs text-gray-500 dark:text-slate-400">Desde</span>}
      <span className="text-sm font-medium text-gray-900 dark:text-slate-100">{formatCurrency(price)}</span>
    </div>
  );
}
