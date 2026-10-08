'use client';

import { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDeleteProduct } from '../hooks/useDeleteProduct';
import { useProductDetailStore } from '../stores/product-detail-store';
import type { Product } from '../types/product.types';

export function ProductActions({ product }: { product: Product }) {
  const openProductDetail = useProductDetailStore((state) => state.open);
  const deleteProduct = useDeleteProduct();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500 dark:text-slate-400"
            aria-label={`Acciones para ${product.name}`}
            onClick={(event) => event.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => openProductDetail(product.id)}>
            Ver detalle
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openProductDetail(product.id)}>Editar</DropdownMenuItem>
          <DropdownMenuItem>Duplicar</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Cambiar validación</DropdownMenuItem>
          <DropdownMenuItem>Marcar para revisión</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setConfirmOpen(true)}
            className="text-red-600 focus:text-red-600"
          >
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar producto</DialogTitle>
            <DialogDescription>
              ¿Seguro que quieres eliminar «{product.name}»? Dejará de aparecer en el listado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              className="border-gray-300 text-gray-700 dark:text-slate-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={() =>
                deleteProduct.mutate(product.id, { onSuccess: () => setConfirmOpen(false) })
              }
              disabled={deleteProduct.isPending}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
