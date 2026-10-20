/**
 * DTOs de la API de Contifico (inventario).
 *
 * Contifico devuelve los valores monetarios y de stock como strings
 * (ej. "5.6", "485.0"), por eso el mapper los normaliza a number.
 */
export interface ContificoCategoryDto {
  id: string;
  nombre: string;
  padre_id?: string | null;
  tipo_producto?: string | null;
  para_supereasy?: boolean | null;
  para_comisariato?: boolean | null;
  agrupar?: boolean | null;
  cuenta_compra?: string | null;
  cuenta_venta?: string | null;
  cuenta_inventario?: string | null;
}

export interface ContificoProductVariantRefDto {
  valor_id?: string | null;
  variante_id?: string | null;
}

export interface ContificoProductDto {
  id: string;
  codigo: string | null;
  nombre: string;
  descripcion: string | null;
  codigo_barra: string | null;
  categoria_id: string | null;
  marca_id: string | null;
  marca_nombre: string | null;
  porcentaje_iva: number | null;
  pvp1: string | number | null;
  pvp2: string | number | null;
  pvp3: string | number | null;
  pvp4: string | number | null;
  minimo: string | number | null;
  cantidad_stock: string | number | null;
  estado: string | null;
  pvp_manual: boolean | null;
  imagen: unknown;
  tipo: string | null;
  tipo_producto: string | null;
  fecha_creacion: string | null;
  producto_base_id: string | null;
  nombre_producto_base: string | null;
  detalle_variantes?: ContificoProductVariantRefDto[] | null;
  variantes?: unknown;
  cuenta_venta_id?: string | null;
  cuenta_compra_id?: string | null;
  cuenta_costo_id?: string | null;
  costo_maximo?: string | number | null;
  codigo_proveedor?: string | null;
  lead_time?: number | null;
  generacion_automatica?: boolean | null;
  id_integracion_proveedor?: string | null;
  para_pos?: boolean | null;
  personalizado1?: string | null;
  personalizado2?: string | null;
  pvp_peso?: string | number | null;
  peso_desde?: string | number | null;
  peso_hasta?: string | number | null;
  unidad?: string | null;
}

export interface ContificoInventoryMovementDetailDto {
  producto_id: string;
  cantidad: string | number;
  precio?: string | number | null;
  serie?: string | null;
  edicion?: boolean | null;
}

export interface ContificoInventoryMovementDto {
  id: string;
  codigo: string;
  tipo: 'ING' | 'EGR' | 'TRA' | 'AJU' | string;
  fecha: string;
  bodega_id: string;
  bodega_destino_id?: string | null;
  estado: string;
  descripcion?: string | null;
  detalles: ContificoInventoryMovementDetailDto[];
}

/**
 * Modelo canónico que usa el ERP para sincronizar hacia la DB local y Altosa.
 */
export interface ContificoCanonicalVariant {
  sku: string;
  name: string;
  color: string | null;
  colorHex: string | null;
  price: number | null;
  stock: number;
  imageUrl: string | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  especificaciones: Record<string, unknown>;
}

export interface ContificoCanonicalProduct {
  externalId: string;
  sku: string;
  name: string;
  description: string | null;
  commercialDescription: string | null;
  line: string | null;
  category: string | null;
  subcategory: string | null;
  keywords: string[];
  thumbnailUrl: string | null;
  sourceUrl: string | null;
  isActive: boolean;
  price: number | null;
  stock: number;
  barcode: string | null;
  taxRate: number | null;
  minStock: number | null;
  raw: ContificoProductDto;
  variants: ContificoCanonicalVariant[];
}

export interface ContificoCreateProductInput {
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoriaNombre?: string;
  pvp1?: number | null;
  pvpManual?: boolean;
  estado?: 'A' | 'I';
  codigoBarra?: string | null;
  porcentajeIva?: number | null;
  minimo?: number | null;
  tipo?: 'PRO' | 'SER';
  tipoProducto?: 'SIM' | 'COM' | 'COP' | 'PRO';
}

export interface ContificoUpdateProductInput {
  nombre?: string;
  descripcion?: string | null;
  categoriaNombre?: string;
  pvp1?: number | null;
  pvpManual?: boolean;
  estado?: 'A' | 'I';
  codigoBarra?: string | null;
  porcentajeIva?: number | null;
  minimo?: number | null;
}

export interface ContificoSyncOptions {
  dryRun?: boolean;
  pushToAltosa?: boolean;
  exportPath?: string;
  onlySku?: string;
  /**
   * Solo para la migración inicial: si no hay match por SKU/ID, intenta
   * enlazar productos existentes por nombre (ERP y Altosa) para no duplicar
   * el catálogo que ya venía del ETL de Altosa.
   */
  matchByName?: boolean;
}

export interface ContificoSyncCounters {
  source: 'contifico';
  dryRun: boolean;
  durationMs: number;
  categoriesFetched: number;
  products: {
    fetched: number;
    created: number;
    updated: number;
    skipped: number;
  };
  variants: {
    created: number;
    updated: number;
    skipped: number;
  };
  altosa: {
    configured: boolean;
    pushed: number;
    failed: number;
    error?: string;
  };
  exportedTo?: string;
}
