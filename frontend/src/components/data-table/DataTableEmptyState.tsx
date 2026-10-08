import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataTableEmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function DataTableEmptyState({
  icon: Icon = Package,
  title = 'No se encontraron resultados',
  description = 'Ajusta los filtros o intenta con otra búsqueda.',
  action,
  className,
}: DataTableEmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-1.5 px-6 py-14 text-center', className)}>
      <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500">
        <Icon className="h-6 w-6" />
      </span>
      <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{title}</p>
      <p className="text-xs text-gray-500 dark:text-slate-400">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
