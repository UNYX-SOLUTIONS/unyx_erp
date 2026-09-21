'use client';

import { useMemo } from 'react';
import { Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StockBadgeProps {
  quantity: number;
  minStock?: number;
}

export function StockBadge({ quantity, minStock = 0 }: StockBadgeProps) {
  const variant = useMemo(() => {
    if (quantity <= 0) {
      return 'destructive' as const;
    }
    if (quantity <= minStock) {
      return 'warning' as const;
    }
    return 'success' as const;
  }, [quantity, minStock]);

  const label = quantity <= 0 ? 'Agotado' : quantity <= minStock ? 'Stock bajo' : 'En stock';

  return (
    <Badge variant={variant} className="gap-1">
      <Package className="h-3 w-3" />
      {label}
    </Badge>
  );
}
