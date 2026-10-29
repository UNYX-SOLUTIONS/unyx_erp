import { create } from 'zustand';
import type { ProductDetailTab } from '../types/product.types';

export type ProductDetailMode = 'create' | 'edit';

export interface OpenProductDetailOptions {
  tab?: ProductDetailTab;
  variantId?: string;
}

interface ProductDetailState {
  isOpen: boolean;
  mode: ProductDetailMode | null;
  productId: string | null;
  initialTab: ProductDetailTab;
  focusVariantId: string | null;
  open: (productId: string, options?: OpenProductDetailOptions) => void;
  openCreate: () => void;
  close: () => void;
}

export const useProductDetailStore = create<ProductDetailState>((set) => ({
  isOpen: false,
  mode: null,
  productId: null,
  initialTab: 'general',
  focusVariantId: null,
  open: (productId, options) =>
    set({
      isOpen: true,
      mode: 'edit',
      productId,
      initialTab: options?.tab ?? 'general',
      focusVariantId: options?.variantId ?? null,
    }),
  openCreate: () =>
    set({
      isOpen: true,
      mode: 'create',
      productId: null,
      initialTab: 'general',
      focusVariantId: null,
    }),
  close: () =>
    set({
      isOpen: false,
      mode: null,
      productId: null,
      initialTab: 'general',
      focusVariantId: null,
    }),
}));
