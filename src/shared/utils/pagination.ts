import type { PageResponse } from '@/shared/types/api.types'

/**
 * Fetches page 0 and, if `totalPages > 1`, concurrently fetches all remaining pages
 * and returns a merged `PageResponse`.
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<PageResponse<T>>
): Promise<PageResponse<T>> {
  const firstPage = await fetchPage(0)
  if (firstPage.totalPages <= 1) {
    return firstPage
  }

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      fetchPage(index + 1)
    )
  )

  return {
    ...firstPage,
    content: [
      ...firstPage.content,
      ...remainingPages.flatMap((page) => page.content),
    ],
  }
}
