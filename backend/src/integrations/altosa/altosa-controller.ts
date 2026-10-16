import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { sendSuccess } from '../../utils/api-response';
import * as altosaService from './altosa-service';
import type {
  AltosaActiveQuery,
  AltosaDocumentsQuery,
  AltosaProductsQuery,
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
