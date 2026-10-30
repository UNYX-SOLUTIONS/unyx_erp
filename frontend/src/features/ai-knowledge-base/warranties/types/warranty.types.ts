export interface WarrantyEstadoDto {
  id: number;
  estado: string;
  permiteRag: boolean;
}

export interface WarrantyDto {
  id: number;
  meses: number | null;
  especial: string | null;
  observaciones: string | null;
  fuenteUrl: string | null;
  estado: WarrantyEstadoDto | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WarrantyPayload {
  meses?: number | null;
  especial?: string | null;
  observaciones?: string | null;
  fuenteUrl?: string | null;
  isActive?: boolean;
}
