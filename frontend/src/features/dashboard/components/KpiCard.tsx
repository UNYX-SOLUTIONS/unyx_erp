import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type { DashboardKpi } from '../types/dashboard-types';

interface KpiCardProps {
  kpi: DashboardKpi;
}

export function KpiCard({ kpi }: KpiCardProps) {
  const Icon = kpi.icon;

  return (
    <div className="flex items-start justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-gray-500">{kpi.label}</p>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-2xl font-semibold text-gray-900">{kpi.value}</span>
          {kpi.trend === 'positive' && <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />}
          {kpi.trend === 'negative' && <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />}
        </div>
      </div>
      <Icon className="h-5 w-5 shrink-0 text-gray-400" />
    </div>
  );
}
