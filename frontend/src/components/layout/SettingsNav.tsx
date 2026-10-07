// frontend/src/components/layout/SettingsNav.tsx

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SettingsNavGroup {
  title: string;
  items: { title: string; href: string }[];
}

const SETTINGS_NAV: SettingsNavGroup[] = [
  {
    title: 'Perfil',
    items: [{ title: 'Configuración del perfil', href: '/operations/settings/profile' }],
  },
  {
    title: 'Espacio de trabajo',
    items: [{ title: 'Configuración del espacio', href: '/operations/settings/company' }],
  },
  {
    title: 'Facturación',
    items: [{ title: 'Facturación', href: '/operations/settings/billing' }],
  },
  {
    title: 'Gestión de usuarios',
    items: [
      { title: 'Usuarios', href: '/operations/settings/users' },
      { title: 'Roles y permisos', href: '/operations/settings/roles' },
    ],
  },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <aside className="lg:sticky lg:top-20 lg:w-56 lg:shrink-0 lg:self-start">
      <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Ajustes
      </h2>
      <nav className="mt-3 space-y-4">
        {SETTINGS_NAV.map((group) => (
          <div key={group.title}>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
              {group.title}
            </p>
            <div className="mt-1 space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'block rounded-lg px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-blue-50 font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-100'
                    )}
                  >
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
