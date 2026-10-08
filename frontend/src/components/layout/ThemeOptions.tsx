'use client';

import type { LucideIcon } from 'lucide-react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore, type Theme } from '@/stores/ui-store';

const OPTIONS: { value: Theme; label: string; icon: LucideIcon }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
];

export function ThemeOptions() {
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);

  return (
    <div className="space-y-0.5" role="radiogroup" aria-label="Tema">
      {OPTIONS.map((option) => {
        const isActive = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(option.value)}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
              isActive
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
            )}
          >
            <option.icon className="h-3.5 w-3.5" aria-hidden="true" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
