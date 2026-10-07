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
  lead: OrderLead | null;
  items: OrderItem[];
  delivery: DeliveryInfo;

  // Actions
  setStep: (step: 1 | 2 | 3 | 4) => void;
  nextStep: () => void;
  prevStep: () => void;
  setCustomer: (customer: OrderCustomer | null) => void;
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

const IVA_RATE = 0.15;

export const useNewOrderStore = create<NewOrderState>((set, get) => ({
  currentStep: 1,
  customer: null,
  lead: null,
  items: [],
  delivery: { ...DEFAULT_DELIVERY },

  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((s) => ({ currentStep: Math.min(4, s.currentStep + 1) as 1|2|3|4 })),
  prevStep: () => set((s) => ({ currentStep: Math.max(1, s.currentStep - 1) as 1|2|3|4 })),

  setCustomer: (customer) => set({ customer }),
  setLead: (lead) => set({ lead }),

  addItem: (item) =>
    set((s) => {
      const existing = s.items.find(
        (i) => i.productSku === item.productSku && i.variantSku === item.variantSku,
      );
      if (existing) {
        return {
          items: s.items.map((i) =>
            i.id === existing.id
              ? { ...i, quantity: i.quantity + item.quantity, subtotal: (i.quantity + item.quantity) * i.price * (1 - i.discount / 100) }
              : i,
          ),
        };
      }
      return { items: [...s.items, item] };
    }),

  updateItem: (id, patch) =>
    set((s) => ({
      items: s.items.map((i) => {
        if (i.id !== id) return i;
        const merged = { ...i, ...patch };
        merged.subtotal = merged.quantity * merged.price * (1 - merged.discount / 100);
        return merged;
      }),
    })),

  removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

  setDelivery: (patch) => set((s) => ({ delivery: { ...s.delivery, ...patch } })),

  reset: () =>
    set({
      currentStep: 1,
      customer: null,
      lead: null,
      items: [],
      delivery: { ...DEFAULT_DELIVERY },
    }),

  totals: () => {
    const { items } = get();
    const subtotal = items.reduce((sum, i) => sum + i.quantity * i.price, 0);
    const discountAmount = items.reduce(
      (sum, i) => sum + i.quantity * i.price * (i.discount / 100),
      0,
    );
    const base = subtotal - discountAmount;
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
      case 3:
        return !!s.delivery.address && !!s.delivery.contactName && !!s.delivery.contactPhone;
      case 4:
        return true;
      default:
        return false;
    }
  },
}));
