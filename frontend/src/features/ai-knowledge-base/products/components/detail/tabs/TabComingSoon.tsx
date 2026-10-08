import type { LucideIcon } from 'lucide-react';

interface TabComingSoonProps {
  icon: LucideIcon;
  message: string;
}

export function TabComingSoon({ icon: Icon, message }: TabComingSoonProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-gray-300 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500">
        <Icon className="h-6 w-6" />
      </span>
      <p className="text-sm font-medium text-gray-900 dark:text-slate-100">Próximamente</p>
      <p className="max-w-md text-xs text-gray-500 dark:text-slate-400">{message}</p>
    </div>
  );
}
