import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const detailInputClassName =
  'h-10 w-full rounded-md border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-gray-900 dark:text-slate-100 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

interface DetailFormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}

export function FormField({
  label,
  required = false,
  error,
  htmlFor,
  className,
  children,
}: DetailFormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400"
      >
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}
