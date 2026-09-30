import type { ColumnDef } from '@tanstack/react-table';
import { LastUpdateCell } from './components/LastUpdateCell';
import { PriceCell } from './components/PriceCell';
import { ProductActions } from './components/ProductActions';
import { ProductCell } from './components/ProductCell';
import { SyncCell } from './components/SyncCell';
import { ValidationCell } from './components/ValidationCell';
import { VariantsCell } from './components/VariantsCell';
import type { Product } from './types/product.types';

export const productColumns: ColumnDef<Product, unknown>[] = [
  {
    id: 'product',
    header: 'Producto / SKU',
    size: 340,
    enableSorting: false,
    cell: ({ row }) => <ProductCell product={row.original} />,
  },
  {
    id: 'variants',
    header: 'Variantes',
    size: 150,
    enableSorting: false,
    cell: ({ row }) => <VariantsCell variants={row.original.variants} />,
  },
  {
    id: 'price',
    header: 'Precio',
    size: 120,
    enableSorting: false,
    cell: ({ row }) => <PriceCell price={row.original.price} priceFrom={row.original.priceFrom} />,
  },
  {
    id: 'validation',
    header: 'Validación',
    size: 180,
    enableSorting: false,
    cell: ({ row }) => <ValidationCell status={row.original.status} />,
  },
  {
    id: 'sync',
    header: 'Sincronización',
    size: 170,
    enableSorting: false,
    cell: ({ row }) => <SyncCell status={row.original.syncStatus} />,
  },
  {
    id: 'lastUpdate',
    header: 'Última actualización',
    size: 170,
    enableSorting: false,
    cell: ({ row }) => <LastUpdateCell lastUpdate={row.original.lastUpdate} />,
  },
  {
    id: 'actions',
    header: () => <span className="block text-right">Acciones</span>,
    size: 80,
    enableSorting: false,
    cell: ({ row }) => <ProductActions product={row.original} />,
  },
];
