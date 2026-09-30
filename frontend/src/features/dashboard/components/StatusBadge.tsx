import { BadgeDot } from '@/components/ui/badge-dot';
import type { StatusColor } from '../types/dashboard-types';

interface StatusBadgeProps {
  label: string;
  color?: StatusColor;
  className?: string;
}

export function StatusBadge({ label, color, className }: StatusBadgeProps) {
  return <BadgeDot label={label} tone={color} className={className} />;
}
