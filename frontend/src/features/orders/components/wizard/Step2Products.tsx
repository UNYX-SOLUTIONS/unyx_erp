// frontend/src/features/orders/components/wizard/Step2Products.tsx

'use client';

import { useState } from 'react';
import { Search, Plus, Minus, ShoppingCart, ArrowLeft, MoreVertical, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNewOrderStore, computeLineSubtotal } from '../../stores/newOrder.store';
import type { OrderItem } from '../../types/order.types';
import { MOCK_ORDER_ITEMS } from '../../data/mock';
import { OrderTotalsSummary } from './OrderTotalsSummary';

const STOCK_COLORS = {
  AVAILABLE: 'text-green-600',
  BETWEEN_WAREHOUSES: 'text-blue-600',
  LOW_STOCK: 'text-orange-600',
};

export function Step2Products() {
  const {
    customer,
    lead,
    items,
    addItem,
    updateItem,
    removeItem,
    nextStep,
    prevStep,
    setStep,
    canProceed,
    totals,
  } = useNewOrderStore();
  const [search, setSearch] = useState('');
  const [quantity, setQuantity] = useState(1);

  const t = totals();

  const handleAddMock = () => {
    const base = MOCK_ORDER_ITEMS[0];
    const mockItem: OrderItem = {
      ...base,
      id: `i-${Date.now()}`,
      quantity,
      subtotal: computeLineSubtotal({
        quantity,
        price: base.price,
        discount: base.discount,
      }),
    };
    addItem(mockItem);
    setQuantity(1);
  };

  return (
    <div className="space-y-6">
      {/* Header con cliente/lead */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-900">{customer?.name}</span>
          </div>
          <span className="text-gray-300">·</span>
          <span className="text-sm text-gray-600">Lead {lead?.code}</span>
          <span className="text-gray-300">·</span>
          <span className="text-sm text-gray-600">{lead?.name}</span>
        </div>
        <button
          type="button"
          onClick={() => setStep(1)}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Cambiar cliente / lead
        </button>
      </div>

      {/* Buscador + agregar */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Buscar producto
          </label>
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Silla Sandy"
            className="pl-9"
          />
        </div>

        {/* Producto seleccionado */}
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-gray-200 bg-gray-50 p-3">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-white">
              <ShoppingCart className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">Silla Sandy</div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="text-blue-600">ALT-P-1042</span>
                <span>·</span>
                <span>Sillas Tapizadas</span>
              </div>
            </div>
          </div>

          <select className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs">
            <option>095-B · Negro · $89.00 — GYE: 8 · UIO: 4</option>
          </select>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white hover:bg-gray-50"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-8 text-center text-sm font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white hover:bg-gray-50"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          <Button onClick={handleAddMock} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <ShoppingCart className="h-4 w-4" />
            Agregar al pedido
          </Button>
        </div>
      </section>

      {/* Items del pedido */}
      {items.length > 0 && (
        <section className="rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Productos del pedido
            </h2>
            <span className="text-xs text-gray-500">{items.length} productos</span>
          </div>

          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Producto', 'Variante', 'Cant.', 'GYE', 'UIO', 'Precio', 'Desc.', 'Subtotal', 'Acción'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-gray-100">
                  <td className="px-3 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {item.productName}
                      </span>
                      <span className="text-xs text-blue-600">{item.productSku}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-700">
                        {item.variantSku} - {item.variantName}
                      </span>
                      {item.variantStockLabel && (
                        <span className={cn('text-xs', STOCK_COLORS[item.variantStockStatus])}>
                          {item.variantStockLabel}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                        className="flex h-6 w-6 items-center justify-center rounded border border-gray-200 text-xs hover:bg-gray-50"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })}
                        className="flex h-6 w-6 items-center justify-center rounded border border-gray-200 text-xs hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-700">{item.gye}</td>
                  <td className="px-3 py-3 text-sm text-gray-700">{item.uio}</td>
                  <td className="px-3 py-3 text-sm text-gray-900">
                    ${item.price.toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-700">
                    {item.discount > 0 ? `${item.discount}%` : '—'}
                  </td>
                  <td className="px-3 py-3 text-sm font-medium text-gray-900">
                    ${item.subtotal.toFixed(2)}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totales */}
          <div className="flex justify-end border-t border-gray-200 p-6">
            <div className="w-72 rounded-md border border-gray-200 bg-gray-50 p-4">
              <OrderTotalsSummary totals={t} />
            </div>
          </div>
        </section>
      )}

      {lead && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Info className="h-3 w-3" />
          El total actualizará el Lead {lead.code} en Kommo: ${(lead.total + t.total).toFixed(2)}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
        <Button variant="ghost" onClick={prevStep} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver a cliente
        </Button>
        <Button
          disabled={!canProceed()}
          onClick={nextStep}
          className="gap-2 bg-blue-600 hover:bg-blue-700"
        >
          Continuar a entrega
          <span>→</span>
        </Button>
      </div>
    </div>
  );
}