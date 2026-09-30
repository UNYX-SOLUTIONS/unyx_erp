'use client';

import type { LucideIcon } from 'lucide-react';
import { CircleDot, ShieldCheck, SlidersHorizontal, Tags } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DetailTab = 'general' | 'variants' | 'specifications' | 'warranty';

interface TabConfig {
  id: DetailTab;
  label: string;
  icon: LucideIcon;
}

const TABS: TabConfig[] = [
  { id: 'general', label: 'General', icon: CircleDot },
  { id: 'variants', label: 'Variantes y precios', icon: Tags },
  { id: 'specifications', label: 'Especificaciones', icon: SlidersHorizontal },
  { id: 'warranty', label: 'Fuente y garantía', icon: ShieldCheck },
];

interface ProductDetailTabsProps {
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
  variantCount: number;
}

export function ProductDetailTabs({
  activeTab,
  onTabChange,
  variantCount,
}: ProductDetailTabsProps) {
  return (
    <div className="flex items-center gap-6 overflow-x-auto border-b border-gray-200 px-6">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex items-center gap-2 whitespace-nowrap border-b-2 py-3 text-sm font-medium transition-colors',
            activeTab === tab.id
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          )}
        >
          <tab.icon className="h-4 w-4" />
          {tab.label}
          {tab.id === 'variants' && (
            <span className="min-w-[20px] rounded-full bg-gray-100 px-1.5 py-0.5 text-center text-xs text-gray-600">
              {variantCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
