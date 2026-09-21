'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SplashScreen } from '@/components/SplashScreen';
import { useAuthStore } from '@/features/auth/stores/auth-store';

const SPLASH_MIN_DURATION_MS = 1800;

export default function SplashPage() {
  const router = useRouter();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [startedAt] = useState(() => Date.now());
  const redirected = useRef(false);

  useEffect(() => {
    if (!isHydrated || redirected.current) {
      return;
    }
    redirected.current = true;
    const target = accessToken ? '/dashboard' : '/login';
    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(0, SPLASH_MIN_DURATION_MS - elapsed);
    const timer = setTimeout(() => router.replace(target), remaining);
    return () => clearTimeout(timer);
  }, [isHydrated, accessToken, router, startedAt]);

  return <SplashScreen />;
}
