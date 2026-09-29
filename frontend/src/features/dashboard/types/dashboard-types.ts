import type { LucideIcon } from 'lucide-react';

export type StatusColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'gray';

export type KpiTrend = 'neutral' | 'positive' | 'negative';

export interface DashboardKpi {
  id: string;
  label: string;
  value: number;
  icon: LucideIcon;
  trend: KpiTrend;
}

export interface AttentionItem {
  id: string;
  pedido: string;
  cliente: string;
  situacion: string;
  situacionColor: StatusColor;
  responsableIniciales: string;
  responsableNombre: string;
  registro: string;
  accion: string;
}

export interface PreparationItem {
  id: string;
  pedido: string;
  cliente: string;
  productos: string;
  responsable: string;
  progreso: number;
  estado: string;
  estadoColor: StatusColor;
}

export interface DeliveryItem {
  id: string;
  ventana: string;
  pedido: string;
  estado: string;
  estadoColor: StatusColor;
}

export interface InventoryAlertItem {
  id: string;
  sku: string;
  producto: string;
  disponible: string;
  estado: string;
  estadoColor: StatusColor;
}
