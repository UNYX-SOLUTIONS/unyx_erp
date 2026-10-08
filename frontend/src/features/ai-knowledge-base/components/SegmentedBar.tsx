import { cn } from '@/lib/utils';
import type { SegmentedBarSegment } from '../types/knowledge-base-types';

interface SegmentedBarProps {
  segments: SegmentedBarSegment[];
  className?: string;
}

export function SegmentedBar({ segments, className }: SegmentedBarProps) {
  return (
    <div className={cn('flex h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800', className)}>
      {segments.map((segment) => (
        <div
          key={segment.label}
          title={segment.label}
          className={cn('h-full', segment.color)}
          style={{ width: `${segment.width}%` }}
        />
      ))}
    </div>
  );
}
