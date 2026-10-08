// frontend/src/features/orders/stores/newOrder.store.ts

import { create } from 'zustand';
import type {
  OrderCustomer,
  OrderItem,
  OrderLead,
  DeliveryInfo,
  OrderTotals,
} from '../types/order.types';
import { DEFAULT_DELIVERY } from '../data/mock';

interface NewOrderState {
  currentStep: 1 | 2 | 3 | 4;
  customer: OrderCustomer | null;
  customers: OrderCustomer[];
  lead: OrderLead | null;
  items: OrderItem[];
  delivery: DeliveryInfo;

  // Actions
  setStep: (step: 1 | 2 | 3 | 4) => void;
  nextStep: () => void;
  prevStep: () => void;
  setCustomer: (customer: OrderCustomer | null) => void;
  addCustomer: (customer: OrderCustomer) => void;
  setLead: (lead: OrderLead | null) => void;
  addItem: (item: OrderItem) => void;
  updateItem: (id: string, patch: Partial<OrderItem>) => void;
  removeItem: (id: string) => void;
  setDelivery: (patch: Partial<DeliveryInfo>) => void;
  reset: () => void;

  // Derived
  totals: () => OrderTotals;
  canProceed: () => boolean;
}

export const IVA_RATE = 0.15;

export function computeLineSubtotal(item: {
  quantity: number;
  price: number;
  discount: number;
}): number {
  return item.quantity * item.price * (1 - item.discount / 100);
}

export const useNewOrderStore = create<NewOrderState>((set, get) => ({
  currentStep: 1,
  customer: null,
  customers: [],
  lead: null,
  items: [],
  delivery: { ...DEFAULT_DELIVERY },

  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((s) => ({ currentStep: Math.min(4, s.currentStep + 1) as 1|2|3|4 })),
  prevStep: () => set((s) => ({ currentStep: Math.max(1, s.currentStep - 1) as 1|2|3|4 })),

  setCustomer: (customer) => set({ customer }),
  addCustomer: (customer) => set((s) => ({ customers: [customer, ...s.customers] })),
  setLead: (lead) => set({ lead }),

  addItem: (item) =>
    set((s) => {
      const existing = s.items.find(
        (i) => i.productSku === item.productSku && i.variantSku === item.variantSku,
      );
      if (existing) {
        const merged = { ...existing, quantity: existing.quantity + item.quantity };
        return {
          items: s.items.map((i) =>
            i.id === existing.id
              ? { ...merged, subtotal: computeLineSubtotal(merged) }
              : i,
          ),
        };
      }
      return { items: [...s.items, { ...item, subtotal: computeLineSubtotal(item) }] };
    }),

  updateItem: (id, patch) =>
    set((s) => ({
      items: s.items.map((i) => {
        if (i.id !== id) return i;
        const merged = { ...i, ...patch };
        return { ...merged, subtotal: computeLineSubtotal(merged) };
      }),
    })),

  removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

  setDelivery: (patch) => set((s) => ({ delivery: { ...s.delivery, ...patch } })),

  reset: () =>
    set({
      currentStep: 1,
      customer: null,
      customers: [],
      lead: null,
      items: [],
      delivery: { ...DEFAULT_DELIVERY },
    }),

  totals: () => {
    const { items } = get();
    const subtotal = items.reduce((sum, i) => sum + i.quantity * i.price, 0);
    const discounted = items.reduce((sum, i) => sum + i.subtotal, 0);
    const discountAmount = subtotal - discounted;
    const base = discounted;
    const iva = base * IVA_RATE;
    return {
      subtotal,
      discount: discountAmount,
      base,
      iva,
      total: base + iva,
    };
  },

  canProceed: () => {
    const s = get();
    switch (s.currentStep) {
      case 1:
        return !!s.customer && !!s.lead;
      case 2:
        return s.items.length > 0;
      case 3: {
        const needsAddress = s.delivery.modality === 'HOME_DELIVERY';
        return (
          !!s.delivery.contactName &&
          !!s.delivery.contactPhone &&
          (!needsAddress || (!!s.delivery.address && !!s.delivery.city))
        );
      }
      case 4:
        return true;
      default:
        return false;
    }
  },
}));
