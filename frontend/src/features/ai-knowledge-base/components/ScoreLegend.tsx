import { cn } from '@/lib/utils';
import { SCORE_LEGEND } from '../data/mock';

export function ScoreLegend() {
  return (
    <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
      {SCORE_LEGEND.map((item) => (
        <div key={item.id}>
          <div className="flex items-center gap-2">
            <span className={cn('h-2 w-2 shrink-0 rounded-full', item.dotClass)} />
            <span className="text-sm font-medium text-gray-700">{item.label}</span>
          </div>
          <p className="mt-1.5 text-sm font-semibold text-gray-900">{item.records}</p>
          {item.sublabel && <p className="mt-0.5 text-xs text-gray-400">{item.sublabel}</p>}
        </div>
      ))}
    </div>
  );
}
