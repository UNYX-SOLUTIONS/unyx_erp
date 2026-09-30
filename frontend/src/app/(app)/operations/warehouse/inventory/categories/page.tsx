import type { Metadata } from 'next';
import { Tags } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Categorías',
};

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Categorías</h1>
        <p className="text-muted-foreground">Organiza tus productos por categorías</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Tags className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Módulo en construcción</CardTitle>
              <CardDescription>
                El módulo de categorías se conectará al endpoint de categorías del backend.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            La estructura ya está lista para agregar el código.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
