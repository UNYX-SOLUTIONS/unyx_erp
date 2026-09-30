import { create } from 'zustand';

interface ProductDetailState {
  isOpen: boolean;
  productId: string | null;
  open: (productId: string) => void;
  close: () => void;
}

export const useProductDetailStore = create<ProductDetailState>((set) => ({
  isOpen: false,
  productId: null,
  open: (productId) => set({ isOpen: true, productId }),
  close: () => set({ isOpen: false }),
}));
