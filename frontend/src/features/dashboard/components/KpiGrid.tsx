import { DASHBOARD_KPIS } from '../data/mock';
import { KpiCard } from './KpiCard';

export function KpiGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {DASHBOARD_KPIS.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} />
      ))}
    </div>
  );
}
