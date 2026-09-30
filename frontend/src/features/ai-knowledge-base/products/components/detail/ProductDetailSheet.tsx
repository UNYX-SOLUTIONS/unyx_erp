'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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
import { Skeleton } from '@/components/ui/skeleton';
import { formatLastUpdate } from '@/lib/formatters';
import { useProduct } from '../../hooks/useProduct';
import { useProductDetail } from '../../hooks/useProductDetail';
import { useUpdateProduct } from '../../hooks/useUpdateProduct';
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

  const { data, isLoading } = useProduct(isOpen ? productId : null);
  const product = data?.data ?? null;
  const updateProduct = useUpdateProduct(productId ?? '');

  const { generalForm, variantsForm, variantsArray, isDirty, resetAll } =
    useProductDetail(product);

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

  const handleSaveGeneral = generalForm.handleSubmit((values) => {
    if (!productId) {
      return;
    }
    updateProduct.mutate(
      {
        name: values.name,
        sku: values.sku,
        line: values.line,
        category: values.category,
        subcategory: values.subcategory,
        commercialDescription: values.commercialDescription,
        keywords: values.keywords,
        isActive: values.isActive,
      },
      {
        onSuccess: () => {
          close();
        },
      }
    );
  });

  const handleSaveVariants = variantsForm.handleSubmit((values) => {
    console.log('Guardar detalle (Variantes y precios, modo local)', values);
    toast.success('Cambios guardados (variantes en modo local)');
    variantsForm.reset(values);
  });

  const handleSave = () => {
    if (activeTab === 'variants') {
      void handleSaveVariants();
      return;
    }
    void handleSaveGeneral();
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
          {isLoading && !product ? (
            <div className="flex-1 space-y-4 px-6 py-6">
              <Skeleton className="h-7 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : product ? (
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
                lastUpdate={{ label: formatLastUpdate(product.updatedAt) }}
                canSave={activeTabIsDirty}
                isSaving={updateProduct.isPending}
                onCancel={requestClose}
                onSave={handleSave}
              />
            </>
          ) : (
            <div className="flex-1 p-6 text-sm text-gray-500">No se encontró el producto.</div>
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
            <Button onClick={handleDiscard} className="bg-red-600 text-white hover:bg-red-700">
              Descartar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
