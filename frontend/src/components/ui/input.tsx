// frontend/src/components/ui/input.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base
          'flex h-10 w-full rounded-md bg-background px-3 py-2 text-sm',
          // Un solo borde, controlado con box-shadow interno (más nítido que border)
          'border-0 shadow-[inset_0_0_0_1px_hsl(var(--input))]',
          // Placeholder
          'placeholder:text-muted-foreground',
          // Transición suave
          'transition-shadow duration-150',
          // Focus: el borde interno cambia a azul Y se engrosa a 2px
          'focus:outline-none focus:shadow-[inset_0_0_0_2px_hsl(var(--ring))]',
          // Error de validación
          'aria-[invalid=true]:shadow-[inset_0_0_0_2px_hsl(var(--destructive))]',
          // Disabled
          'disabled:cursor-not-allowed disabled:opacity-50',
          // File input
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };