'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
import { VariantsTab } from './tabs/VariantsTab';
import { ProductDetailFooter } from './ProductDetailFooter';
import { ProductDetailHeader } from './ProductDetailHeader';
import { ProductDetailTabs, type DetailTab } from './ProductDetailTabs';
import { ContificoProductSearch } from './ContificoProductSearch';
import type { VariantDto } from '../../types/product.types';
import type { VariantsFormValues } from '../../schemas/product-schema';

function variantHasChanges(
  original: VariantDto | undefined,
  variant: VariantsFormValues['variants'][number]
): boolean {
  if (!original) {
    return true;
  }
  return (
    (variant.name ?? '') !== (original.name ?? '') ||
    (variant.sku ?? '') !== (original.sku ?? '') ||
    (variant.colorLabel ?? '') !== (original.color ?? '') ||
    Number(variant.price ?? 0) !== Number(original.price ?? 0) ||
    (variant.description ?? '') !== (original.description ?? '') ||
    (variant.imageUrl ?? '') !== (original.imageUrl ?? '') ||
    Boolean(variant.isActive) !== Boolean(original.isActive) ||
    (variant.kommoTemplateId ?? null) !== (original.kommoTemplateId ?? null) ||
    (variant.garantiaId ?? null) !== (original.garantiaId ?? null)
  );
}

export function ProductDetailSheet() {
  const isOpen = useProductDetailStore((state) => state.isOpen);
  const mode = useProductDetailStore((state) => state.mode);
  const productId = useProductDetailStore((state) => state.productId);
  const initialTab = useProductDetailStore((state) => state.initialTab);
  const focusVariantId = useProductDetailStore((state) => state.focusVariantId);
  const close = useProductDetailStore((state) => state.close);
  const openProduct = useProductDetailStore((state) => state.open);
  const isCreate = mode === 'create';
  const queryClient = useQueryClient();

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
    isCreate,
    isOpen
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

  const closeWithRefresh = () => {
    close();
    const listIsStale = queryClient
      .getQueryCache()
      .findAll({ queryKey: ['products'] })
      .some((query) => query.state.isInvalidated);
    if (listIsStale) {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  };

  const requestClose = () => {
    if (isDirty) {
      setConfirmDiscardOpen(true);
      return;
    }
    closeWithRefresh();
  };

  const handleDiscard = () => {
    resetAll();
    setConfirmDiscardOpen(false);
    closeWithRefresh();
  };

  const handleCreate = generalForm.handleSubmit((values) => {
    createProduct.mutate(
      {
        name: values.name,
        sku: values.sku,
        line: values.line,
        category: values.category,
        subcategory: values.subcategory,
        categoryId: values.categoryId,
        subcategoryId: values.subcategoryId,
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
        categoryId: values.categoryId,
        subcategoryId: values.subcategoryId,
        commercialDescription: values.commercialDescription,
        keywords: values.keywords,
        isActive: values.isActive,
      },
      {
        onSuccess: () => {
          generalForm.reset(values);
          closeWithRefresh();
        },
      }
    );
  });

  const handleSaveVariants = variantsForm.handleSubmit(async (values) => {
    if (!productId) {
      return;
    }

    const updates = values.variants
      .map((variant, index) => ({ variant, index }))
      .filter(({ variant }) => {
        if (!variant.id) {
          return true;
        }
        const original = product?.variants.find((item) => item.id === variant.id);
        return variantHasChanges(original, variant);
      });

    if (updates.length === 0) {
      toast.info('No hay cambios en las variantes');
      return;
    }

    const results = await Promise.allSettled(
      updates.map(async ({ variant, index }) => {
        const payload = {
          name: variant.name,
          sku: variant.sku,
          color: variant.colorLabel || undefined,
          colorHex: variant.color || undefined,
          price: variant.price,
          description: variant.description || undefined,
          imageUrl: variant.imageUrl ?? '',
          isActive: variant.isActive,
          kommoTemplateId: variant.kommoTemplateId ?? null,
          garantiaId: variant.garantiaId ?? null,
        };

        if (!variant.id) {
          const response = await addVariantMutation.mutateAsync(payload);
          return { index, id: response.data.id };
        }

        const response = await updateVariantMutation.mutateAsync({
          variantId: variant.id,
          payload,
        });
        return { index, id: response.data.id };
      })
    );

    let nextVariants = values.variants;
    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { index, id } = result.value;
        if (nextVariants[index] && nextVariants[index].id !== id) {
          nextVariants = nextVariants.map((item, itemIndex) =>
            itemIndex === index ? { ...item, id } : item
          );
        }
      }
    }

    const hasFailures = results.some((result) => result.status === 'rejected');
    if (!hasFailures) {
      variantsForm.reset({ variants: nextVariants });
      toast.success('Cambios guardados');
    } else {
      // Conserva los IDs de las variantes nuevas que sí se crearon para que
      // reintentar el guardado no las duplique.
      for (const result of results) {
        if (result.status === 'fulfilled') {
          variantsForm.setValue(`variants.${result.value.index}.id`, result.value.id);
        }
      }
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
                {activeTab === 'general' && (
                  <GeneralTab form={generalForm} />
                )}
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
