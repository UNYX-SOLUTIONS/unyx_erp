'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/stores/auth-store';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    if (isHydrated && accessToken) {
      router.replace('/operations/dashboard');
    }
  }, [isHydrated, accessToken, router]);

  return <>{children}</>;
}
