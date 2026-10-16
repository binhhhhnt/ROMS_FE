import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { categoryApi } from '../api/categoryApi'
import type { CategoryWriteRequest } from '../types/category.types'

export function useCategories(userId: number | undefined, page: number, size: number) {
  return useQuery({
    queryKey: ['menu', 'categories', 'owner', userId, { page, size }],
    queryFn: ({ signal }) => categoryApi.list(page, size, signal),
    enabled: userId !== undefined,
  })
}

export function useSaveCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, values }: { id?: number; values: CategoryWriteRequest }) =>
      id === undefined ? categoryApi.create(values) : categoryApi.update(id, values),
    onSuccess: () => queryClient.invalidateQueries({
      predicate: ({ queryKey }) => queryKey[0] === 'menu'
        || queryKey[0] === 'categories'
        || (queryKey[0] === 'kitchen' && queryKey[1] === 'menu-items'),
    }),
  })
}
