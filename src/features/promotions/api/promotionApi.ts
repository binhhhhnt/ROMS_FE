import { apiClient } from '@/shared/lib/axios'
import type { ApiResponse, PageResponse } from '@/shared/types/api.types'
import type {
  PromotionResponse,
  PromotionDto,
  CreatePromotionRequest,
  UpdatePromotionRequest,
  PromotionFilterParams,
} from '@/features/promotions/types/promotion.types'

export const promotionApi = {
  async getPromotions(params?: PromotionFilterParams): Promise<PageResponse<PromotionResponse>> {
    const queryParams = new URLSearchParams()
    if (params?.search && params.search.trim()) {
      queryParams.append('search', params.search.trim())
    }
    if (params?.isActive !== undefined) {
      queryParams.append('isActive', params.isActive.toString())
    }
    if (params?.page !== undefined) {
      queryParams.append('page', params.page.toString())
    }
    if (params?.size !== undefined) {
      queryParams.append('size', params.size.toString())
    }
    if (params?.sort) {
      queryParams.append('sort', params.sort)
    }

    const res = await apiClient.get<ApiResponse<PageResponse<PromotionResponse>>>(
      `/api/promotions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    )
    return res.data.data
  },

  async getValidPromotions(): Promise<PromotionDto[]> {
    const res = await apiClient.get<ApiResponse<PromotionDto[]>>('/api/promotions/valid')
    return res.data.data
  },

  async getPromotionById(id: number): Promise<PromotionResponse> {
    const res = await apiClient.get<ApiResponse<PromotionResponse>>(`/api/promotions/${id}`)
    return res.data.data
  },

  async createPromotion(data: CreatePromotionRequest): Promise<PromotionResponse> {
    const res = await apiClient.post<ApiResponse<PromotionResponse>>('/api/promotions', data)
    return res.data.data
  },

  async updatePromotion(id: number, data: UpdatePromotionRequest): Promise<PromotionResponse> {
    const res = await apiClient.put<ApiResponse<PromotionResponse>>(`/api/promotions/${id}`, data)
    return res.data.data
  },

  async deletePromotion(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/api/promotions/${id}`)
  },

  async toggleStatus(id: number): Promise<PromotionResponse> {
    const res = await apiClient.patch<ApiResponse<PromotionResponse>>(`/api/promotions/${id}/toggle-status`)
    return res.data.data
  },
}

