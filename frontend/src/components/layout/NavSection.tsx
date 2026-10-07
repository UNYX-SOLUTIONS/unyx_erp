'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavSection as NavSectionData } from '@/config/navigation';
import { usePermission } from '@/hooks/usePermission';
import { useUiStore } from '@/stores/ui-store';
import { NavItem } from './NavItem';

interface NavSectionProps {
  section: NavSectionData;
  pathname: string;
}

function isItemActive(pathname: string, href: string): boolean {
  if (href === '/operations/dashboard') {
    return pathname === '/operations/dashboard';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavSection({ section, pathname }: NavSectionProps) {
  const [openSubcategories, setOpenSubcategories] = useState<Record<string, boolean>>({});
  const { can } = usePermission();
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const setSidebarCollapsed = useUiStore((state) => state.setSidebarCollapsed);

  const items = section.items.filter((item) => !item.permission || can(item.permission));
  const subcategories = (section.subcategories ?? []).filter(
    (subcategory) => !subcategory.permission || can(subcategory.permission)
  );

  if (items.length === 0 && subcategories.length === 0) {
    return null;
  }

  const isSubcategoryOpen = (title: string) => openSubcategories[title] ?? true;

  const toggleSubcategory = (title: string) => {
    setOpenSubcategories((prev) => ({ ...prev, [title]: !(prev[title] ?? true) }));
  };

  const expandAndOpenSubcategory = (title: string) => {
    setSidebarCollapsed(false);
    setOpenSubcategories((prev) => ({ ...prev, [title]: true }));
  };

  if (collapsed) {
    return (
      <div className="space-y-0.5 pt-3 first:pt-1">
        <div className="mx-2 mb-1.5 border-t border-white/10" aria-hidden="true" />
        {items.map((item) => (
          <NavItem key={item.href} item={item} collapsed isActive={isItemActive(pathname, item.href)} />
        ))}
        {subcategories.map((subcategory) => (
          <button
            key={subcategory.title}
            type="button"
            title={subcategory.title}
            onClick={() => expandAndOpenSubcategory(subcategory.title)}
            className="flex w-full items-center justify-center rounded-lg px-0 py-2 text-slate-300 transition-colors hover:bg-white/15 hover:text-white"
          >
            <subcategory.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="sr-only">{subcategory.title}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div>
      <p className="px-3 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {section.title}
      </p>

      <div className="space-y-0.5">
        {items.map((item) => (
          <NavItem key={item.href} item={item} isActive={isItemActive(pathname, item.href)} />
        ))}

        {subcategories.map((subcategory) => {
          const isOpen = isSubcategoryOpen(subcategory.title);

          return (
            <div key={subcategory.title}>
              <button
                type="button"
                onClick={() => toggleSubcategory(subcategory.title)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <subcategory.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{subcategory.title}</span>
                </span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400 transition-transform',
                    !isOpen && '-rotate-90'
                  )}
                  aria-hidden="true"
                />
              </button>
              {isOpen && (
                <div className="space-y-0.5">
                  {subcategory.items
                    .filter((item) => !item.permission || can(item.permission))
                    .map((item) => (
                      <NavItem
                        key={item.href}
                        item={item}
                        indented
                        isActive={isItemActive(pathname, item.href)}
                      />
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
