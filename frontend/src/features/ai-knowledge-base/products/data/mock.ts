import type {
  Product,
  ProductLine,
  ProductStatus,
  ProductSyncStatus,
} from '../types/product.types';

const AUTHORS = ['Jhonatan', 'Andrea', 'Rodrigo'];

const LINES: ProductLine[] = [
  'Sillines',
  'Mesas Auxiliares',
  'Sillas de Espera',
  'Sillas Ejecutivas',
  'Sillas Operativas',
  'Sillas Lounge',
];

const EXPLICIT_PRODUCTS: Product[] = [
  {
    id: 'p-1',
    name: 'Silla Sandy',
    sku: 'ALT-P-1042',
    line: 'Sillines',
    variants: { count: 2, label: 'Tapizadas' },
    price: 95,
    priceFrom: true,
    status: 'pending',
    syncStatus: 'notSynced',
    lastUpdate: { label: 'Hoy 11:24', author: 'Jhonatan' },
  },
  {
    id: 'p-2',
    name: 'Silla Oliva',
    sku: 'ALT-P-2018',
    line: 'Sillas de Espera',
    variants: { count: 3 },
    price: 110,
    priceFrom: false,
    status: 'approved',
    syncStatus: 'synced',
    lastUpdate: { label: 'Hoy 14:10', author: 'Andrea' },
  },
  {
    id: 'p-3',
    name: 'Silla Antonia',
    sku: 'ALT-P-3845',
    line: 'Sillas Ejecutivas',
    variants: { count: 4 },
    price: 145,
    priceFrom: true,
    status: 'approved',
    syncStatus: 'synced',
    lastUpdate: { label: 'Ayer 18:30', author: 'Rodrigo' },
  },
  {
    id: 'p-4',
    name: 'Sillón Bilbao ARM',
    sku: 'ALT-P-4182',
    line: 'Sillas Lounge',
    variants: { count: 1 },
    price: null,
    priceFrom: false,
    status: 'needsCorrection',
    syncStatus: 'notSynced',
    lastUpdate: { label: '19 sep 16:05', author: 'Andrea' },
  },
  {
    id: 'p-5',
    name: 'Mesa Terra',
    sku: 'ALT-P-5820',
    line: 'Mesas Auxiliares',
    variants: { count: 2 },
    price: 180,
    priceFrom: false,
    status: 'approved',
    syncStatus: 'synced',
    lastUpdate: { label: '18 sep 10:15', author: 'Jhonatan' },
  },
  {
    id: 'p-6',
    name: 'Silla Viena',
    sku: 'ALT-P-3390',
    line: 'Sillines',
    variants: { count: 2, label: 'Tapizadas' },
    price: 98,
    priceFrom: true,
    status: 'approved',
    syncStatus: 'synced',
    lastUpdate: { label: 'Hoy 09:40', author: 'Rodrigo' },
  },
  {
    id: 'p-7',
    name: 'Silla Pisa',
    sku: 'ALT-P-3910',
    line: 'Sillines',
    variants: { count: 1 },
    price: 89,
    priceFrom: false,
    status: 'approved',
    syncStatus: 'synced',
    lastUpdate: { label: 'Ayer 16:20', author: 'Jhonatan' },
  },
  {
    id: 'p-8',
    name: 'Mesa Aurora',
    sku: 'ALT-P-4402',
    line: 'Mesas Auxiliares',
    variants: { count: 3 },
    price: 210,
    priceFrom: true,
    status: 'pending',
    syncStatus: 'synced',
    lastUpdate: { label: 'Hoy 08:15', author: 'Andrea' },
  },
  {
    id: 'p-9',
    name: 'Silla Kyoto',
    sku: 'ALT-P-4471',
    line: 'Sillas Lounge',
    variants: { count: 2 },
    price: 265,
    priceFrom: false,
    status: 'approved',
    syncStatus: 'synced',
    lastUpdate: { label: '18 sep 12:05', author: 'Rodrigo' },
  },
  {
    id: 'p-10',
    name: 'Sillón Duna',
    sku: 'ALT-P-5120',
    line: 'Sillas Lounge',
    variants: { count: 1 },
    price: 320,
    priceFrom: false,
    status: 'approved',
    syncStatus: 'synced',
    lastUpdate: { label: '17 sep 15:45', author: 'Jhonatan' },
  },
  {
    id: 'p-11',
    name: 'Silla Bari',
    sku: 'ALT-P-5218',
    line: 'Sillas Operativas',
    variants: { count: 4, label: 'Sin brazos / Con brazos' },
    price: 78,
    priceFrom: true,
    status: 'approved',
    syncStatus: 'synced',
    lastUpdate: { label: 'Hoy 10:05', author: 'Andrea' },
  },
  {
    id: 'p-12',
    name: 'Silla Dublín',
    sku: 'ALT-P-5567',
    line: 'Sillas Ejecutivas',
    variants: { count: 2 },
    price: 168,
    priceFrom: true,
    status: 'pending',
    syncStatus: 'synced',
    lastUpdate: { label: 'Ayer 11:30', author: 'Rodrigo' },
  },
  {
    id: 'p-13',
    name: 'Silla Praga',
    sku: 'ALT-P-6035',
    line: 'Sillas de Espera',
    variants: { count: 3 },
    price: 120,
    priceFrom: true,
    status: 'approved',
    syncStatus: 'synced',
    lastUpdate: { label: '19 sep 09:20', author: 'Jhonatan' },
  },
  {
    id: 'p-14',
    name: 'Silla Lima',
    sku: 'ALT-P-6148',
    line: 'Sillas Operativas',
    variants: { count: 1 },
    price: 72,
    priceFrom: false,
    status: 'approved',
    syncStatus: 'synced',
    lastUpdate: { label: '16 sep 14:10', author: 'Andrea' },
  },
  {
    id: 'p-15',
    name: 'Mesa Lira',
    sku: 'ALT-P-6270',
    line: 'Mesas Auxiliares',
    variants: { count: 1 },
    price: null,
    priceFrom: false,
    status: 'noPrice',
    syncStatus: 'notSynced',
    lastUpdate: { label: '15 sep 17:25', author: 'Rodrigo' },
  },
  {
    id: 'p-16',
    name: 'Sillón Oslo',
    sku: 'ALT-P-6893',
    line: 'Sillas Lounge',
    variants: { count: 2 },
    price: 245,
    priceFrom: true,
    status: 'needsCorrection',
    syncStatus: 'synced',
    lastUpdate: { label: 'Ayer 09:50', author: 'Andrea' },
  },
];

