import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-muted-foreground">La página que buscas no existe.</p>
      <Button asChild>
        <Link href="/operations/dashboard">Volver al inicio</Link>
      </Button>
    </div>
  );
}
