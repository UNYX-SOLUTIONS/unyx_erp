'use client';

import { cn } from '@/lib/utils';

interface ColorInputProps {
  color: string;
  label: string;
  onLabelChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function ColorInput({
  color,
  label,
  onLabelChange,
  placeholder = 'Ej: Taupe',
  className,
}: ColorInputProps) {
  return (
    <div
      className={cn(
        'flex h-10 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100',
        className
      )}
    >
      <span
        className="h-5 w-5 shrink-0 rounded-full border border-gray-200"
        style={{ backgroundColor: color }}
      />
      <input
        value={label}
        onChange={(event) => onLabelChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
      />
    </div>
  );
}
