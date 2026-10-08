'use client';

import { useEffect } from 'react';
import { useUiStore } from '@/stores/ui-store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUiStore((state) => state.theme);

  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = () => {
      root.classList.remove('light', 'dark');
      const resolved =
        theme === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : theme;
      root.classList.add(resolved);
    };

    applyTheme();

    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      media.addEventListener('change', applyTheme);
      return () => media.removeEventListener('change', applyTheme);
    }
  }, [theme]);

  return <>{children}</>;
}
