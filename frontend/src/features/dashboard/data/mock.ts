import {
  AlertCircle,
  AlertTriangle,
  ClipboardList,
  Package,
  PackageCheck,
  Truck,
} from 'lucide-react';
import type {
  AttentionItem,
  DashboardKpi,
  DeliveryItem,
  InventoryAlertItem,
  PreparationItem,
} from '../types/dashboard-types';

export const DASHBOARD_KPIS: DashboardKpi[] = [
  { id: 'pending-orders', label: 'Pedidos pendientes', value: 12, icon: ClipboardList, trend: 'neutral' },
  { id: 'picking', label: 'En picking', value: 6, icon: Package, trend: 'neutral' },
  { id: 'ready', label: 'Listos para despacho', value: 8, icon: PackageCheck, trend: 'neutral' },
  { id: 'today-deliveries', label: 'Entregas de hoy', value: 14, icon: Truck, trend: 'positive' },
  { id: 'late-deliveries', label: 'Entregas atrasadas', value: 3, icon: AlertCircle, trend: 'negative' },
  { id: 'open-incidents', label: 'Incidencias abiertas', value: 2, icon: AlertTriangle, trend: 'negative' },
];

export const ATTENTION_ITEMS: AttentionItem[] = [
  {
    id: 'att-1',
    pedido: '#PED-1048',
    cliente: 'Distribuidora del Norte S.A.',
    situacion: 'Stock insuficiente',
    situacionColor: 'red',
    responsableIniciales: 'MP',
    responsableNombre: 'María P.',
    registro: 'Hoy 08:38',
    accion: 'Ver pedido',
  },
  {
    id: 'att-2',
    pedido: '#PED-1042',
    cliente: 'Comercializadora Pacífico',
    situacion: 'Entrega atrasada (+45m)',
    situacionColor: 'orange',
    responsableIniciales: 'CM',
    responsableNombre: 'Carlos M.',
    registro: 'Ayer 17:15',
    accion: 'Ver entrega',
  },
  {
    id: 'att-3',
    pedido: '#PED-1039',
    cliente: 'Industrias San Mateo',
    situacion: 'Incidencia abierta',
    situacionColor: 'red',
    responsableIniciales: 'AR',
    responsableNombre: 'Andrea R.',
    registro: 'Hoy 09:10',
    accion: 'Ver incidencia',
  },
];

export const PREPARATION_ITEMS: PreparationItem[] = [
  {
    id: 'prep-1',
    pedido: '#PED-1051',
    cliente: 'Supermercados del V...',
    productos: '14 SKUs (120 uds)',
    responsable: 'Jorge L.',
    progreso: 75,
    estado: 'En picking',
    estadoColor: 'blue',
  },
  {
    id: 'prep-2',
    pedido: '#PED-1052',
    cliente: 'Logística Transandina',
    productos: '8 SKUs (45 uds)',
    responsable: 'María P.',
    progreso: 40,
    estado: 'Pendiente',
    estadoColor: 'gray',
  },
  {
    id: 'prep-3',
    pedido: '#PED-1049',
    cliente: 'Ferreterías Unidas',
    productos: '22 SKUs (310 uds)',
    responsable: 'Rodrigo T.',
    progreso: 100,
    estado: 'Listo despacho',
    estadoColor: 'green',
  },
  {
    id: 'prep-4',
    pedido: '#PED-1046',
    cliente: 'Horeca Provisiones',
    productos: '5 SKUs (28 uds)',
    responsable: 'Jorge L.',
    progreso: 85,
    estado: 'En picking',
    estadoColor: 'blue',
  },
];

export const DELIVERY_ITEMS: DeliveryItem[] = [
  { id: 'del-1', ventana: '09:00 - 11:00', pedido: '#PED-1045', estado: 'En ruta', estadoColor: 'blue' },
  { id: 'del-2', ventana: '11:00 - 13:00', pedido: '#PED-1047', estado: 'Programado', estadoColor: 'gray' },
  { id: 'del-3', ventana: '14:00 - 16:00', pedido: '#PED-1050', estado: 'Pendiente', estadoColor: 'gray' },
  { id: 'del-4', ventana: '08:30 - 10:00', pedido: '#PED-1041', estado: 'Entregado', estadoColor: 'green' },
];

export const INVENTORY_ALERTS: InventoryAlertItem[] = [
  {
    id: 'alert-1',
    sku: 'SKU-8821',
    producto: 'Aceite Industrial 20L',
    disponible: '2 unid. (Mín. 15)',
    estado: 'Stock bajo',
    estadoColor: 'yellow',
  },
  {
    id: 'alert-2',
    sku: 'SKU-4412',
    producto: 'Válvula de Presión 3/4"',
    disponible: '0 unid. (Agotado)',
    estado: 'Sin disponibilidad',
    estadoColor: 'red',
  },
  {
    id: 'alert-3',
    sku: 'SKU-1120',
    producto: 'Filtro de Alto Flujo F8',
    disponible: '5 unid. (Mín. 20)',
    estado: 'Stock bajo',
    estadoColor: 'yellow',
  },
];
