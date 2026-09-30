'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavSection as NavSectionData } from '@/config/navigation';
import { usePermission } from '@/hooks/usePermission';
import { NavItem } from './NavItem';

interface NavSectionProps {
  section: NavSectionData;
  pathname: string;
}

function isItemActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') {
    return pathname === '/dashboard';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavSection({ section, pathname }: NavSectionProps) {
  const [openSubcategories, setOpenSubcategories] = useState<Record<string, boolean>>({});
  const { can } = usePermission();

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

  return (
    <div>
      <p className="px-3 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
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
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <subcategory.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{subcategory.title}</span>
                </span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform',
                    !isOpen && '-rotate-90'
                  )}
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