const GENERATED_TOTAL = 131;

const GENERATED_STATUS_COUNTS: Record<ProductStatus, number> = {
  approved: 116,
  pending: 9,
  needsCorrection: 3,
  noPrice: 3,
};

const NAME_POOL = [
  'Silla Nova',
  'Silla Copenhague',
  'Silla Bologna',
  'Mesa Vega',
  'Mesa Atlas',
  'Sillón Rávena',
  'Silla Kioto Plus',
  'Mesa Nórdica',
  'Silla Trento',
  'Sillón Milán',
  'Silla Arosa',
  'Mesa Delta',
];

const SUFFIX_POOL = ['60', '70', '80', '100', '120', '140', '150', 'B', 'C', 'Plus', 'Pro'];

const VARIANT_LABEL_POOL = ['Tapizadas', 'Con brazos', 'En tela', 'En cuero', 'Con ruedas'];

const UPDATE_LABEL_POOL = [
  'Hoy 11:24',
  'Hoy 09:40',
  'Ayer 16:20',
  '18 sep 10:15',
  '19 sep 16:05',
  '16 sep 14:10',
  '17 sep 15:45',
];

function spreadStatuses(
  counts: Record<ProductStatus, number>,
  total: number
): ProductStatus[] {
  const statuses: ProductStatus[] = Array.from({ length: total }, () => 'approved');
  const specials: ProductStatus[] = [];
  (Object.keys(counts) as ProductStatus[]).forEach((status) => {
    if (status === 'approved') {
      return;
    }
    for (let index = 0; index < counts[status]; index++) {
      specials.push(status);
    }
  });
  const step = Math.max(1, Math.floor(total / (specials.length + 1)));
  specials.forEach((status, index) => {
    let position = Math.min(total - 1, (index + 1) * step);
    while (statuses[position] !== 'approved') {
      position = (position + 1) % total;
    }
    statuses[position] = status;
  });
  return statuses;
}

function generateProducts(): Product[] {
  const statuses = spreadStatuses(GENERATED_STATUS_COUNTS, GENERATED_TOTAL);
  let firstNoPriceIndex = -1;
  statuses.forEach((status, index) => {
    if (status === 'noPrice' && firstNoPriceIndex === -1) {
      firstNoPriceIndex = index;
    }
  });

  return Array.from({ length: GENERATED_TOTAL }, (_, index) => {
    const status = statuses[index] as ProductStatus;
    const variantCount = (index % 4) + 1;
    const price = status === 'noPrice' ? null : 65 + (index % 25) * 10;
    const syncStatus: ProductSyncStatus = index === firstNoPriceIndex ? 'notSynced' : 'synced';
    const variantLabel =
      index % 5 === 0 ? VARIANT_LABEL_POOL[index % VARIANT_LABEL_POOL.length] : undefined;

    return {
      id: `gen-${index + 1}`,
      name: `${NAME_POOL[index % NAME_POOL.length]} ${
        SUFFIX_POOL[Math.floor(index / NAME_POOL.length)]
      }`,
      sku: `ALT-P-${7000 + index}`,
      line: LINES[index % LINES.length] as ProductLine,
      variants: { count: variantCount, label: variantLabel },
      price,
      priceFrom: variantCount > 1,
      status,
      syncStatus,
      lastUpdate: {
        label: UPDATE_LABEL_POOL[index % UPDATE_LABEL_POOL.length] as string,
        author: AUTHORS[index % AUTHORS.length] as string,
      },
    };
  });
}

export const PRODUCTS: Product[] = [...EXPLICIT_PRODUCTS, ...generateProducts()];
