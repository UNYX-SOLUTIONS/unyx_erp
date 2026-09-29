import type { Metadata } from 'next';
import Image from 'next/image';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { LoginVisual } from '@/features/auth/components/LoginVisual';

export const metadata: Metadata = {
  title: 'Iniciar sesión',
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen w-full flex-col bg-white md:flex-row">
      <section className="z-10 flex min-h-screen w-full flex-col justify-between bg-white p-8 sm:p-12 md:w-[45%] lg:px-16 xl:px-20">
        <header className="flex items-center gap-3 pt-2">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-black shadow-sm">
            <Image src="/logo-mark.svg" alt="UNYX Isotipo" width={28} height={28} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-slate-900">UNYX</span>
            <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              ERP
            </span>
          </div>
        </header>

        <div className="mx-auto my-auto w-full max-w-[390px] py-10 md:py-4">
          <LoginForm />
        </div>

        <footer className="flex w-full items-center justify-between border-t border-slate-100/80 pb-2 pt-6 text-[11px] text-slate-400">
          <span className="tracking-wide">UNYX ERP · Enterprise Suite</span>
          <span className="tracking-wide">© 2026 UNYX Solutions</span>
        </footer>
      </section>

      <LoginVisual />
    </main>
  );
}
