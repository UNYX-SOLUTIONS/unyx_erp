export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginationResult {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

export function getPagination(
  query: { page?: unknown; limit?: unknown },
  defaultLimit = 20,
  maxLimit = 100
): PaginationResult {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number(query.limit) || defaultLimit));
  return { skip: (page - 1) * limit, take: limit, page, limit };
}

export function buildPaginationMeta(
  total: number,
  { page, limit }: PaginationResult
): PaginationMeta {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
