import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../../utils/async-handler';
import { sendSuccess } from '../../utils/api-response';
import * as productsService from './products-service';
import type { CreateProductInput, ProductListFilters, UpdateProductInput } from './products-types';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const filters = req.query as unknown as ProductListFilters;
  const { items, meta } = await productsService.listProducts(filters);
  sendSuccess(res, items, meta);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const product = await productsService.getProductById(req.params.id as string);
  sendSuccess(res, product);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const product = await productsService.createProduct(req.body as CreateProductInput);
  sendSuccess(res, product, undefined, StatusCodes.CREATED);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const product = await productsService.updateProduct(
    req.params.id as string,
    req.body as UpdateProductInput
  );
  sendSuccess(res, product);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const product = await productsService.deleteProduct(req.params.id as string);
  sendSuccess(res, product);
});
