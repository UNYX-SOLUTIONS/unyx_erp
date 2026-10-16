// frontend/src/features/ai-knowledge-base/products/lib/compress-image.ts

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;
const SKIP_BELOW_BYTES = 400 * 1024;

/**
 * Optimiza la imagen en el navegador antes de subirla:
 * - Redimensiona a máx. 1600px (suficiente para catálogos, Kommo, Meta y web).
 * - Re-codifica a JPEG q0.82 (fondo blanco para PNG con transparencia).
 * - No toca GIF (animación) ni archivos que ya son pequeños/óptimos.
 * Si algo falla, devuelve el archivo original sin bloquear la subida.
 */
export async function compressImage(file: File): Promise<File> {
  if (file.type === 'image/gif' || file.size === 0) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;

    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
    const needsResize = scale < 1;
    const needsReencode = file.type !== 'image/jpeg' || file.size > SKIP_BELOW_BYTES;

    if (!needsResize && !needsReencode) {
      bitmap.close();
      return file;
    }

    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      bitmap.close();
      return file;
    }

    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, targetWidth, targetHeight);
    context.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY);
    });

    if (!blob || blob.size >= file.size) {
      return file;
    }

    const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], newName, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
