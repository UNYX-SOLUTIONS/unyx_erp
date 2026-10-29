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
import { useAddVariant } from '../../hooks/useAddVariant';
import { useCreateProduct } from '../../hooks/useCreateProduct';
import { useDeleteVariant } from '../../hooks/useDeleteVariant';
import { useProduct } from '../../hooks/useProduct';
import { useProductDetail } from '../../hooks/useProductDetail';
import { useUpdateProduct } from '../../hooks/useUpdateProduct';
import { useUpdateVariant } from '../../hooks/useUpdateVariant';
import { useProductDetailStore } from '../../stores/product-detail-store';
import { GeneralTab } from './tabs/GeneralTab';
import { SpecificationsTab } from './tabs/SpecificationsTab';
import { VariantsTab } from './tabs/VariantsTab';
import { WarrantyTab } from './tabs/WarrantyTab';
import { ProductDetailFooter } from './ProductDetailFooter';
import { ProductDetailHeader } from './ProductDetailHeader';
import { ProductDetailTabs, type DetailTab } from './ProductDetailTabs';
import { ContificoProductSearch } from './ContificoProductSearch';

export function ProductDetailSheet() {
  const isOpen = useProductDetailStore((state) => state.isOpen);
  const mode = useProductDetailStore((state) => state.mode);
  const productId = useProductDetailStore((state) => state.productId);
  const initialTab = useProductDetailStore((state) => state.initialTab);
  const focusVariantId = useProductDetailStore((state) => state.focusVariantId);
  const close = useProductDetailStore((state) => state.close);
  const openProduct = useProductDetailStore((state) => state.open);
  const isCreate = mode === 'create';

  const [activeTab, setActiveTab] = useState<DetailTab>('general');
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  const { data, isLoading } = useProduct(isOpen && !isCreate ? productId : null);
  const product = isCreate ? null : (data?.data ?? null);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct(productId ?? '');
  const addVariantMutation = useAddVariant(productId ?? '');
  const updateVariantMutation = useUpdateVariant(productId ?? '');
  const deleteVariantMutation = useDeleteVariant(productId ?? '');

  const { generalForm, variantsForm, variantsArray, isDirty, resetAll } = useProductDetail(
    product,
    isCreate
  );

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, productId, mode, initialTab]);

  const activeTabIsDirty =
    activeTab === 'general'
      ? generalForm.formState.isDirty
      : activeTab === 'variants'
        ? variantsForm.formState.isDirty
        : false;

  const isSaving = isCreate
    ? createProduct.isPending
    : activeTab === 'variants'
      ? updateVariantMutation.isPending || addVariantMutation.isPending
      : updateProduct.isPending;

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

  const handleCreate = generalForm.handleSubmit((values) => {
    createProduct.mutate(
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
        onSuccess: (response) => {
          resetAll();
          openProduct(String(response.data.id));
        },
      }
    );
  });

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

  const handleSaveVariants = variantsForm.handleSubmit(async (values) => {
    if (!productId) {
      return;
    }
    const results = await Promise.allSettled(
      values.variants.map((variant) => {
        const payload = {
          name: variant.name,
          sku: variant.sku,
          color: variant.colorLabel || undefined,
          colorHex: variant.color || undefined,
          price: variant.price,
          description: variant.description || undefined,
          imageUrl: variant.imageUrl ?? '',
          kommoTemplateId: variant.kommoTemplateId ?? null,
        };

        if (!variant.id) {
          return addVariantMutation.mutateAsync(payload);
        }

        return updateVariantMutation.mutateAsync({
          variantId: variant.id,
          payload,
        });
      })
    );
    const hasFailures = results.some((result) => result.status === 'rejected');
    if (!hasFailures) {
      toast.success('Cambios guardados');
    }
  });

  const handleSave = () => {
    if (isCreate) {
      void handleCreate();
      return;
    }
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
          {isCreate ? (
            <>
              <ProductDetailHeader product={null} onClose={requestClose} />
              <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 px-6 py-6">
                <div className="space-y-6">
                  <ContificoProductSearch />
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-gray-200 dark:bg-slate-800" />
                    <span className="whitespace-nowrap text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-slate-500">
                      O registra un producto manualmente
                    </span>
                    <div className="h-px flex-1 bg-gray-200 dark:bg-slate-800" />
                  </div>
                  <GeneralTab form={generalForm} />
                </div>
              </div>
              <ProductDetailFooter
                canSave
                isSaving={isSaving}
                saveLabel="Crear producto"
                onCancel={requestClose}
                onSave={handleSave}
              />
            </>
          ) : isLoading && !product ? (
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
              <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 px-6 py-6">
                {activeTab === 'general' && <GeneralTab form={generalForm} />}
                {activeTab === 'variants' && (
                  <VariantsTab
                    product={product}
                    form={variantsForm}
                    variantsArray={variantsArray}
                    addVariant={addVariantMutation}
                    updateVariant={updateVariantMutation}
                    deleteVariant={deleteVariantMutation}
                    focusVariantId={focusVariantId}
                  />
                )}
                {activeTab === 'specifications' && <SpecificationsTab />}
                {activeTab === 'warranty' && <WarrantyTab />}
              </div>
              <ProductDetailFooter
                lastUpdate={{ label: formatLastUpdate(product.updatedAt) }}
                canSave={activeTabIsDirty}
                isSaving={isSaving}
                onCancel={requestClose}
                onSave={handleSave}
              />
            </>
          ) : (
            <div className="flex-1 p-6 text-sm text-gray-500 dark:text-slate-400">No se encontró el producto.</div>
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
              className="border-gray-300 text-gray-700 dark:text-slate-300"
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
