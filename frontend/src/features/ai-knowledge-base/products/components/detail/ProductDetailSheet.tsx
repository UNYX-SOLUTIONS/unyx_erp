'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { PRODUCTS } from '../../data/mock';
import { useProductDetail } from '../../hooks/useProductDetail';
import { useProductDetailStore } from '../../stores/product-detail-store';
import { GeneralTab } from './tabs/GeneralTab';
import { SpecificationsTab } from './tabs/SpecificationsTab';
import { VariantsTab } from './tabs/VariantsTab';
import { WarrantyTab } from './tabs/WarrantyTab';
import { ProductDetailFooter } from './ProductDetailFooter';
import { ProductDetailHeader } from './ProductDetailHeader';
import { ProductDetailTabs, type DetailTab } from './ProductDetailTabs';

export function ProductDetailSheet() {
  const isOpen = useProductDetailStore((state) => state.isOpen);
  const productId = useProductDetailStore((state) => state.productId);
  const close = useProductDetailStore((state) => state.close);
  const [activeTab, setActiveTab] = useState<DetailTab>('general');
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  const product = useMemo(
    () => PRODUCTS.find((item) => item.id === productId) ?? null,
    [productId]
  );

  const {
    generalForm,
    variantsForm,
    variantsArray,
    isDirty,
    submitGeneral,
    submitVariants,
    resetAll,
  } = useProductDetail(product);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('general');
    }
  }, [isOpen, productId]);

  const activeTabIsDirty =
    activeTab === 'general'
      ? generalForm.formState.isDirty
      : activeTab === 'variants'
        ? variantsForm.formState.isDirty
        : false;

  const requestClose = () => {
    if (isDirty) {
      setConfirmDiscardOpen(true);
      return;
    }
    close();
  };

  const handleDiscard = () => {
    resetAll();
    setConfirmDiscardOpen(false);
    close();
  };

  const handleSave = () => {
    if (activeTab === 'variants') {
      submitVariants();
      return;
    }
    submitGeneral();
  };

  return (
    <>
      <Sheet
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            requestClose();
          }
        }}
      >
        <SheetContent
          side="right"
          showClose={false}
          aria-describedby={undefined}
          className="w-full gap-0 p-0 sm:max-w-3xl"
        >
          {product && (
            <>
              <ProductDetailHeader product={product} onClose={requestClose} />
              <ProductDetailTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                variantCount={variantsArray.fields.length}
              />
              <div className="flex-1 overflow-y-auto bg-white px-6 py-6">
                {activeTab === 'general' && <GeneralTab form={generalForm} />}
                {activeTab === 'variants' && (
                  <VariantsTab form={variantsForm} variantsArray={variantsArray} />
                )}
                {activeTab === 'specifications' && <SpecificationsTab />}
                {activeTab === 'warranty' && <WarrantyTab />}
              </div>
              <ProductDetailFooter
                lastUpdate={product.lastUpdate}
                canSave={activeTabIsDirty}
                onCancel={requestClose}
                onSave={handleSave}
              />
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={confirmDiscardOpen} onOpenChange={setConfirmDiscardOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>¿Descartar cambios?</DialogTitle>
            <DialogDescription>
              Hay cambios sin guardar en este producto. Si cierras ahora, se perderán.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDiscardOpen(false)}
              className="border-gray-300 text-gray-700"
            >
              Seguir editando
            </Button>
            <Button
              onClick={handleDiscard}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Descartar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
