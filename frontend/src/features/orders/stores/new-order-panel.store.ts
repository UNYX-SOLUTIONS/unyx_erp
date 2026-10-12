// frontend/src/features/orders/stores/new-order-panel.store.ts

import { create } from 'zustand';

interface NewOrderPanelState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useNewOrderPanelStore = create<NewOrderPanelState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
