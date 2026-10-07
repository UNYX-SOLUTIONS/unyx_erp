import type { Metadata } from 'next';

import { NewOrderWizard } from '@/features/orders/components/wizard/NewOrderWizard';

export const metadata: Metadata = {
  title: 'Nuevo pedido',
};

export default function NewOrderPage() {
  return <NewOrderWizard />;
}
