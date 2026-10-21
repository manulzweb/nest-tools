export interface PaginationMeta {
  itemCount: number;
  totalItems: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Creates a paginated response object with calculated metadata.
 */
export function createPaginatedResponse<T>(
  items: T[],
  totalItems: number,
  page = 1,
  limit = 10
): PaginatedResult<T> {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.max(Number(limit) || 10, 1);
  const totalPages = Math.ceil(totalItems / safeLimit) || 1;

  return {
    data: items,
    meta: {
      itemCount: items.length,
      totalItems,
      itemsPerPage: safeLimit,
      totalPages,
      currentPage: safePage,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    },
  };
}
