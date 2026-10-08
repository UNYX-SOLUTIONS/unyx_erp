import Image from 'next/image';
import { Boxes, FileText, Package, Truck, type LucideIcon } from 'lucide-react';

interface VisualCard {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  left: number;
  top: number;
}

const ORBIT_DURATION = '120s';

// Extremos de las líneas de la constelación (viewBox 680x590) → % del escenario
const VISUAL_CARDS: VisualCard[] = [
  {
    title: 'PEDIDOS',
    subtitle: 'Flujo comercial',
    icon: FileText,
    left: 22.65,
    top: 21.19,
  },
  {
    title: 'INVENTARIO',
    subtitle: 'Stock en tiempo real',
    icon: Boxes,
    left: 77.35,
    top: 21.19,
  },
  {
    title: 'PREPARACIÓN',
    subtitle: 'Picking & Packing',
    icon: Package,
    left: 22.65,
    top: 78.81,
  },
  {
    title: 'ENTREGAS',
    subtitle: 'Despacho & Rutas',
    icon: Truck,
    left: 77.35,
    top: 78.81,
  },
];

const PLANETS = [
  {
    duration: '18s',
    reverse: false,
    delay: '0s',
    cx: 448,
    r: 3,
    fill: '#60a5fa',
    glowR: 7,
    glowFill: 'rgba(96, 165, 250, 0.22)',
  },
  {
    duration: '30s',
    reverse: true,
    delay: '-12s',
    cx: 516,
    r: 4.5,
    fill: '#3b82f6',
    glowR: 10,
    glowFill: 'rgba(59, 130, 246, 0.18)',
  },
  {
    duration: '48s',
    reverse: false,
    delay: '0s',
    cx: 596,
    r: 3.5,
    fill: '#93c5fd',
    glowR: 8,
    glowFill: 'rgba(147, 197, 253, 0.15)',
  },
  {
    duration: '48s',
    reverse: false,
    delay: '-24s',
    cx: 596,
    r: 2.5,
    fill: '#1e40af',
    glowR: 6,
    glowFill: 'rgba(30, 64, 175, 0.25)',
  },
];

export function LoginVisual() {
  return (
    <aside className="relative hidden min-h-screen w-[55%] select-none flex-col justify-between overflow-hidden bg-[#050505] p-12 lg:flex">
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
      
        </div>
        <div className="font-mono text-[9px] uppercase tracking-widest text-slate-500 dark:text-slate-400">
           Todo en uno
        </div>
      </div>

      <div className="relative my-auto flex w-full items-center justify-center">
        <div className="relative aspect-[680/590] w-full max-w-[min(820px,calc((100vh_-_280px)*680/590))]">
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            fill="none"
            preserveAspectRatio="xMidYMid meet"
            viewBox="0 0 680 590"
          >
            {/* Órbitas */}
            <circle cx="340" cy="295" r="256" stroke="#1e40af" strokeDasharray="4 6" strokeOpacity="0.18" strokeWidth="1" />
            <circle cx="340" cy="295" r="176" stroke="#1e40af" strokeOpacity="0.28" strokeWidth="1" />
            <circle cx="340" cy="295" r="108" stroke="#3b82f6" strokeDasharray="2 4" strokeOpacity="0.35" strokeWidth="1" />

            {/* Balizas hacia cada módulo (giran con las cards, sin tocarlas) */}
            <g className="orbit-spin orbit-svg" style={{ animationDuration: ORBIT_DURATION }}>
              <line stroke="#1e40af" strokeOpacity="0.45" strokeWidth="1.2" x1="340" x2="253" y1="295" y2="215" />
              <circle cx="253" cy="215" fill="rgba(96, 165, 250, 0.2)" r="5" />
              <circle cx="253" cy="215" fill="#60a5fa" r="2.5" />
              <line stroke="#1e40af" strokeOpacity="0.45" strokeWidth="1.2" x1="340" x2="427" y1="295" y2="215" />
              <circle cx="427" cy="215" fill="rgba(96, 165, 250, 0.2)" r="5" />
              <circle cx="427" cy="215" fill="#60a5fa" r="2.5" />
              <line stroke="#1e40af" strokeOpacity="0.45" strokeWidth="1.2" x1="340" x2="253" y1="295" y2="375" />
              <circle cx="253" cy="375" fill="rgba(96, 165, 250, 0.2)" r="5" />
              <circle cx="253" cy="375" fill="#60a5fa" r="2.5" />
              <line stroke="#1e40af" strokeOpacity="0.45" strokeWidth="1.2" x1="340" x2="427" y1="295" y2="375" />
              <circle cx="427" cy="375" fill="rgba(96, 165, 250, 0.2)" r="5" />
              <circle cx="427" cy="375" fill="#60a5fa" r="2.5" />
            </g>

            {/* Planetas orbitando */}
            {PLANETS.map((planet, index) => (
              <g
                key={index}
                className={
                  planet.reverse ? 'orbit-spin orbit-svg orbit-reverse' : 'orbit-spin orbit-svg'
                }
                style={{ animationDuration: planet.duration, animationDelay: planet.delay }}
              >
                <circle cx={planet.cx} cy="295" fill={planet.glowFill} r={planet.glowR} />
                <circle cx={planet.cx} cy="295" fill={planet.fill} r={planet.r} />
              </g>
            ))}
          </svg>

          {/* Sol (logo) */}
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="pointer-events-none absolute h-40 w-40 animate-pulse rounded-full bg-blue-600/25 blur-xl motion-reduce:animate-none" />
            <div className="flex h-36 w-36 items-center justify-center rounded-full border border-blue-900/40 p-1 shadow-2xl transition-transform duration-300 hover:scale-105">
              <Image src="/logo.svg" alt="UNYX Core" width={140} height={140} />
            </div>
          </div>

          {/* Cards girando alineadas con la constelación */}
          <div
            className="orbit-spin pointer-events-none absolute inset-0 z-20"
            style={{ animationDuration: ORBIT_DURATION }}
          >
            {VISUAL_CARDS.map((card, index) => (
              <div
                key={card.title}
                className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${card.left}%`, top: `${card.top}%` }}
              >
                <div
                  className="orbit-spin orbit-reverse"
                  style={{ animationDuration: ORBIT_DURATION }}
                >
                  <div className="float-soft" style={{ animationDelay: `-${index * 1.6}s` }}>
                    <div className="flex items-center gap-3.5 rounded-xl px-2 py-2 text-slate-400 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-blue-800/20 hover:text-slate-100 hover:shadow-blue-800/20">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                        <card.icon className="h-5 w-5" />
                      </div>
                      <div className="pr-1">
                        <span className="block whitespace-nowrap text-[12px] font-bold uppercase tracking-wider">
                          {card.title}
                        </span>
                        <span className="block whitespace-nowrap font-mono text-[11px]">
                          {card.subtitle}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
