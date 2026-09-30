import { ArrowRight } from 'lucide-react';
import { BadgeDot } from '@/components/ui/badge-dot';
import type { AiKpi } from '../types/knowledge-base-types';

interface AiKpiCardProps {
  kpi: AiKpi;
}

export function AiKpiCard({ kpi }: AiKpiCardProps) {
  const Icon = kpi.icon;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-gray-500">
          <Icon className="h-4 w-4" />
          <span className="text-xs font-medium">{kpi.label}</span>
        </div>
        <ArrowRight className="h-4 w-4 text-gray-300" />
      </div>
      <p className="mt-3 text-2xl font-semibold text-gray-900">{kpi.value}</p>
      <BadgeDot label={kpi.badge} tone={kpi.badgeTone} className="mt-2" />
      <p className="mt-3 text-xs text-gray-500">{kpi.footer}</p>
    </div>
  );
}
