import type { Metadata } from 'next';
import { ProductsPageContent } from '@/features/ai-knowledge-base/products/components/ProductsPageContent';

export const metadata: Metadata = {
  title: 'Productos · Base de conocimiento IA',
};

export default function KnowledgeProductsPage() {
  return <ProductsPageContent />;
}
