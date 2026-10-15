import { apiClient } from '@/shared/lib/axios'
import type { ApiResponse, PageResponse } from '@/shared/types/api.types'
import type {
  CategoryResponse,
  CategoryWriteRequest,
  CategoryFilterParams,
} from '@/features/menu/types/category.types'

export const categoryApi = {
  async getCategories(params?: CategoryFilterParams): Promise<PageResponse<CategoryResponse>> {
    const searchParams = new URLSearchParams()
    if (params?.page !== undefined) searchParams.append('page', params.page.toString())
    if (params?.size !== undefined) searchParams.append('size', params.size.toString())
    if (params?.sort) searchParams.append('sort', params.sort)

    const res = await apiClient.get<ApiResponse<PageResponse<CategoryResponse>>>(
      `/api/categories${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    )
    return res.data.data
  },

  async getCategory(id: number): Promise<CategoryResponse> {
    const res = await apiClient.get<ApiResponse<CategoryResponse>>(`/api/categories/${id}`)
    return res.data.data
  },

  async createCategory(data: CategoryWriteRequest): Promise<CategoryResponse> {
    const res = await apiClient.post<ApiResponse<CategoryResponse>>('/api/categories', data)
    return res.data.data
  },

  async updateCategory(id: number, data: CategoryWriteRequest): Promise<CategoryResponse> {
    const res = await apiClient.put<ApiResponse<CategoryResponse>>(`/api/categories/${id}`, data)
    return res.data.data
  },

  async toggleCategoryStatus(category: CategoryResponse): Promise<CategoryResponse> {
    const updatedData: CategoryWriteRequest = {
      name: category.name,
      description: category.description || '',
      displayOrder: category.displayOrder,
      isActive: !category.isActive,
    }
    return this.updateCategory(category.id, updatedData)
  },
}
