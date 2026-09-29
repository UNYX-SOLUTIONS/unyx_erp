import Image from 'next/image';
import { siteConfig } from '@/config/site';

export function SplashScreen() {
  return (
    <div className="relative flex min-h-screen select-none flex-col items-center justify-between overflow-hidden bg-slate-50 font-sans text-slate-900 antialiased">
      <div className="pointer-events-none absolute inset-0 animate-splash-in overflow-hidden">
        <div className="absolute -inset-6 animate-splash-drift bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] opacity-40 [background-size:24px_24px]" />
      </div>

      <div className="pointer-events-none flex w-full items-center justify-between px-8 pt-8 opacity-0">
        <span>UNYX</span>
        <span>Ready</span>
      </div>

      <main className="z-10 -mt-8 flex w-full max-w-md flex-col items-center px-6 text-center">
        <div className="relative mb-6 flex animate-splash-float items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-28 w-28 animate-splash-ripple rounded-full border border-blue-500/25 [animation-delay:350ms]" />
          </div>
          <div className="flex h-28 w-28 animate-splash-logo items-center justify-center overflow-hidden rounded-full bg-black shadow-sm ring-1 ring-slate-900/5 transition-transform duration-500 hover:scale-[1.02] [animation-delay:150ms]">
            <Image src="/logo-mark.svg" alt="UNYX ERP Logo" width={84} height={84} priority />
          </div>
        </div>

        <div className="mb-2.5 flex items-center justify-center gap-3">
          <span className="whitespace-nowrap text-3xl font-bold animate-splash-tracking text-slate-950 [animation-delay:300ms]">
            UNYX
          </span>
          <span className="animate-splash-in rounded-sm border border-slate-300/80 bg-slate-200/90 px-2.5 py-0.5 font-mono text-[12px] font-semibold uppercase tracking-wider text-slate-800 [animation-delay:550ms]">
            ERP
          </span>
        </div>

        <p className="mb-8 animate-splash-in text-[15px] font-medium tracking-normal text-slate-700 [animation-delay:750ms]">
          Gestión operativa, conectada.
        </p>

        <div className="flex w-64 animate-splash-in flex-col items-center [animation-delay:1000ms]">
          <div className="relative mb-3.5 h-1 w-full overflow-hidden rounded-full bg-slate-200/80">
            <div className="h-full w-full origin-left animate-indeterminate rounded-full bg-unyx-700" />
          </div>

          <div className="flex animate-pulseSubtle items-center gap-1.5 text-[13px] font-medium text-slate-600">
            <span>Preparando tu espacio de trabajo...</span>
          </div>
        </div>
      </main>

      <footer className="z-10 w-full animate-splash-in px-6 pb-8 text-center [animation-delay:1250ms]">
        <p className="mb-1 text-[12px] font-medium tracking-normal text-slate-400">
          UNYX ERP · Enterprise Suite
        </p>
        <p className="font-mono text-[11px] text-slate-400/80">{siteConfig.version}</p>
      </footer>
    </div>
  );
}
