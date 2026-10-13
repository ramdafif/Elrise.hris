/**
 * Cursor-based pagination utilities for Nusantara HRIS Enterprise.
 * Provides consistent pagination metadata and slicing across all list endpoints.
 */

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

/**
 * Paginates an array of items using a cursor (usually item.id).
 *
 * @param items Full filtered array of records
 * @param cursor Identifier marking the end of the previous page
 * @param limit Maximum number of records to return (1-200, default 50)
 * @param idSelector Optional custom function to extract the cursor ID from an item
 */
export function paginateWithCursor<T>(
  items: T[],
  cursor?: string | null,
  limit: number = 50,
  idSelector: (item: T) => string = (item: any) => item.id || item.employeeId || item.code
): PaginatedResult<T> {
  const safeLimit = Math.max(1, Math.min(200, limit));
  let startIndex = 0;

  if (cursor) {
    const cursorIndex = items.findIndex((item) => idSelector(item) === cursor);
    if (cursorIndex !== -1) {
      startIndex = cursorIndex + 1;
    }
  }

  const pageItems = items.slice(startIndex, startIndex + safeLimit);
  const hasMore = startIndex + safeLimit < items.length;
  const nextCursor = hasMore && pageItems.length > 0 ? idSelector(pageItems[pageItems.length - 1]) : null;

  return {
    items: pageItems,
    nextCursor,
    hasMore,
    total: items.length,
  };
}

/**
 * In-memory pagination alias conforming to paginateWithCursor
 */
export function paginateInMemory<T>(
  items: T[],
  cursor?: string | null,
  limit: number = 50,
  idSelector: (item: T) => string = (item: any) => item.id || item.employeeId || item.code
): PaginatedResult<T> {
  return paginateWithCursor(items, cursor, limit, idSelector);
}

/**
 * Tries executing database Prisma query, falling back to in-memory store if DB is disconnected or fails.
 */
export async function executePrismaOrMemoryPagination<T>(
  runPrisma: () => Promise<PaginatedResult<T>>,
  runMemory: () => PaginatedResult<T> | Promise<PaginatedResult<T>>
): Promise<PaginatedResult<T>> {
  try {
    const { isPrismaAvailable } = await import('@/lib/db/prisma');
    if (await isPrismaAvailable()) {
      return await runPrisma();
    }
  } catch {
    // DB query unavailable, seamlessly proceed to in-memory fallback
  }
  return await runMemory();
}
