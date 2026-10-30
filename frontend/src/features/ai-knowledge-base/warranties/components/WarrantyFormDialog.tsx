'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useCreateWarranty, useUpdateWarranty } from '../hooks/useWarranties';
import type { WarrantyDto, WarrantyPayload } from '../types/warranty.types';

const warrantyFormSchema = z.object({
  meses: z
    .string()
    .trim()
    .max(4, 'Máximo 4 dígitos')
    .refine((value) => value === '' || /^\d+$/.test(value), 'Ingresa un número entero')
    .refine((value) => value === '' || Number(value) <= 1200, 'Máximo 1200 meses'),
  especial: z.string().trim().max(2000),
  observaciones: z.string().trim().max(4000),
  fuenteUrl: z
    .string()
    .trim()
    .max(500)
    .refine(
      (value) => value === '' || /^https?:\/\/.+/i.test(value),
      'Ingresa una URL http(s) válida'
    ),
  isActive: z.boolean(),
});

type WarrantyFormValues = z.infer<typeof warrantyFormSchema>;

function buildDefaults(warranty: WarrantyDto | null): WarrantyFormValues {
  return {
    meses: warranty?.meses === null || warranty?.meses === undefined ? '' : String(warranty.meses),
    especial: warranty?.especial ?? '',
    observaciones: warranty?.observaciones ?? '',
    fuenteUrl: warranty?.fuenteUrl ?? '',
    isActive: warranty?.isActive ?? true,
  };
}

interface WarrantyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warranty: WarrantyDto | null;
}

export function WarrantyFormDialog({
  open,
  onOpenChange,
  warranty,
}: WarrantyFormDialogProps) {
  const createWarranty = useCreateWarranty();
  const updateWarranty = useUpdateWarranty();
  const isSaving = createWarranty.isPending || updateWarranty.isPending;
  const isEditing = Boolean(warranty);

  const form = useForm<WarrantyFormValues>({
    resolver: zodResolver(warrantyFormSchema),
    defaultValues: buildDefaults(warranty),
  });

  useEffect(() => {
    if (open) {
      form.reset(buildDefaults(warranty));
    }
  }, [open, warranty, form]);

  const submit = form.handleSubmit((values) => {
    const payload: WarrantyPayload = {
      meses: values.meses === '' ? null : Number(values.meses),
      especial: values.especial || null,
      observaciones: values.observaciones || null,
      fuenteUrl: values.fuenteUrl || null,
      isActive: values.isActive,
    };

    if (warranty) {
      updateWarranty.mutate(
        { id: warranty.id, payload },
        { onSuccess: () => onOpenChange(false) }
      );
      return;
    }

    createWarranty.mutate(payload, {
      onSuccess: () => onOpenChange(false),
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar garantía' : 'Nueva garantía'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Actualiza la duración, condiciones o vigencia de la garantía.'
              : 'Crea una garantía para asignarla a las variantes desde el panel de producto.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="warranty-months">Meses de garantía</Label>
            <Input
              id="warranty-months"
              inputMode="numeric"
              placeholder="Ej. 12"
              {...form.register('meses')}
            />
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Opcional. Si la garantía no se expresa en meses, déjalo vacío.
            </p>
            {form.formState.errors.meses && (
              <p className="text-xs font-medium text-rose-600">
                {form.formState.errors.meses.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="warranty-special">Garantía especial</Label>
            <Textarea
              id="warranty-special"
              rows={3}
              placeholder="Ej. Estructura 5 años, tapizado 1 año, mecanismo 2 años…"
              {...form.register('especial')}
              className="resize-none"
            />
            {form.formState.errors.especial && (
              <p className="text-xs font-medium text-rose-600">
                {form.formState.errors.especial.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="warranty-observations">Observaciones</Label>
            <Textarea
              id="warranty-observations"
              rows={3}
              placeholder="Notas internas, condiciones de aplicación, exclusiones…"
              {...form.register('observaciones')}
              className="resize-none"
            />
            {form.formState.errors.observaciones && (
              <p className="text-xs font-medium text-rose-600">
                {form.formState.errors.observaciones.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="warranty-source">Fuente</Label>
            <Input
              id="warranty-source"
              placeholder="https://proveedor.com/garantia"
              {...form.register('fuenteUrl')}
            />
            {form.formState.errors.fuenteUrl && (
              <p className="text-xs font-medium text-rose-600">
                {form.formState.errors.fuenteUrl.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-slate-800">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                Garantía activa
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Las inactivas siguen visibles en administración y se marcan como inactivas.
              </p>
            </div>
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSaving}
                  aria-label="Garantía activa"
                />
              )}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="border-gray-300 text-gray-700 dark:border-slate-700 dark:text-slate-300"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isEditing ? 'Guardar cambios' : 'Crear garantía'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
