// frontend/src/features/orders/components/wizard/WizardStepper.tsx

'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNewOrderStore } from '../../stores/newOrder.store';

const STEPS = [
  { id: 1, label: 'Cliente', shortLabel: 'Cliente' },
  { id: 2, label: 'Productos', shortLabel: 'Productos' },
  { id: 3, label: 'Entrega', shortLabel: 'Entrega' },
  { id: 4, label: 'Confirmar', shortLabel: 'Confirmar' },
] as const;

type StepId = (typeof STEPS)[number]['id'];

export function WizardStepper() {
  const currentStep = useNewOrderStore((s) => s.currentStep);
  const setStep = useNewOrderStore((s) => s.setStep);
  const canProceed = useNewOrderStore((s) => s.canProceed);

  /**
   * Determina si se puede navegar a un paso específico.
   * Reglas:
   * - Es el paso actual → NO (no hace nada)
   * - Es un paso anterior → SÍ (siempre se puede volver)
   * - Es el paso inmediatamente siguiente → SÍ si canProceed() es true
   * - Es un paso futuro más lejano → NO
   */
  const canNavigateTo = (stepId: StepId): boolean => {
    if (stepId === currentStep) return false;
    if (stepId < currentStep) return true;
    if (stepId === currentStep + 1) return canProceed();
    return false;
  };

  const handleStepClick = (stepId: StepId) => {
    if (!canNavigateTo(stepId)) return;
    setStep(stepId);
  };

  return (
    <nav
      aria-label="Progreso del pedido"
      className={cn(
        'rounded-lg border border-gray-200 bg-white p-4 sm:p-5',
        'dark:border-slate-700 dark:bg-slate-900',
      )}
    >
      <ol className="flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const isCompleted = step.id < currentStep;
          const isActive = step.id === currentStep;
          const isClickable = canNavigateTo(step.id);
          const isLast = idx === STEPS.length - 1;

          return (
            <li
              key={step.id}
              className={cn('flex items-center', !isLast && 'flex-1')}
            >
              <button
                type="button"
                onClick={() => handleStepClick(step.id)}
                disabled={!isClickable}
                aria-current={isActive ? 'step' : undefined}
                aria-label={`Paso ${step.id}: ${step.label}${
                  isCompleted ? ' (completado)' : isActive ? ' (actual)' : ''
                }`}
                className={cn(
                  'group flex items-center gap-2 rounded-md px-1 py-1 text-left transition-colors sm:px-2',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40',
                  isClickable && 'cursor-pointer',
                  !isClickable && 'cursor-default',
                )}
              >
                {/* Círculo del paso */}
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all',
                    // Completado: azul relleno
                    isCompleted && 'border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/20',
                    // Actual: azul relleno + ring exterior
                    isActive &&
                      'border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/20 ring-4 ring-blue-500/15',
                    // Futuro: gris
                    !isCompleted &&
                      !isActive &&
                      'border-gray-300 bg-white text-gray-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-500',
                    // Hover sobre clickable
                    isClickable && !isActive && 'group-hover:border-blue-500',
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : step.id}
                </span>

                {/* Label del paso */}
                <span
                  className={cn(
                    'hidden whitespace-nowrap text-sm font-medium transition-colors sm:inline',
                    isActive || isCompleted
                      ? 'text-gray-900 dark:text-slate-100'
                      : 'text-gray-400 dark:text-slate-500',
                    isClickable && !isActive && 'group-hover:text-gray-700 dark:group-hover:text-slate-300',
                  )}
                >
                  {step.label}
                </span>
              </button>

              {/* Línea conectora */}
              {!isLast && (
                <div
                  aria-hidden="true"
                  className={cn(
                    'mx-2 h-0.5 flex-1 rounded-full transition-colors sm:mx-4',
                    step.id < currentStep
                      ? 'bg-blue-600'
                      : 'bg-gray-200 dark:bg-slate-700',
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}