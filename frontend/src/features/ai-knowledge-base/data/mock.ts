import {
  AlertTriangle,
  Library,
  MapPin,
  Package,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import type {
  ActivityItem,
  AiKpi,
  AttentionItem,
  ScoreLegendItem,
  SegmentedBarSegment,
  SyncItem,
} from '../types/knowledge-base-types';

export const KNOWLEDGE_SCORE = {
  value: 86,
  label: 'del conocimiento validado y disponible para la IA',
  status: 'Saludable',
  approvedRecords: 126,
};

export const SEGMENTED_BAR_SEGMENTS: SegmentedBarSegment[] = [
  { color: 'bg-green-500', width: 85, label: 'Aprobados' },
  { color: 'bg-yellow-400', width: 6, label: 'Pendientes' },
  { color: 'bg-red-400', width: 5, label: 'Requieren corrección' },
  { color: 'bg-gray-300', width: 4, label: 'Sin sincronizar' },
];

export const SCORE_LEGEND: ScoreLegendItem[] = [
  {
    id: 'approved',
    label: 'Aprobados',
    records: '126 registros',
    dotClass: 'bg-green-500',
  },
  {
    id: 'pending',
    label: 'Pendientes',
    records: '12 registros',
    sublabel: 'Por revisar 6 de 5 válidos',
    dotClass: 'bg-yellow-400',
  },
  {
    id: 'correction',
    label: 'Requieren corrección',
    records: '5 registros',
    sublabel: 'Incompletos',
    dotClass: 'bg-red-400',
  },
  {
    id: 'not-synced',
    label: 'Sin sincronizar',
    records: '4 registros',
    dotClass: 'bg-gray-300',
  },
];

export const ATTENTION_ITEMS: AttentionItem[] = [
  {
    id: 'att-1',
    icon: AlertTriangle,
    iconClass: 'bg-yellow-50 text-yellow-600',
    title: '12 productos pendientes de revisión',
    subtitle: 'Revisar la información antes de publicar.',
  },
  {
    id: 'att-2',
    icon: ShieldAlert,
    iconClass: 'bg-orange-50 text-orange-600',
    title: '4 garantías requieren validación',
    subtitle: 'Existen registros pendientes de aprobación.',
  },
  {
    id: 'att-3',
    icon: RefreshCw,
    iconClass: 'bg-blue-50 text-blue-600',
    title: '7 cambios aprobados sin sincronizar',
    subtitle: 'Los cambios locales no están disponibles para la IA.',
  },
];

export const AI_KPIS: AiKpi[] = [
  {
    id: 'products',
    label: 'Productos',
    value: 147,
    icon: Package,
    badge: '12 pendientes',
    badgeTone: 'yellow',
    footer: 'Modelos, tipos y piezas modulares',
  },
  {
    id: 'catalogs',
    label: 'Catálogos',
    value: 8,
    icon: Library,
    badge: 'Todos disponibles',
    badgeTone: 'green',
    footer: 'Líneas Ejecutiva, Home y Corporativo',
  },
  {
    id: 'locations',
    label: 'Ubicaciones',
    value: 3,
    icon: MapPin,
    badge: 'Todas aprobadas',
    badgeTone: 'green',
    footer: 'Bodega Central, Showroom Norte, Sur',
  },
  {
    id: 'warranties',
    label: 'Garantías',
    value: 111,
    icon: ShieldCheck,
    badge: '4 por revisar',
    badgeTone: 'yellow',
    footer: 'Pólizas estructurales, tejas y herrajes',
  },
];

export const SYNC_LAST_AT = '21 sep 2026 · 16:32';

export const SYNC_ITEMS: SyncItem[] = [
  {
    id: 'sync-products',
    icon: Package,
    label: 'Productos',
    description: '147 registros de producto',
    status: 'synced',
  },
  {
    id: 'sync-locations',
    icon: MapPin,
    label: 'Ubicaciones',
    description: '3 ubicaciones activas',
    status: 'synced',
  },
  {
    id: 'sync-catalogs',
    icon: Library,
    label: 'Catálogos',
    description: '8 catálogos comerciales vigentes',
    status: 'synced',
  },
  {
    id: 'sync-warranties',
    icon: ShieldCheck,
    label: 'Garantías',
    description: '111 garantías registradas',
    status: 'synced',
  },
];

export const ACTIVITY_ITEMS: ActivityItem[] = [
  {
    id: 'act-1',
    avatar: 'JS',
    avatarTone: 'blue',
    title: 'Producto actualizado',
    description: 'Silla Sandy · Variante "Taupé"',
    meta: { text: 'Modificado por "Jhonatan" · Listo para IA', tone: 'green' },
    time: 'Hace 12m',
  },
  {
    id: 'act-2',
    avatar: 'AN',
    avatarTone: 'yellow',
    title: 'Garantía modificada',
    description: 'Modificado hace 6 meses',
    meta: { text: 'Modificado por "Andrea" · Pendiente validación', tone: 'yellow' },
    time: 'Hace 45m',
  },
  {
    id: 'act-3',
    avatar: 'AN',
    avatarTone: 'green',
    title: 'Catálogo actualizado',
    description: 'Sillas de Oficina 2026',
    meta: { text: 'Publicado por "Andrea" · En línea', tone: 'green' },
    time: 'Hace 1h',
  },
  {
    id: 'act-4',
    avatar: 'SY',
    avatarTone: 'gray',
    title: 'Sincronización completada',
    description: '147 registros procesados con éxito',
    time: 'Hace 2h',
  },
];
