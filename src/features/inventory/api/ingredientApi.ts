import { apiClient } from '@/shared/lib/axios'
import type { ApiResponse, PageResponse } from '@/shared/types/api.types'
import type {
  IngredientResponse,
  CreateIngredientRequest,
  UpdateIngredientRequest,
  IngredientFilterParams,
} from '@/features/inventory/types/ingredient.types'

export const ingredientApi = {
  async getIngredients(params?: IngredientFilterParams): Promise<PageResponse<IngredientResponse>> {
    const searchParams = new URLSearchParams()
    if (params?.isActive !== undefined) {
      searchParams.append('isActive', params.isActive.toString())
    }
    if (params?.page !== undefined) {
      searchParams.append('page', params.page.toString())
    }
    if (params?.size !== undefined) {
      searchParams.append('size', params.size.toString())
    }
    if (params?.sort) {
      searchParams.append('sort', params.sort)
    }

    const queryStr = searchParams.toString()
    const res = await apiClient.get<ApiResponse<PageResponse<IngredientResponse>>>(
      `/api/ingredients${queryStr ? `?${queryStr}` : ''}`
    )
    return res.data.data
  },

  async getIngredientById(id: number): Promise<IngredientResponse> {
    const res = await apiClient.get<ApiResponse<IngredientResponse>>(`/api/ingredients/${id}`)
    return res.data.data
  },

  async createIngredient(request: CreateIngredientRequest): Promise<IngredientResponse> {
    const res = await apiClient.post<ApiResponse<IngredientResponse>>('/api/ingredients', request)
    return res.data.data
  },

  async updateIngredient(id: number, request: UpdateIngredientRequest): Promise<IngredientResponse> {
    const res = await apiClient.put<ApiResponse<IngredientResponse>>(`/api/ingredients/${id}`, request)
    return res.data.data
  },

  async deactivateIngredient(id: number): Promise<IngredientResponse> {
    const res = await apiClient.patch<ApiResponse<IngredientResponse>>(`/api/ingredients/${id}/deactivate`)
    return res.data.data
  },
}
