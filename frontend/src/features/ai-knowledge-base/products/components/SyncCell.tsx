import { Check, X } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import type { ProductSyncStatus } from '../types/product.types';

const SYNC_BADGES = {
  synced: { label: 'Sincronizado', variant: 'approved' as const, icon: Check },
  notSynced: { label: 'Sin sincronizar', variant: 'neutral' as const, icon: X },
};

export function SyncCell({ status }: { status: ProductSyncStatus }) {
  const config = SYNC_BADGES[status];
  return (
    <StatusBadge variant={config.variant} icon={config.icon}>
      {config.label}
    </StatusBadge>
  );
}
