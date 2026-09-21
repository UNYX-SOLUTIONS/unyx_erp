'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAVIGATION } from '@/config/navigation';
import { usePermission } from '@/hooks/usePermission';
import { useUiStore } from '@/stores/ui-store';
import { Button } from '@/components/ui/button';
import { CompanySwitcher } from './CompanySwitcher';

export function Sidebar() {
  const pathname = usePathname();
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const { can } = usePermission();

  const visibleItems = NAVIGATION.filter((item) => !item.permission || can(item.permission));

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-background transition-transform duration-200 lg:static lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b px-4">
        <Image src="/logo.svg" alt="Unyx ERP" width={120} height={30} />
      </div>
      <CompanySwitcher />
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <div key={item.href}>
              <Button
                asChild
                variant={isActive ? 'secondary' : 'ghost'}
                className="w-full justify-start gap-2"
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  {item.title}
                  {item.children && <ChevronDown className="ml-auto h-4 w-4" />}
                </Link>
              </Button>
              {item.children && isActive && (
                <div className="ml-4 mt-1 space-y-1 border-l pl-2">
                  {item.children
                    .filter((child) => !child.permission || can(child.permission))
                    .map((child) => (
                      <Button
                        key={child.href}
                        asChild
                        variant={pathname === child.href ? 'secondary' : 'ghost'}
                        size="sm"
                        className="w-full justify-start gap-2"
                      >
                        <Link href={child.href}>
                          <child.icon className="h-4 w-4" />
                          {child.title}
                        </Link>
                      </Button>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
