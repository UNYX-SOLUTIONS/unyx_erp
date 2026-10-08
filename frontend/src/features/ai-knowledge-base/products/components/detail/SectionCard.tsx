import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface SectionCardProps {
  icon: LucideIcon;
  title: string;
  headerRight?: ReactNode;
  children: ReactNode;
}

export function SectionCard({ icon: Icon, title, headerRight, children }: SectionCardProps) {
  return (
    <section className="rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
          <Icon className="h-3.5 w-3.5" />
          {title}
        </h3>
        {headerRight && <div>{headerRight}</div>}
      </div>
      {children}
    </section>
  );
}
