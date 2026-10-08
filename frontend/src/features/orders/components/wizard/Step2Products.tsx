// frontend/src/features/orders/components/wizard/Step2Products.tsx

'use client';

import { useState } from 'react';
import { Search, Plus, Minus, ShoppingCart, ArrowLeft, Info, Trash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useNewOrderStore, computeLineSubtotal } from '../../stores/newOrder.store';
import type { OrderItem } from '../../types/order.types';
import type { ProductCatalogItem, ProductVariant } from '../../types/product.types';
import { MOCK_PRODUCTS } from '../../data/mock';
import { OrderTotalsSummary } from './OrderTotalsSummary';

const STOCK_COLORS = {
  AVAILABLE: 'text-green-600',
  BETWEEN_WAREHOUSES: 'text-blue-600',
  LOW_STOCK: 'text-orange-600',
};

const ITEM_COLUMNS = [
  'Producto',
  'Variante',
  'Cant.',
  'GYE',
  'UIO',
  'Precio',
  'Desc.',
  'Subtotal',
  'Acción',
];

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
  const [open, setOpen] = useState(false);
  const [dialogProduct, setDialogProduct] = useState<ProductCatalogItem | null>(null);
  const [dialogVariantSku, setDialogVariantSku] = useState<string | null>(null);
  const [dialogQuantity, setDialogQuantity] = useState(1);

  const t = totals();

  const normalizedQuery = search.trim().toLowerCase();
  const results = normalizedQuery
    ? MOCK_PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(normalizedQuery) ||
          p.sku.toLowerCase().includes(normalizedQuery) ||
          p.line.toLowerCase().includes(normalizedQuery) ||
          p.variants.some(
            (v) =>
              v.name.toLowerCase().includes(normalizedQuery) ||
              v.sku.toLowerCase().includes(normalizedQuery)
          )
      )
    : [];

  const addVariantToOrder = (
    product: ProductCatalogItem,
    variant: ProductVariant,
    quantity: number
  ) => {
    const item: OrderItem = {
      id: `i-${Date.now()}`,
      productSku: product.sku,
      productName: product.name,
      productLine: product.line,
      variantSku: variant.sku,
      variantName: variant.name,
      variantStockStatus: variant.stockStatus,
      variantStockLabel: variant.stockLabel,
      quantity,
      gye: variant.gye,
      uio: variant.uio,
      price: variant.price,
      discount: 0,
      subtotal: computeLineSubtotal({ quantity, price: variant.price, discount: 0 }),
    };
    addItem(item);
  };

  const handleSelectProduct = (product: ProductCatalogItem) => {
    setSearch('');
    setOpen(false);

    const [firstVariant] = product.variants;
    if (product.variants.length === 1 && firstVariant) {
      addVariantToOrder(product, firstVariant, 1);
      return;
    }

    setDialogProduct(product);
    setDialogVariantSku(firstVariant?.sku ?? null);
    setDialogQuantity(1);
  };

  const handleDialogAdd = () => {
    if (!dialogProduct) {
      return;
    }
    const variant =
      dialogProduct.variants.find((v) => v.sku === dialogVariantSku) ?? dialogProduct.variants[0];
    if (!variant) {
      return;
    }
    addVariantToOrder(dialogProduct, variant, dialogQuantity);
    setDialogProduct(null);
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

      {/* Items del pedido */}
      <section className="rounded-lg border border-gray-200 bg-white px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 py-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 pl-1">
            Productos del pedido
          </h2>
          <div className="relative w-full *:max-w-full sm:w-64 md:w-72 lg:w-80 xl:w-96">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                placeholder="Buscar por nombre, SKU o línea de producto"
                className="pl-9"
                autoComplete="off"
              />
            </div>

            {open && normalizedQuery.length > 0 && (
              <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                {results.length > 0 ? (
                  <ul className="max-h-72 overflow-auto">
                    {results.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectProduct(p);
                          }}
                          className="flex w-full flex-col items-start gap-0.5 border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-gray-50"
                        >
                          <span className="text-sm font-semibold text-gray-900">{p.name}</span>
                          <span className="text-xs text-gray-500">
                            {p.sku} · {p.line} · {p.variants.length}{' '}
                            {p.variants.length === 1 ? 'variante' : 'variantes'}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-3 text-sm text-gray-500">No se encontraron productos.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 px-6 py-10 text-center">
            <ShoppingCart className="mb-1 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">Aún no hay productos en el pedido</p>
            <p className="text-xs text-gray-400">Usa el buscador para agregar el primer producto.</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  {ITEM_COLUMNS.map((column) => (
                    <TableHead
                      key={column}
                      className="h-9 px-3 text-xs font-medium uppercase tracking-wide text-gray-500"
                    >
                      {column}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className="border-gray-100">
                    <TableCell className="px-3 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {item.productName}
                        </span>
                        <span className="text-xs text-blue-600">{item.productSku}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3">
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
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            updateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })
                          }
                          className="flex h-6 w-6 items-center justify-center rounded border border-gray-200 text-xs hover:bg-gray-50"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })}
                          className="flex h-6 w-6 items-center justify-center rounded border border-gray-200 text-xs hover:bg-gray-50"
                        >
                          +
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-sm text-gray-700">{item.gye}</TableCell>
                    <TableCell className="px-3 py-3 text-sm text-gray-700">{item.uio}</TableCell>
                    <TableCell className="px-3 py-3 text-sm text-gray-900">
                      ${item.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-sm text-gray-700">
                      {item.discount > 0 ? `${item.discount}%` : '—'}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-sm font-medium text-gray-900">
                      ${item.subtotal.toFixed(2)}
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        title="Quitar producto"
                        aria-label={`Quitar ${item.productName}`}
                        className="rounded p-1.5 text-gray-400 hover:bg-red-100"
                      >
                        <Trash className="h-3.5 w-3.5 text-red-700" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Totales */}
            <div className="flex justify-end border-t border-gray-200 p-6">
              <div className="w-72 rounded-md border border-gray-200 bg-gray-50 p-4">
                <OrderTotalsSummary totals={t} />
              </div>
            </div>
          </>
        )}
      </section>

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
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-gray-50 dark:text-slate-100"
        >
          Continuar a entrega
          <span>→</span>
        </Button>
      </div>

      {/* Dialog de variante */}
      <Dialog
        open={!!dialogProduct}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setDialogProduct(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Selecciona la variante</DialogTitle>
            <DialogDescription>
              {dialogProduct?.name} · {dialogProduct?.sku}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {dialogProduct?.variants.map((variant) => {
              const isSelected = variant.sku === dialogVariantSku;
              return (
                <button
                  key={variant.sku}
                  type="button"
                  onClick={() => setDialogVariantSku(variant.sku)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors',
                    isSelected
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
                      isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-white'
                    )}
                  >
                    {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                  <span className="flex-1">
                    <span className="flex items-center justify-between">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          isSelected ? 'text-blue-700' : 'text-gray-900'
                        )}
                      >
                        {variant.name}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        ${variant.price.toFixed(2)}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs text-gray-500">
                      {variant.sku} · GYE: {variant.gye} · UIO: {variant.uio}
                      {variant.stockLabel && (
                        <>
                          {' · '}
                          <span className={STOCK_COLORS[variant.stockStatus]}>
                            {variant.stockLabel}
                          </span>
                        </>
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-3">
            <span className="text-sm text-gray-600">Cantidad</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setDialogQuantity(Math.max(1, dialogQuantity - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white hover:bg-gray-50"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-8 text-center text-sm font-medium">{dialogQuantity}</span>
              <button
                type="button"
                onClick={() => setDialogQuantity(dialogQuantity + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white hover:bg-gray-50"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:space-x-0">
            <Button variant="ghost" onClick={() => setDialogProduct(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleDialogAdd}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-gray-50 dark:text-slate-100"
            >
              <ShoppingCart className="h-4 w-4" />
              Agregar al pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
