import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-EC').format(value);
}

export function formatDate(date: string | Date, pattern = 'dd/MM/yyyy'): string {
  return format(new Date(date), pattern, { locale: es });
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: es });
}

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
}

export function formatLastUpdate(date: string | Date): string {
  const value = new Date(date);
  const time = format(value, 'HH:mm');
  if (isToday(value)) {
    return `Hoy ${time}`;
  }
  if (isYesterday(value)) {
    return `Ayer ${time}`;
  }
  return format(value, 'dd MMM HH:mm', { locale: es });
}

export function initials(firstName?: string | null, lastName?: string | null): string {
  return `${firstName?.charAt(0) ?? ''}${lastName?.charAt(0) ?? ''}`.toUpperCase();
}
