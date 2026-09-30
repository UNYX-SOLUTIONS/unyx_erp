import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeDotVariants = cva(
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      tone: {
        green: 'border-green-200 bg-green-50 text-green-700',
        yellow: 'border-yellow-200 bg-yellow-50 text-yellow-700',
        orange: 'border-orange-200 bg-orange-50 text-orange-700',
        red: 'border-red-200 bg-red-50 text-red-700',
        blue: 'border-blue-200 bg-blue-50 text-blue-700',
        gray: 'border-gray-200 bg-gray-100 text-gray-700',
      },
    },
    defaultVariants: {
      tone: 'gray',
    },
  }
);

interface BadgeDotProps extends VariantProps<typeof badgeDotVariants> {
  label: string;
  className?: string;
}

export function BadgeDot({ label, tone, className }: BadgeDotProps) {
  return (
    <span className={cn(badgeDotVariants({ tone }), className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
