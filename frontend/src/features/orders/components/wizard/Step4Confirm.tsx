// frontend/src/features/orders/components/wizard/Step4Confirm.tsx

'use client';

import { ArrowLeft, Pencil, Truck, Home, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNewOrderStore } from '../../stores/newOrder.store';

export function Step4Confirm({ onConfirm }: { onConfirm: () => void }) {
  const { customer, lead, items, delivery, prevStep, totals } = useNewOrderStore();
  const t = totals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Confirmar pedido
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Verifica la información antes de reservar el pedido.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Cliente y lead */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Cliente y lead
              </span>
              <button className="inline-flex items-center gap-1 text-xs font-medium text-blue-600">
                <Pencil className="h-3 w-3" />
                Editar
              </button>
            </div>
            <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
              <div className="text-sm font-semibold text-gray-900">{customer?.name}</div>
              <div className="mt-0.5 text-xs text-gray-500">
                {customer?.ruc} · {customer?.phone}
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                <span>{customer?.contactName}</span>
                <span className="text-gray-300">·</span>
                <span>Lead {lead?.code}</span>
              </div>
              <div className="text-xs text-gray-500">{lead?.name}</div>
            </div>
          </div>

          {/* Productos resumen */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Productos ({items.length})
              </span>
              <button className="inline-flex items-center gap-1 text-xs font-medium text-blue-600">
                <Pencil className="h-3 w-3" />
                Editar
              </button>
            </div>
            <div className="overflow-hidden rounded-md border border-gray-100 bg-gray-50">
              <table className="w-full text-xs">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Producto</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Variante</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-500">Cant.</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Precio</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-900">{item.productName}</div>
                        <div className="text-[10px] text-blue-600">{item.productSku}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-gray-700">{item.variantSku}</div>
                        <div className="text-[10px] text-gray-500">{item.variantName}</div>
                      </td>
                      <td className="px-3 py-2 text-center text-gray-700">{item.quantity}</td>
                      <td className="px-3 py-2 text-right text-gray-700">
                        ${item.price.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-gray-900">
                        ${item.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Entrega */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Entrega
          </span>
          <button className="inline-flex items-center gap-1 text-xs font-medium text-blue-600">
            <Pencil className="h-3 w-3" />
            Editar
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-gray-900">
                {delivery.modality === 'HOME_DELIVERY' && 'Entrega a domicilio'}
                {delivery.modality === 'STORE_PICKUP' && 'Retiro en tienda'}
                {delivery.modality === 'TO_BE_ARRANGED' && 'Por coordinar'}
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Home className="mt-0.5 h-4 w-4 text-gray-400" />
              <div>
                <div className="text-gray-900">{delivery.address}</div>
                <div className="text-xs text-gray-500">{delivery.city}</div>
                <div className="text-xs text-gray-500">{delivery.sector}</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-500">Contacto receptor</div>
              <div className="text-sm text-gray-900">
                {delivery.contactName} · {delivery.contactPhone}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Preferencia de fecha</div>
              <div className="text-sm text-gray-900">
                📅 {delivery.preferredDate || 'Por definir'} · {delivery.preferredTimeSlot === 'MORNING' ? 'Mañana' : delivery.preferredTimeSlot === 'AFTERNOON' ? 'Tarde' : 'Noche'}
              </div>
            </div>
          </div>
        </div>

        {delivery.notes && (
          <div className="mt-4 rounded-md border border-blue-100 bg-blue-50 p-3">
            <div className="mb-1 text-xs font-medium text-blue-700">
              Observaciones de entrega
            </div>
            <div className="text-xs text-blue-800">&ldquo;{delivery.notes}&rdquo;</div>
          </div>
        )}
      </section>

      {/* Al confirmar + Resumen total */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Al confirmar
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="text-xs text-gray-500">Estado inicial:</span>
              <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                <AlertCircle className="h-3 w-3" />
                Pendiente de aprobación de pago
              </span>
            </div>
            <p className="text-xs text-gray-500">
              El pedido quedará reservado mientras Gerencia valida el pago.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="space-y-2">
            <Row label="Subtotal" value={t.subtotal} />
            <Row label="Descuento" value={-t.discount} muted />
            <Row label="Base imponible" value={t.base} />
            <Row label="IVA (15%)" value={t.iva} muted />
            <div className="border-t border-gray-200 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">TOTAL</span>
                <span className="text-lg font-bold text-gray-900">
                  ${t.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
        <Button variant="ghost" onClick={prevStep} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver a entrega
        </Button>
        <Button
          onClick={onConfirm}
          className="gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <CheckCircle2 className="h-4 w-4" />
          Confirmar y reservar pedido
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={muted ? 'text-sm text-gray-500' : 'text-sm font-medium text-gray-900'}>
        ${Math.abs(value).toFixed(2)}
      </span>
    </div>
  );
}