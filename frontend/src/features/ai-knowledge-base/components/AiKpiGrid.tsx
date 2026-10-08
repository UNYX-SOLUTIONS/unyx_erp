import { AI_KPIS } from '../data/mock';
import { AiKpiCard } from './AiKpiCard';

export function AiKpiGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {AI_KPIS.map((kpi) => (
        <AiKpiCard key={kpi.id} kpi={kpi} />
      ))}
    </div>
  );
}
