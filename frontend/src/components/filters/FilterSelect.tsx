'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface FilterSelectOption {
  label: string;
  value: string;
}

interface FilterSelectProps {
  label: string;
  options: FilterSelectOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FilterSelect({ label, options, value, onChange, className }: FilterSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="whitespace-nowrap text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
        {label}:
      </span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={cn('h-10 border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900', className)}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
