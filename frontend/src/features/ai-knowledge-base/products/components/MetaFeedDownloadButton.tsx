'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';

export function MetaFeedDownloadButton() {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await apiClient.get(
        '/integrations/altosa/meta-feed.csv',
        {
          params: { scope: 'published' },
          responseType: 'blob',
          timeout: 60_000,
        }
      );
      const blobUrl = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'altosa-meta-catalog.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
      toast.success('CSV de Meta descargado');
    } catch {
      toast.error('No se pudo descargar el CSV de Meta');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleDownload}
      disabled={isDownloading}
      className="gap-1.5"
    >
      {isDownloading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {isDownloading ? 'Generando CSV…' : 'Descargar CSV Meta'}
    </Button>
  );
}
