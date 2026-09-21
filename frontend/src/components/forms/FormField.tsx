'use client';

import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormField as UiFormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

interface FormFieldProps<TFieldValues extends FieldValues> {
  name: FieldPath<TFieldValues>;
  label: string;
  placeholder?: string;
  type?: string;
  control: Control<TFieldValues>;
  className?: string;
}

export function FormField<TFieldValues extends FieldValues>({
  name,
  label,
  placeholder,
  type = 'text',
  control,
  className,
}: FormFieldProps<TFieldValues>) {
  return (
    <UiFormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type={type} placeholder={placeholder} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
