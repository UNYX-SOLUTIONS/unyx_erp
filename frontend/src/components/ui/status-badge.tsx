import type { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        approved: 'border-green-200 bg-green-50 text-green-700',
        pending: 'border-yellow-200 bg-yellow-50 text-yellow-700',
        error: 'border-red-200 bg-red-50 text-red-700',
        warning: 'border-orange-200 bg-orange-50 text-orange-700',
        info: 'border-blue-200 bg-blue-50 text-blue-700',
        neutral: 'border-gray-200 bg-gray-100 text-gray-500',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  }
);

type StatusBadgeVariant = NonNullable<VariantProps<typeof statusBadgeVariants>['variant']>;

const DOT_CLASSES: Record<StatusBadgeVariant, string> = {
  approved: 'bg-green-500',
  pending: 'bg-yellow-500',
  error: 'bg-red-500',
  warning: 'bg-orange-500',
  info: 'bg-blue-500',
  neutral: 'bg-gray-400',
};

interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  children: ReactNode;
  dot?: boolean;
  icon?: LucideIcon;
  className?: string;
}

export function StatusBadge({
  children,
  variant = 'neutral',
  dot = false,
  icon: Icon,
  className,
}: StatusBadgeProps) {
  const resolvedVariant: StatusBadgeVariant = variant ?? 'neutral';

  return (
    <span className={cn(statusBadgeVariants({ variant: resolvedVariant }), className)}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', DOT_CLASSES[resolvedVariant])} />}
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
}
