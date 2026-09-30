import type { Metadata } from 'next';
import { AttentionTable } from '@/features/dashboard/components/AttentionTable';
import { DeliveryTimeline } from '@/features/dashboard/components/DeliveryTimeline';
import { InventoryAlerts } from '@/features/dashboard/components/InventoryAlerts';
import { KpiGrid } from '@/features/dashboard/components/KpiGrid';
import { PreparationTable } from '@/features/dashboard/components/PreparationTable';

export const metadata: Metadata = {
  title: 'Dashboard operativo',
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">Dashboard operativo</h1>
        <p className="text-sm text-gray-500">Pedidos, inventario y entregas</p>
      </div>

      <KpiGrid />

      <AttentionTable />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <PreparationTable className="xl:col-span-2" />
        <DeliveryTimeline />
        <InventoryAlerts className="xl:col-span-2" />
      </div>
    </div>
  );
}
