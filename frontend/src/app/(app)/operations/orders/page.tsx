import type { Metadata } from 'next';

import { OrdersListPage } from '@/features/orders/pages/OrdersListPage';

export const metadata: Metadata = {
  title: 'Pedidos',
};

export default function OrdersPage() {
  return <OrdersListPage />;
}
