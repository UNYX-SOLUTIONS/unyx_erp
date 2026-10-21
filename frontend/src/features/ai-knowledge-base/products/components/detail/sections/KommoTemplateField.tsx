'use client';

import { useEffect, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { MessageSquareText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormField } from '../FormField';
import { KommoTemplatePicker } from './KommoTemplatePicker';
import type { VariantsFormValues } from '../../../schemas/product-schema';
import type { KommoTemplateDto } from '../../../types/product.types';

interface KommoTemplateFieldProps {
  form: UseFormReturn<VariantsFormValues>;
  index: number;
  initialTemplate?: KommoTemplateDto | null;
}

export function KommoTemplateField({
  form,
  index,
  initialTemplate,
}: KommoTemplateFieldProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<KommoTemplateDto | null>(
    initialTemplate ?? null
  );
  const selectedId = form.watch(`variants.${index}.kommoTemplateId`);

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }
    if (selected?.id === selectedId) {
      return;
    }
    if (initialTemplate?.id === selectedId) {
      setSelected(initialTemplate);
    }
  }, [selectedId, initialTemplate, selected?.id]);

  const assign = (template: KommoTemplateDto) => {
    form.setValue(`variants.${index}.kommoTemplateId`, template.id, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setSelected(template);
  };

  const clear = () => {
    form.setValue(`variants.${index}.kommoTemplateId`, null, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setSelected(null);
  };

  return (
    <>
      <FormField label="Plantilla de Kommo" className="sm:col-span-2">
        {selected ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900/60 dark:bg-blue-950/20">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium text-gray-900 dark:text-slate-100">
                    {selected.name}
                  </span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    {selected.type}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 whitespace-pre-line text-xs text-gray-500 dark:text-slate-400">
                  {selected.content || 'Sin contenido'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(true)}
                  className="border-blue-200 bg-white text-blue-700 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-blue-300"
                >
                  Cambiar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clear}
                  className="gap-1 text-gray-500 hover:text-red-600 dark:text-slate-400"
                >
                  <X className="h-3.5 w-3.5" />
                  Quitar
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(true)}
            className="gap-2 border-dashed border-blue-300 bg-white text-blue-700 hover:bg-blue-50 dark:border-blue-900/60 dark:bg-slate-900 dark:text-blue-300"
          >
            <MessageSquareText className="h-4 w-4" />
            Buscar plantilla de Kommo
          </Button>
        )}
      </FormField>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Plantilla de Kommo</DialogTitle>
            <DialogDescription>
              Busca y asigna la plantilla que se usará para esta variante.
            </DialogDescription>
          </DialogHeader>
          <KommoTemplatePicker
            selectedId={selectedId ?? null}
            onSelect={(template) => {
              assign(template);
              setOpen(false);
            }}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-gray-300 text-gray-700 dark:border-slate-700 dark:text-slate-300"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
