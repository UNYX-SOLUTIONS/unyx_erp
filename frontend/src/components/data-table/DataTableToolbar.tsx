import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DataTableToolbarProps {
  children: ReactNode;
  className?: string;
}

export function DataTableToolbar({ children, className }: DataTableToolbarProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4',
        className
      )}
    >
      {children}
    </div>
  );
}
