'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { FormField } from '@/components/forms/FormField';
import { FormError } from '@/components/forms/FormError';
import { createProductSchema, type CreateProductFormValues } from '../schemas/product-schema';
import { useCreateProduct } from '../hooks/useCreateProduct';
import { getApiErrorMessage } from '@/lib/utils';
import { useState } from 'react';

export function ProductForm() {
  const router = useRouter();
  const createProduct = useCreateProduct();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: '',
      sku: '',
      barcode: '',
      description: '',
      salePrice: 0,
      costPrice: 0,
      minStock: 0,
      maxStock: 0,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    createProduct.mutate(
      {
        name: values.name,
        sku: values.sku,
        barcode: values.barcode || undefined,
        description: values.description || undefined,
        salePrice: values.salePrice,
        costPrice: values.costPrice,
        minStock: values.minStock,
        maxStock: values.maxStock,
      },
      {
        onSuccess: () => {
          toast.success('Producto creado');
          router.push('/dashboard/inventory');
        },
        onError: (error) => setFormError(getApiErrorMessage(error, 'No se pudo crear el producto')),
      }
    );
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuevo producto</CardTitle>
        <CardDescription>Registra la información básica del producto</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <FormField
              name="name"
              label="Nombre"
              placeholder="Laptop HP 15"
              control={form.control}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField name="sku" label="SKU" placeholder="LAP-HP-001" control={form.control} />
              <FormField
                name="barcode"
                label="Código de barras"
                placeholder="7861234567890"
                control={form.control}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                name="salePrice"
                label="Precio de venta"
                type="number"
                control={form.control}
              />
              <FormField
                name="costPrice"
                label="Precio de costo"
                type="number"
                control={form.control}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                name="minStock"
                label="Stock mínimo"
                type="number"
                control={form.control}
              />
              <FormField
                name="maxStock"
                label="Stock máximo"
                type="number"
                control={form.control}
              />
            </div>
            <FormField
              name="description"
              label="Descripción"
              placeholder="Descripción opcional del producto"
              control={form.control}
            />
            <FormError message={formError} />
            <div className="flex gap-2">
              <Button type="submit" disabled={createProduct.isPending}>
                {createProduct.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
