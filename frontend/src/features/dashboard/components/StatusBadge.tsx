import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      color: {
        red: 'border-red-200 bg-red-50 text-red-700',
        orange: 'border-orange-200 bg-orange-50 text-orange-700',
        yellow: 'border-yellow-200 bg-yellow-50 text-yellow-700',
        green: 'border-green-200 bg-green-50 text-green-700',
        blue: 'border-blue-200 bg-blue-50 text-blue-700',
        gray: 'border-gray-200 bg-gray-100 text-gray-700',
      },
    },
    defaultVariants: {
      color: 'gray',
    },
  }
);

interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  label: string;
  className?: string;
}

export function StatusBadge({ label, color, className }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ color }), className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
