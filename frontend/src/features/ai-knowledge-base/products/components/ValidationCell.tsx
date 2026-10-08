import { StatusBadge } from '@/components/ui/status-badge';
import type { ProductStatus } from '../types/product.types';

const STATUS_BADGES: Record<
  ProductStatus,
  { label: string; variant: 'approved' | 'pending' | 'error' | 'neutral'; dot: boolean }
> = {
  approved: { label: 'Aprobado', variant: 'approved', dot: true },
  pending: { label: 'Pendiente', variant: 'pending', dot: true },
  needsCorrection: { label: 'Requiere corrección', variant: 'error', dot: true },
  noPrice: { label: 'Sin precio', variant: 'neutral', dot: false },
};

export function ValidationCell({ status }: { status: ProductStatus }) {
  const config = STATUS_BADGES[status];
  return (
    <StatusBadge variant={config.variant} dot={config.dot}>
      {config.label}
    </StatusBadge>
  );
}
