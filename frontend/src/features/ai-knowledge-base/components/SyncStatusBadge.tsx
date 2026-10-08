import { BadgeDot } from '@/components/ui/badge-dot';
import type { BadgeTone, SyncStatus } from '../types/knowledge-base-types';

const SYNC_STATUS_MAP: Record<SyncStatus, { label: string; tone: BadgeTone }> = {
  synced: { label: 'Sincronizado', tone: 'green' },
  pending: { label: 'Pendiente', tone: 'yellow' },
  error: { label: 'Con errores', tone: 'red' },
};

export function SyncStatusBadge({ status }: { status: SyncStatus }) {
  const { label, tone } = SYNC_STATUS_MAP[status];
  return <BadgeDot label={label} tone={tone} />;
}
