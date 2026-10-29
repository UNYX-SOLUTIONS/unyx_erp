import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../../utils/api-error';
import { asyncHandler } from '../../utils/async-handler';
import { sendSuccess } from '../../utils/api-response';
import * as altosaService from './altosa-service';
import * as altosaExternalService from './altosa-external-service';
import * as altosaWriteThrough from './altosa-write-through';
import type {
  AltosaActiveQuery,
  AltosaCreateProductBody,
  AltosaDocumentsQuery,
  AltosaExternalImportItem,
  AltosaExternalPendingQuery,
  AltosaMetaCatalogItemQuery,
  AltosaMetaCatalogSearchQuery,
  AltosaProductsQuery,
  AltosaUpdateProductBody,
  AltosaUpdateVariantBody,
  AltosaVariantBody,
} from './altosa-schema';

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as AltosaProductsQuery;
  const { data, meta } = await altosaService.listProducts(query);
  sendSuccess(res, data, meta);
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const { data } = await altosaService.getProductById(Number(req.params.id));
  sendSuccess(res, data);
});

export const getProductBySku = asyncHandler(async (req: Request, res: Response) => {
  const { data } = await altosaService.getProductByVariantSku(String(req.params.sku));
  sendSuccess(res, data);
});

export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  const { data } = await altosaService.listCategories();
  sendSuccess(res, data);
});

export const listCatalogs = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as AltosaActiveQuery;
  const { data } = await altosaService.listCatalogs(query);
  sendSuccess(res, data);
});

export const listLocations = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as AltosaActiveQuery;
  const { data } = await altosaService.listLocations(query);
  sendSuccess(res, data);
});

export const listWarranties = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as AltosaActiveQuery;
  const { data } = await altosaService.listWarranties(query);
  sendSuccess(res, data);
});

export const listDocuments = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as AltosaDocumentsQuery;
  const { data, meta } = await altosaService.listDocuments(query);
  sendSuccess(res, data, meta);
});

// ---------------------------------------------------------------------------
// Escritura
// ---------------------------------------------------------------------------

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as AltosaCreateProductBody;
  const data = await altosaWriteThrough.createProduct(input);
  sendSuccess(res, data, undefined, StatusCodes.CREATED);
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as AltosaUpdateProductBody;
  const data = await altosaWriteThrough.updateProduct(Number(req.params.id), input);
  sendSuccess(res, data);
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const data = await altosaWriteThrough.deleteProduct(Number(req.params.id));
  sendSuccess(res, data);
});

export const createVariant = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as AltosaVariantBody;
  const { data } = await altosaService.createVariant(Number(req.params.id), {
    ...input,
    // Una variante nueva del ERP se crea también como producto plano en
    // Contifico (si está configurado). La lógica vive en Altosa.
    writeThroughContifico: true,
  });
  sendSuccess(res, data, undefined, StatusCodes.CREATED);
});

export const updateVariant = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as AltosaUpdateVariantBody;
  const query = req.query as unknown as { productId?: number };
  const data = await altosaWriteThrough.updateVariant(
    Number(req.params.id),
    input,
    query.productId,
    {
      userId: req.user?.id,
      companyId: req.user?.companyId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    }
  );
  sendSuccess(res, data);
});

export const deleteVariant = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as { productId?: number };
  const data = await altosaWriteThrough.deleteVariant(Number(req.params.id), query.productId);
  sendSuccess(res, data);
});

export const uploadVariantImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Archivo requerido (campo "file").', 'UPLOAD_MISSING_FILE');
  }
  const { data } = await altosaService.uploadVariantImage(req.file);
  sendSuccess(res, data, undefined, StatusCodes.CREATED);
});

export const searchMetaCatalog = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as AltosaMetaCatalogSearchQuery;
  const { data } = await altosaService.searchMetaCatalog(query);
  sendSuccess(res, data);
});

export const getMetaCatalogItem = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as AltosaMetaCatalogItemQuery;
  const { data } = await altosaService.getMetaCatalogItem(query);
  sendSuccess(res, data);
});

export const getExternalPending = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as AltosaExternalPendingQuery;
  const data = await altosaExternalService.getExternalPending(query);
  sendSuccess(res, data);
});

export const importExternalItems = asyncHandler(async (req: Request, res: Response) => {
  const { items } = req.body as { items: AltosaExternalImportItem[] };
  const data = await altosaExternalService.importExternalItems(items);
  sendSuccess(res, data, undefined, StatusCodes.CREATED);
});
