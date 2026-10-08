'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  className?: string;
  hasError?: boolean;
  id?: string;
}

export function CurrencyInput({
  value,
  onChange,
  onBlur,
  className,
  hasError = false,
  id,
}: CurrencyInputProps) {
  const [text, setText] = useState(() => value.toFixed(2));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setText(value.toFixed(2));
    }
  }, [value, isFocused]);

  return (
    <div
      className={cn(
        'flex h-10 items-center rounded-md border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-3 transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100',
        hasError && 'border-rose-500 ring-2 ring-rose-100',
        className
      )}
    >
      <span className="shrink-0 text-sm text-gray-400 dark:text-slate-500">$</span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={text}
        onFocus={() => setIsFocused(true)}
        onChange={(event) => {
          const raw = event.target.value;
          setText(raw);
          const parsed = Number(raw);
          if (!Number.isNaN(parsed)) {
            onChange(parsed);
          }
        }}
        onBlur={() => {
          setIsFocused(false);
          const parsed = Number(text);
          const safeValue = Number.isNaN(parsed) ? 0 : parsed;
          onChange(safeValue);
          setText(safeValue.toFixed(2));
          onBlur?.();
        }}
        className="h-full w-full bg-transparent pr-3 text-sm text-gray-900 dark:text-slate-100 outline-none"
      />
    </div>
  );
}
