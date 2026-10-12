// frontend/src/features/orders/components/wizard/Step3Delivery.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Home,
  Truck,
  Clock,
  ArrowRight,
  ChevronDown,
  CalendarClock,
  Store,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNewOrderStore } from '../../stores/newOrder.store';
import type { DeliveryInfo } from '../../types/order.types';

const MODALITIES: {
  id: DeliveryInfo['modality'];
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    id: 'HOME_DELIVERY',
    label: 'Entrega a domicilio',
    description: 'El pedido se envía a la dirección indicada',
    icon: Truck,
  },
  {
    id: 'STORE_PICKUP',
    label: 'Retiro en tienda',
    description: 'El cliente retira el pedido en el punto de venta',
    icon: Store,
  },
  {
    id: 'TO_BE_ARRANGED',
    label: 'Por coordinar',
    description: 'La fecha y lugar se coordinan luego con el cliente',
    icon: CalendarClock,
  },
];

// Horarios de entrega en pasos de 30 min (07:00 a 20:00)
const TIME_OPTIONS: string[] = Array.from({ length: 27 }, (_, index) => {
  const totalMinutes = 7 * 60 + index * 30;
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
});

const TIME_LABEL_CLASS =
  'mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-slate-500';

interface TimeSelectProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  ariaLabel: string;
}

function TimeSelect({ value, options, onChange, ariaLabel }: TimeSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 transition-colors hover:border-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600"
      >
        <span className={cn(value ? 'font-medium' : 'text-gray-400 dark:text-slate-500')}>
          {value || '--:--'}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-gray-400 transition-transform dark:text-slate-500',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-1 max-h-56 overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          <button
            type="button"
            role="option"
            aria-selected={value === ''}
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
            className={cn(
              'flex w-full items-center px-3 py-1.5 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/60',
              value === ''
                ? 'bg-blue-50 font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                : 'text-gray-700 dark:text-slate-300'
            )}
          >
            --:--
          </button>
          {options.map((time) => (
            <button
              key={time}
              type="button"
              role="option"
              aria-selected={value === time}
              onClick={() => {
                onChange(time);
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center px-3 py-1.5 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/60',
                value === time
                  ? 'bg-blue-50 font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                  : 'text-gray-700 dark:text-slate-300'
              )}
            >
              {time}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Step3Delivery() {
  const { customer, delivery, setDelivery, prevStep, nextStep, canProceed } = useNewOrderStore();

  const needsAddress = delivery.modality === 'HOME_DELIVERY';
  const autoFilledRef = useRef(false);

  useEffect(() => {
    if (autoFilledRef.current || !customer) {
      return;
    }
    autoFilledRef.current = true;
    if (!delivery.address && (customer.address || customer.city)) {
      setDelivery({
        address: customer.address ?? '',
        city: customer.city ?? '',
      });
    }
  }, [customer, delivery.address, setDelivery]);

  const toTimeOptions = TIME_OPTIONS.filter(
    (time) => !delivery.preferredTimeFrom || time > delivery.preferredTimeFrom
  );

  const handleTimeFromChange = (value: string) => {
    setDelivery({
      preferredTimeFrom: value,
      preferredTimeTo:
        delivery.preferredTimeTo && value && delivery.preferredTimeTo <= value
          ? ''
          : delivery.preferredTimeTo,
    });
  };

  return (
    <div className="space-y-6">
      {/* Modalidad */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
          Modalidad de entrega
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          {MODALITIES.map((m) => {
            const isActive = delivery.modality === m.id;
            const Icon = m.icon; // ← asumimos que cada modalidad tiene un icono

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setDelivery({ modality: m.id })}
                className={cn(
                  'relative flex items-center justify-between gap-3 rounded-md border p-4 text-left transition-colors',
                  isActive
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/15'
                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600'
                )}
              >
                {/* Radio en la esquina superior derecha */}
                <span
                  className={cn(
                    'absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full border-2',
                    isActive
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-gray-300 bg-white dark:border-slate-600 dark:bg-slate-900'
                  )}
                  aria-hidden="true"
                >
                  {isActive && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
                {/* Icono a la izquierda */}
                {Icon && (
                  <Icon
                    className={cn(
                      'h-5 w-5 shrink-0 transition-colors',
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-400 dark:text-slate-500'
                    )}
                    aria-hidden="true"
                  />
                )}

                {/* Texto a la derecha */}
                <span className="flex flex-col pr-6">
                  <span
                    className={cn(
                      'block text-sm font-medium',
                      isActive
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-gray-900 dark:text-slate-100'
                    )}
                  >
                    {m.label}
                  </span>
                  {m.description && (
                    <span className="mt-0.5 block text-xs text-gray-500 dark:text-slate-400">
                      {m.description}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Dirección */}
      {needsAddress && (
        <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Dirección de entrega
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <Input
                value={delivery.address}
                onChange={(e) => setDelivery({ address: e.target.value })}
                placeholder="Calle principal, número, referencia"
              />
            </div>
            <Input
              value={delivery.city}
              onChange={(e) => setDelivery({ city: e.target.value })}
              placeholder="Ciudad"
            />
            <Input
              value={delivery.sector}
              onChange={(e) => setDelivery({ sector: e.target.value })}
              placeholder="Sector / Urbanización"
            />
          </div>
        </section>
      )}

      {/* Contacto y preferencias */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
          Contacto y preferencias
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input
            value={delivery.contactName}
            onChange={(e) => setDelivery({ contactName: e.target.value })}
            placeholder="Nombre de quien recibe"
          />
          <Input
            value={delivery.contactPhone}
            onChange={(e) => setDelivery({ contactPhone: e.target.value })}
            placeholder="Teléfono"
          />
          <div>
            <span className={TIME_LABEL_CLASS}>Fecha</span>
            <Input
              type="date"
              value={delivery.preferredDate}
              onChange={(e) => setDelivery({ preferredDate: e.target.value })}
              onClick={(e) => e.currentTarget.showPicker?.()}
              className="cursor-pointer"
            />
          </div>
          <div>
            <span className={TIME_LABEL_CLASS}>Horario de entrega</span>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <TimeSelect
                value={delivery.preferredTimeFrom}
                options={TIME_OPTIONS}
                onChange={handleTimeFromChange}
                ariaLabel="Hora desde"
              />
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-slate-600" />
              <TimeSelect
                value={delivery.preferredTimeTo}
                options={toTimeOptions}
                onChange={(value) => setDelivery({ preferredTimeTo: value })}
                ariaLabel="Hora hasta"
              />
            </div>
          </div>
        </div>

        <div className="mt-3">
          <textarea
            value={delivery.notes}
            onChange={(e) => setDelivery({ notes: e.target.value })}
            rows={3}
            placeholder="Observaciones de entrega (piso, horario de recepción, etc.)"
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
      </section>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <Button variant="ghost" onClick={prevStep} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver a productos
        </Button>
        <Button
          disabled={!canProceed()}
          onClick={nextStep}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-gray-50 dark:text-slate-100"
        >
          Continuar a confirmar
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
