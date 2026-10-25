import { create } from 'zustand';

export type ProductDetailMode = 'create' | 'edit';

interface ProductDetailState {
  isOpen: boolean;
  mode: ProductDetailMode | null;
  productId: string | null;
  open: (productId: string) => void;
  openCreate: () => void;
  close: () => void;
}

export const useProductDetailStore = create<ProductDetailState>((set) => ({
  isOpen: false,
  mode: null,
  productId: null,
  open: (productId) => set({ isOpen: true, mode: 'edit', productId }),
  openCreate: () => set({ isOpen: true, mode: 'create', productId: null }),
  close: () => set({ isOpen: false, mode: null, productId: null }),
}));
