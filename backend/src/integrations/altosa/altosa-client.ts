import { env } from '../../config/env';
import { ApiError } from '../../utils/api-error';
import type { PaginationMeta } from '../../utils/pagination';

interface AltosaResponseBody<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
  message?: string;
  code?: string;
}

const TIMEOUT_MS = 10_000;

function requireApiKey(): string {
  if (!env.ALTOSA_API_KEY) {
    throw new ApiError(
      503,
      'La integración con Altosa no está configurada (falta ALTOSA_API_KEY).',
      'ALTOSA_NOT_CONFIGURED'
    );
  }
  return env.ALTOSA_API_KEY;
}

/**
 * Cliente HTTP hacia el API interno de Altosa (servicio-a-servicio).
 * Nunca se expone al frontend: el navegador solo habla con el ERP.
 */
export async function altosaRequest<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  options?: {
    query?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
  }
): Promise<{ data: T; meta?: PaginationMeta }> {
  const apiKey = requireApiKey();

  const url = new URL(path, env.ALTOSA_API_URL);
  if (options?.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'x-api-key': apiKey,
        ...(options?.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(options?.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
      signal: controller.signal,
    });

    const body = (await response.json().catch(() => null)) as AltosaResponseBody<T> | null;

    if (!response.ok || !body?.success) {
      throw new ApiError(
        502,
        body?.message ?? `El API de Altosa respondió con estado ${response.status}.`,
        'ALTOSA_API_ERROR'
      );
    }

    return { data: body.data, meta: body.meta };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(504, 'Tiempo de espera agotado consultando Altosa.', 'ALTOSA_TIMEOUT');
    }
    throw new ApiError(502, 'No se pudo conectar con el API de Altosa.', 'ALTOSA_UNREACHABLE');
  } finally {
    clearTimeout(timeout);
  }
}

export async function altosaGet<T>(
  path: string,
  query?: Record<string, string | number | boolean | undefined>
): Promise<{ data: T; meta?: PaginationMeta }> {
  return altosaRequest<T>('GET', path, { query });
}
