'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '@/features/auth/stores/auth-store';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    if (isHydrated && accessToken) {
      router.replace('/dashboard');
    }
  }, [isHydrated, accessToken, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-6">
      <div className="mb-8 flex items-center gap-3">
        <Image src="/logo.svg" alt="Unyx ERP" width={160} height={40} priority />
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
