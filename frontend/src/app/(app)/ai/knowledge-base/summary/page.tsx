import type { Metadata } from 'next';
import { ActivityPanel } from '@/features/ai-knowledge-base/components/ActivityPanel';
import { AiKpiGrid } from '@/features/ai-knowledge-base/components/AiKpiGrid';
import { AttentionPanel } from '@/features/ai-knowledge-base/components/AttentionPanel';
import { KnowledgeHero } from '@/features/ai-knowledge-base/components/KnowledgeHero';
import { SyncPanel } from '@/features/ai-knowledge-base/components/SyncPanel';

export const metadata: Metadata = {
  title: 'Resumen · Base de conocimiento IA',
};

export default function KnowledgeSummaryPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <KnowledgeHero className="lg:col-span-2" />
        <AttentionPanel />
      </div>

      <AiKpiGrid />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SyncPanel />
        <ActivityPanel />
      </div>
    </div>
  );
}
