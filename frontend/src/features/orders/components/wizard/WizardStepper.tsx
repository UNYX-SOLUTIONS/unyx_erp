// frontend/src/features/orders/components/wizard/WizardStepper.tsx

'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, label: 'Cliente' },
  { id: 2, label: 'Productos' },
  { id: 3, label: 'Entrega' },
  { id: 4, label: 'Confirmar' },
] as const;

interface Props {
  current: 1 | 2 | 3 | 4;
}

export function WizardStepper({ current }: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const isCompleted = step.id < current;
          const isActive = step.id === current;

          return (
            <div key={step.id} className="flex flex-1 items-center">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                    isCompleted && 'border-blue-600 bg-blue-600 text-white',
                    isActive && 'border-blue-600 bg-blue-600 text-white',
                    !isCompleted &&
                      !isActive &&
                      'border-gray-300 bg-white text-gray-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-500',
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <span
                  className={cn(
                    'text-sm font-medium',
                    isActive || isCompleted
                      ? 'text-gray-900 dark:text-slate-100'
                      : 'text-gray-400 dark:text-slate-500',
                  )}
                >
                  {step.label}
                </span>
              </div>

              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    'mx-4 h-0.5 flex-1 rounded-full',
                    step.id < current ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-700',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
