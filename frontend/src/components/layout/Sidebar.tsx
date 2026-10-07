'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ChevronLeft, ChevronRight, HelpCircle, Settings, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { NAV_SECTIONS } from '@/config/navigation';
import { useUiStore } from '@/stores/ui-store';
import { NavSection } from './NavSection';
import { CompanySwitcher } from './CompanySwitcher';
import { ThemeOptions } from './ThemeOptions';
import { UserMenu } from './UserMenu';

const CONFIG_HREF = '/operations/settings/profile';
const SUPPORT_EMAIL = 'soporte@unyxsolutions.com';
const NOTIFICATIONS_COUNT = 7;

export function Sidebar() {
  const pathname = usePathname();
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const setCollapsed = useUiStore((state) => state.setSidebarCollapsed);

  const handleNotifications = () => {
    toast('Notificaciones', {
      description: 'Esta sección se conectará al backend próximamente.',
    });
  };

  return (
    <>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[240px] transform flex-col border-r border-slate-800 bg-black transition-all duration-200 dark:border-slate-700 dark:bg-slate-800 lg:static lg:translate-x-0',
          collapsed && 'lg:w-[76px]',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div
          className={cn(
            'flex h-16 shrink-0 items-center border-b border-white/10',
            collapsed ? 'justify-center px-0' : 'gap-2.5 px-4'
          )}
        >
          {collapsed ? (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              aria-label="Expandir menú"
              title="Expandir menú"
              className="group relative hidden h-15 w-15 items-center justify-center rounded-lg transition-colors hover:bg-white/5 lg:flex"
            >
              <Image
                src="/web-app-manifest-192x192.png"
                alt="Unyx ERP"
                width={40}
                height={40}
                className="h-[40px] w-[40px] object-contain transition-opacity duration-150 group-hover:opacity-0"
              />
              <ChevronRight
                className="absolute h-6 w-6 text-slate-300 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                aria-hidden="true"
              />
            </button>
          ) : (
            <>
              <Link
                href="/operations/dashboard"
                className="flex min-w-0 items-center gap-2.5"
                aria-label="Ir al inicio"
              >
                <span className="flex h-15 w-15 shrink-0 items-center justify-center overflow-hidden p-0.5 ml-1 mt-1">
                  <Image src="/logo.png" alt="Unyx ERP" width={75} height={75} />
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                aria-label="Colapsar menú"
                title="Colapsar menú"
                className="ml-auto hidden rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/5 hover:text-white lg:flex"
              >
                <ChevronLeft className="h-6 w-6 shrink-0" aria-hidden="true" />
              </button>
            </>
          )}
        </div>

        {!collapsed && <CompanySwitcher />}

        <nav className="scrollbar-hide flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
          {NAV_SECTIONS.map((section) => (
            <NavSection key={section.title} section={section} pathname={pathname} />
          ))}
        </nav>

        <div className="border-t border-white/10 p-2">
          <button
            type="button"
            onClick={handleNotifications}
            title={collapsed ? 'Notificaciones' : undefined}
            className={cn(
              'relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white',
              collapsed && 'justify-center px-0'
            )}
          >
            <Bell className="h-4 w-4 shrink-0" aria-hidden="true" />
            {!collapsed && <span className="truncate">Notificaciones</span>}
            {NOTIFICATIONS_COUNT > 0 && (
              <span
                className={cn(
                  'flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white',
                  collapsed ? 'absolute right-2 top-1 h-4 min-w-4 px-1 text-[9px]' : 'ml-auto'
                )}
              >
                {NOTIFICATIONS_COUNT}
              </span>
            )}
          </button>

          <div className="group/config relative">
            <Link
              href={CONFIG_HREF}
              aria-current={pathname.startsWith(CONFIG_HREF) ? 'page' : undefined}
              title={collapsed ? 'Configuración' : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white',
                collapsed && 'justify-center px-0'
              )}
            >
              <Settings className="h-4 w-4 shrink-0" aria-hidden="true" />
              {!collapsed && <span className="truncate">Configuración</span>}
            </Link>

            <div
              className="
                pointer-events-none invisible absolute bottom-0 left-full z-50 ml-2 w-56
                translate-x-1 rounded-xl border border-slate-200 dark:border-slate-700
                bg-white dark:bg-slate-900 p-1.5 opacity-0 shadow-xl
                transition-all duration-150
                group-hover/config:visible group-hover/config:pointer-events-auto
                group-hover/config:translate-x-0 group-hover/config:opacity-100
                group-focus-within/config:visible group-focus-within/config:pointer-events-auto
                group-focus-within/config:translate-x-0 group-focus-within/config:opacity-100
              "
            >
              <Link
                href={CONFIG_HREF}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                Configuración del perfil
              </Link>

              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

              <p className="px-3 pb-0.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Tema
              </p>
              <ThemeOptions />
            </div>
          </div>

          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            title={collapsed ? 'Soporte' : undefined}
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white',
              collapsed && 'justify-center px-0'
            )}
          >
            <HelpCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {!collapsed && <span className="truncate">Soporte</span>}
          </a>
        </div>

        <div className="border-t border-white/10 p-2">
          <UserMenu variant="sidebar" collapsed={collapsed} />
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
