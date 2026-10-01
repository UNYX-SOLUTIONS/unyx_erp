import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { BadgeDot } from '@/components/ui/badge-dot';
import { KNOWLEDGE_SCORE, SEGMENTED_BAR_SEGMENTS } from '../data/mock';
import { ScoreLegend } from './ScoreLegend';
import { SegmentedBar } from './SegmentedBar';

export function KnowledgeHero({ className }: { className?: string }) {
  return (
    <section className={className}>
      <div className="flex h-full flex-col rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-slate-100">
              Estado del conocimiento
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              Calidad y cobertura de la información para el asistente comercial
            </p>
          </div>
          <BadgeDot label={KNOWLEDGE_SCORE.status} tone="green" />
        </header>

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="text-5xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
            {KNOWLEDGE_SCORE.value}%
          </span>
          <span className="max-w-xs text-sm text-gray-500 dark:text-slate-400">{KNOWLEDGE_SCORE.label}</span>
        </div>

        <SegmentedBar segments={SEGMENTED_BAR_SEGMENTS} className="mt-5" />

        <ScoreLegend />

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 dark:border-slate-800 pt-4">
          <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            {KNOWLEDGE_SCORE.approvedRecords} registros aprobados para uso de la IA
          </span>
          <Link
            href="/ai/knowledge-base/summary"
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Ver auditoría completa
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </footer>
      </div>
    </section>
  );
}
