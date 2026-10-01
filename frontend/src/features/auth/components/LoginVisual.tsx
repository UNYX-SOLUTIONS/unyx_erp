import Image from 'next/image';
import { Boxes, FileText, Package, Truck, type LucideIcon } from 'lucide-react';

interface VisualCard {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  position: string;
}

const VISUAL_CARDS: VisualCard[] = [
  {
    title: 'PEDIDOS',
    subtitle: 'Flujo comercial',
    icon: FileText,
    position: 'top-6 left-4 sm:left-8 lg:left-12',
  },
  {
    title: 'INVENTARIO',
    subtitle: 'Stock en tiempo real',
    icon: Boxes,
    position: 'top-6 right-4 sm:right-8 lg:right-12',
  },
  {
    title: 'PREPARACIÓN',
    subtitle: 'Picking & Packing',
    icon: Package,
    position: 'bottom-6 left-4 sm:left-8 lg:left-12',
  },
  {
    title: 'ENTREGAS',
    subtitle: 'Despacho & Rutas',
    icon: Truck,
    position: 'bottom-6 right-4 sm:right-8 lg:right-12',
  },
];

export function LoginVisual() {
  return (
    <aside className="relative hidden min-h-screen w-[55%] select-none flex-col justify-between overflow-hidden bg-[#050505] p-12 md:flex">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] opacity-20 [background-size:32px_32px]" />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(30, 64, 175, 0.18) 0%, rgba(30, 64, 175, 0.04) 45%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="z-10 flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.25em] text-slate-400">
            OPERACIÓN CONECTADA
          </span>
        </div>
        <div className="font-mono text-[9px] uppercase tracking-widest text-slate-500 dark:text-slate-400">
          PEDIDOS · INVENTARIO · PREPARACIÓN · ENTREGAS
        </div>
      </div>

      <div className="relative my-auto flex h-[590px] w-full items-center justify-center">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
          viewBox="0 0 680 590"
        >
          <circle cx="340" cy="295" r="238" stroke="#1e40af" strokeDasharray="4 6" strokeOpacity="0.18" strokeWidth="1" />
          <circle cx="340" cy="295" r="160" stroke="#1e40af" strokeOpacity="0.28" strokeWidth="1" />
          <circle cx="340" cy="295" r="96" stroke="#3b82f6" strokeDasharray="2 4" strokeOpacity="0.35" strokeWidth="1" />
          <line stroke="#1e40af" strokeOpacity="0.45" strokeWidth="1.2" x1="340" x2="165" y1="295" y2="135" />
          <circle cx="252" cy="215" fill="#60a5fa" r="2.5" />
          <circle cx="165" cy="135" fill="#1e40af" r="3" />
          <line stroke="#1e40af" strokeOpacity="0.45" strokeWidth="1.2" x1="340" x2="515" y1="295" y2="135" />
          <circle cx="428" cy="215" fill="#60a5fa" r="2.5" />
          <circle cx="515" cy="135" fill="#1e40af" r="3" />
          <line stroke="#1e40af" strokeOpacity="0.45" strokeWidth="1.2" x1="340" x2="165" y1="295" y2="455" />
          <circle cx="252" cy="375" fill="#60a5fa" r="2.5" />
          <circle cx="165" cy="455" fill="#1e40af" r="3" />
          <line stroke="#1e40af" strokeOpacity="0.45" strokeWidth="1.2" x1="340" x2="515" y1="295" y2="455" />
          <circle cx="428" cy="375" fill="#60a5fa" r="2.5" />
          <circle cx="515" cy="455" fill="#1e40af" r="3" />
        </svg>

        <div className="relative z-20 flex items-center justify-center">
          <div className="pointer-events-none absolute h-40 w-40 rounded-full bg-blue-700/20 blur-xl" />
          <div className="flex h-36 w-36 items-center justify-center rounded-full border border-blue-900/40 bg-black p-1 shadow-2xl transition-transform duration-300 hover:scale-105">
            <Image src="/logo-mark.svg" alt="UNYX Core" width={96} height={96} />
          </div>
        </div>

        {VISUAL_CARDS.map((card) => (
          <div
            key={card.title}
            className={`absolute z-20 flex items-center gap-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3.5 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-blue-900/20 ${card.position}`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-unyx-700">
              <card.icon className="h-5 w-5" />
            </div>
            <div className="pr-1">
              <span className="block text-[12px] font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                {card.title}
              </span>
              <span className="block font-mono text-[11px] text-slate-400">{card.subtitle}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="z-10 flex w-full items-center justify-between border-t border-slate-800/80 pt-5">
        <div className="w-full text-center">
          <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            UNYX ERP · Enterprise Suite
          </span>
        </div>
      </div>
    </aside>
  );
}
