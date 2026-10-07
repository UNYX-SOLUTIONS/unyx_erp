// frontend/src/features/orders/types/order.types.ts

export type OrderStatus =
  | 'DRAFT'                    // Borrador
  | 'RESERVED'                 // Reservado
  | 'IN_PROGRESS'              // En proceso
  | 'DELIVERED'                // Entregado
  | 'PAYMENT_PENDING'          // Pendiente de aprobación de pago
  | 'PREPARING'                // En preparación
  | 'IN_TRANSFER'              // Transferencia
  | 'READY_TO_SHIP'            // Listo para despacho
  | 'IN_ROUTE'                 // En ruta
  | 'WITH_ISSUE';              // Con novedad

export type OrderTabFilter =
  | 'ALL'
  | 'DRAFT'
  | 'RESERVED'
  | 'IN_PROGRESS'
  | 'DELIVERED'
  | 'WITH_ISSUE';

export interface OrderStatusMeta {
  label: string;
  color: 'gray' | 'blue' | 'yellow' | 'orange' | 'green' | 'red' | 'purple';
  tab: OrderTabFilter;
}

export const ORDER_STATUS_META: Record<OrderStatus, OrderStatusMeta> = {
  DRAFT:            { label: 'Borrador - Productos',        color: 'gray',   tab: 'DRAFT' },
  RESERVED:         { label: 'Reservado',                   color: 'blue',   tab: 'RESERVED' },
  PAYMENT_PENDING:  { label: 'Pendiente de aprobación de pago', color: 'blue', tab: 'IN_PROGRESS' },
  PREPARING:        { label: 'En preparación',              color: 'yellow', tab: 'IN_PROGRESS' },
  IN_TRANSFER:      { label: 'Transferencia',               color: 'yellow', tab: 'IN_PROGRESS' },
  READY_TO_SHIP:    { label: 'Listo para despacho',         color: 'blue',   tab: 'IN_PROGRESS' },
  IN_ROUTE:         { label: 'En ruta',                     color: 'blue',   tab: 'IN_PROGRESS' },
  DELIVERED:        { label: 'Entregado',                   color: 'green',  tab: 'DELIVERED' },
  WITH_ISSUE:       { label: 'Con novedad',                 color: 'red',    tab: 'WITH_ISSUE' },
  IN_PROGRESS:      { label: 'En proceso',                  color: 'blue',   tab: 'IN_PROGRESS' },
};

export interface OrderCustomer {
  id: string;
  name: string;
  ruc: string;
  contactName?: string;
  phone?: string;
  linkedToKommo?: boolean;
  address?: string;
  city?: string;
}

export interface OrderLead {
  id: string;
  code: string;           // #8421
  name: string;           // Venta mobiliario oficina
  stage: 'Negociación' | 'Cotización' | 'Propuesta' | 'Ganada' | 'Perdida';
  total: number;
  responsibleInitials: string;
  responsibleName: string;
  status: 'SELECTED' | 'AVAILABLE' | 'IN_ATTENTION';
}

export interface OrderItem {
  id: string;
  productSku: string;       // ALT-P-1042
  productName: string;      // Silla Sandy
  productLine: string;      // Sillines Tapizadas
  variantSku: string;       // 095-B
  variantName: string;      // Negro
  variantStockStatus: 'AVAILABLE' | 'BETWEEN_WAREHOUSES' | 'LOW_STOCK';
  variantStockLabel?: string;
  quantity: number;
  gye: number;              // stock Guayaquil
  uio: number;              // stock Quito
  price: number;
  discount: number;         // porcentaje
  subtotal: number;
}

export interface Order {
  id: string;               // #PED-1057
  customer: OrderCustomer;
  date: string;             // ISO
  dateLabel: string;        // "Hoy 18:35"
  total: number;
  status: OrderStatus;
  statusDetail?: string;    // texto adicional mostrado en el badge
  hasIssue?: boolean;
}

export interface DeliveryInfo {
  modality: 'HOME_DELIVERY' | 'STORE_PICKUP' | 'TO_BE_ARRANGED';
  address: string;
  city: string;
  sector: string;
  contactName: string;
  contactPhone: string;
  preferredDate: string;
  preferredTimeSlot: 'MORNING' | 'AFTERNOON' | 'EVENING';
  notes: string;
}

export interface OrderTotals {
  subtotal: number;
  discount: number;
  base: number;
  iva: number;
  total: number;
}

export interface WizardState {
  currentStep: 1 | 2 | 3 | 4;
  customer: OrderCustomer | null;
  lead: OrderLead | null;
  items: OrderItem[];
  delivery: DeliveryInfo;
  totals: OrderTotals;
}