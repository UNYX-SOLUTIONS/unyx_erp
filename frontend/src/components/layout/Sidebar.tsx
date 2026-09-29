'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FOOTER_NAV, NAV_SECTIONS } from '@/config/navigation';
import { useUiStore } from '@/stores/ui-store';
import { usePermission } from '@/hooks/usePermission';
import { CompanySwitcher } from './CompanySwitcher';
import { NavItem } from './NavItem';
import { NavSection } from './NavSection';

export function Sidebar() {
  const pathname = usePathname();
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const { can } = usePermission();

  const footerItems = FOOTER_NAV.filter((item) => !item.permission || can(item.permission));

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-gray-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="flex h-16 items-center gap-2.5 border-b border-gray-200 px-4">
        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-black">
          <Image src="/logo-mark.svg" alt="Unyx ERP" width={22} height={22} />
        </div>
        <span className="text-base font-bold tracking-tight text-gray-900">UNYX</span>
        <span className="rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          ERP
        </span>
      </div>

      <CompanySwitcher />

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
        {NAV_SECTIONS.map((section) => (
          <NavSection key={section.title} section={section} pathname={pathname} />
        ))}
      </nav>

      <div className="border-t border-gray-200 p-2">
        {footerItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={pathname.startsWith(item.href)}
          />
        ))}
      </div>
    </aside>
  );
}
