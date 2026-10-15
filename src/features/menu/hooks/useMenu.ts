import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/app/store/authStore'
import { categoryApi } from '../api/categoryApi'
import { menuApi } from '../api/menuApi'
import type { CategoryResponse } from '../types/category.types'
import type { MenuListParams } from '../types/menu.types'

export function useMenuItems(params: MenuListParams, enabled = true) {
  const user = useAuthStore((state) => state.user)
  return useQuery({
    queryKey: ['menu', 'items', user?.id, user?.role, params],
    queryFn: ({ signal }) => menuApi.list(params, signal),
    enabled: !!user && enabled,
    refetchOnWindowFocus: true,
  })
}

export function useMenuItem(id: number | null, quantity = 1, enabled = true) {
  const user = useAuthStore((state) => state.user)
  return useQuery({
    queryKey: ['menu', 'item', user?.id, user?.role, id, quantity],
    queryFn: ({ signal }) => menuApi.detail(id!, quantity, signal),
    enabled: !!user && id !== null && enabled,
    refetchOnWindowFocus: true,
  })
}

export function useMenuCategoryOptions() {
  const user = useAuthStore((state) => state.user)
  return useQuery({
    queryKey: ['menu', 'category-options', user?.id, user?.role],
    queryFn: async ({ signal }) => {
      const result: CategoryResponse[] = []
      let page = 0
      let totalPages = 1
      while (page < totalPages) {
        const data = await categoryApi.list(page, 100, signal)
        result.push(...data.content)
        totalPages = data.totalPages
        page++
      }
      return result
    },
    enabled: !!user,
  })
}

export function useRefreshMenu() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({
    predicate: ({ queryKey }) => queryKey[0] === 'menu'
      || queryKey[0] === 'categories'
      || (queryKey[0] === 'kitchen' && queryKey[1] === 'menu-items'),
  })
}
