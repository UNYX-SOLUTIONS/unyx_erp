'use client';

import { Loader2 } from 'lucide-react';
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
import { useUpdateVariantMetaMapping } from '../../../hooks/useUpdateVariantMetaMapping';
import { MetaCatalogPicker } from './MetaCatalogPicker';
import type { MetaCatalogItem } from '../../../types/product.types';

interface MetaMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  variantId: string;
  variantName: string;
  sku: string;
  selectedRetailerId: string | null;
}

export function MetaMappingDialog({
  open,
  onOpenChange,
  productId,
  variantId,
  variantName,
  sku,
  selectedRetailerId,
}: MetaMappingDialogProps) {
  const updateMapping = useUpdateVariantMetaMapping(productId);
  const isSaving = updateMapping.isPending;

  const assign = async (item: MetaCatalogItem) => {
    const response = await updateMapping
      .mutateAsync({
        variantId,
        payload: { metaRetailerId: item.retailerId },
      })
      .catch(() => null);
    if (!response) {
      return;
    }
    onOpenChange(false);
    toast.success('Mapeo de Meta asignado');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-xl overflow-hidden sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Catálogo Meta / WhatsApp</DialogTitle>
          <DialogDescription>
            Selecciona el ítem de Meta que corresponde a {variantName || 'esta variante'}
            {sku ? ` (${sku})` : ''}.
          </DialogDescription>
        </DialogHeader>
        <MetaCatalogPicker
          selectedRetailerId={selectedRetailerId}
          isSaving={isSaving}
          onSelect={(item) => {
            void assign(item);
          }}
        />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="border-gray-300 text-gray-700 dark:border-slate-700 dark:text-slate-300"
          >
            {isSaving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
