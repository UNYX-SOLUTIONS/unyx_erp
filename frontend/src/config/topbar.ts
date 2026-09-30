export type TopbarBadgeTone = 'green' | 'yellow' | 'orange' | 'red' | 'blue' | 'gray';

export interface TopbarBreadcrumbSegment {
  label: string;
  href?: string;
}

export interface TopbarPageConfig {
  breadcrumb?: TopbarBreadcrumbSegment[];
  badge?: string;
  badgeTone?: TopbarBadgeTone;
  subtitle?: string;
  action?: 'sync-knowledge';
  actionMeta?: string;
}

export const TOPBAR_PAGE_CONFIG: Record<string, TopbarPageConfig> = {
  '/ai/knowledge-base/summary': {
    breadcrumb: [
      { label: 'KB-01' },
      { label: 'Modelo IA' },
      { label: 'Resumen' },
    ],
    badge: 'Base operativa',
    badgeTone: 'green',
    action: 'sync-knowledge',
    actionMeta: 'Última sincronización: 21 Sep 2026, 16:32',
  },
  '/ai/knowledge-base/products': {
    breadcrumb: [
      { label: 'Inicio', href: '/operations/dashboard' },
      { label: 'Base de conocimiento', href: '/ai/knowledge-base/summary' },
      { label: 'Productos' },
    ],
    badge: 'KB-02 · Módulo IA',
    badgeTone: 'blue',
    subtitle: 'Base de conocimiento · Productos',
  },
};
