import { AlertCircle } from 'lucide-react';

export function FormError({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }
  return (
    <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
