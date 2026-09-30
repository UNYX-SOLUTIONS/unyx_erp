export interface TopbarPageConfig {
  breadcrumb: string[];
  badge?: string;
  action?: 'sync-knowledge';
  actionMeta?: string;
}

export const TOPBAR_PAGE_CONFIG: Record<string, TopbarPageConfig> = {
  '/dashboard/ai/knowledge-base': {
    breadcrumb: ['KB-01', 'Modelo IA', 'Base de conocimiento'],
    badge: 'Base operativa',
    action: 'sync-knowledge',
    actionMeta: 'Última sincronización: 21 Sep 2026, 16:32',
  },
};
