// frontend/src/features/orders/components/wizard/Step3Delivery.tsx

'use client';

import { ArrowLeft, Home, Truck, Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNewOrderStore } from '../../stores/newOrder.store';
import type { DeliveryInfo } from '../../types/order.types';

const MODALITIES: { id: DeliveryInfo['modality']; label: string; description: string }[] = [
  {
    id: 'HOME_DELIVERY',
    label: 'Entrega a domicilio',
    description: 'El pedido se envía a la dirección indicada',
  },
  {
    id: 'STORE_PICKUP',
    label: 'Retiro en tienda',
    description: 'El cliente retira el pedido en el punto de venta',
  },
  {
    id: 'TO_BE_ARRANGED',
    label: 'Por coordinar',
    description: 'La fecha y lugar se coordinan luego con el cliente',
  },
];

const TIME_SLOTS: { id: DeliveryInfo['preferredTimeSlot']; label: string }[] = [
  { id: 'MORNING', label: 'Mañana (08:00 - 12:00)' },
  { id: 'AFTERNOON', label: 'Tarde (12:00 - 17:00)' },
  { id: 'EVENING', label: 'Noche (17:00 - 20:00)' },
];

export function Step3Delivery() {
  const { customer, delivery, setDelivery, prevStep, nextStep, canProceed } =
    useNewOrderStore();

  const needsAddress = delivery.modality === 'HOME_DELIVERY';

  const useCustomerAddress = () => {
    if (!customer) return;
    setDelivery({
      address: customer.address ?? '',
      city: customer.city ?? '',
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
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setDelivery({ modality: m.id })}
                className={cn(
                  'flex items-start gap-3 rounded-md border p-3 text-left transition-colors',
                  isActive
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/15'
                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2',
                    isActive
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-gray-300 bg-white dark:border-slate-600 dark:bg-slate-900',
                  )}
                >
                  {isActive && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
                <span>
                  <span
                    className={cn(
                      'block text-sm font-medium',
                      isActive
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-gray-900 dark:text-slate-100',
                    )}
                  >
                    {m.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500 dark:text-slate-400">
                    {m.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Dirección */}
      {needsAddress && (
        <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Dirección de entrega
            </h2>
            {customer && (
              <button
                type="button"
                onClick={useCustomerAddress}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <MapPin className="h-3 w-3" />
                Usar dirección del cliente
              </button>
            )}
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
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400 dark:text-slate-500" />
            <Input
              type="date"
              value={delivery.preferredDate}
              onChange={(e) => setDelivery({ preferredDate: e.target.value })}
              className="flex-1"
            />
          </div>
          <select
            value={delivery.preferredTimeSlot}
            onChange={(e) =>
              setDelivery({
                preferredTimeSlot: e.target.value as DeliveryInfo['preferredTimeSlot'],
              })
            }
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            {TIME_SLOTS.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.label}
              </option>
            ))}
          </select>
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

      {/* Resumen rápido */}
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-4 text-xs text-gray-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        {delivery.modality === 'HOME_DELIVERY' && (
          <Home className="h-4 w-4 text-gray-400 dark:text-slate-500" />
        )}
        {delivery.modality === 'STORE_PICKUP' && (
          <Truck className="h-4 w-4 text-gray-400 dark:text-slate-500" />
        )}
        {delivery.modality === 'TO_BE_ARRANGED' && (
          <Clock className="h-4 w-4 text-gray-400 dark:text-slate-500" />
        )}
        {MODALITIES.find((m) => m.id === delivery.modality)?.label}
        {needsAddress && delivery.address && (
          <>
            <span className="text-gray-300 dark:text-slate-600">·</span>
            <span>{delivery.address}</span>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
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
          <span>→</span>
        </Button>
      </div>
    </div>
  );
}
