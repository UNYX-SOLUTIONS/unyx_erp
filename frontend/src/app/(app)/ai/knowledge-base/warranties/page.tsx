import type { Metadata } from 'next';
import { WarrantiesPageContent } from '@/features/ai-knowledge-base/warranties/components/WarrantiesPageContent';

export const metadata: Metadata = {
  title: 'Garantías IA',
};

export default function KnowledgeWarrantiesPage() {
  return <WarrantiesPageContent />;
}
