// frontend/src/features/orders/components/wizard/NewOrderPanel.tsx

'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import { useNewOrderPanelStore } from '../../stores/new-order-panel.store';
import { NewOrderWizard } from './NewOrderWizard';

export function NewOrderPanel() {
  const isOpen = useNewOrderPanelStore((state) => state.isOpen);
  const close = useNewOrderPanelStore((state) => state.close);

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          close();
        }
      }}
    >
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-3xl">
        <SheetTitle className="sr-only">Nuevo pedido</SheetTitle>
        <SheetDescription className="sr-only">
          Completa los pasos para crear y reservar un pedido.
        </SheetDescription>
        <div className="flex-1 overflow-y-auto">
          <NewOrderWizard />
        </div>
      </SheetContent>
    </Sheet>
  );
}
