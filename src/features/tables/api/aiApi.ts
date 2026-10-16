import { apiClient } from '@/shared/lib/axios'
import type { ApiResponse } from '@/shared/types/api.types'

export interface AiRecommendationRequest {
  preferences?: string
  partySize?: number
  allergies?: string
  budgetRange?: string
  message?: string
}

export interface AiRecommendationItem {
  menuItemId: number
  name: string
  price: number
  categoryName: string
  description?: string
  reason: string
  isSellable: boolean
}

export interface AiRecommendationResponse {
  message: string
  recommendations: AiRecommendationItem[]
}

export const aiApi = {
  async getRecommendations(
    payload: AiRecommendationRequest
  ): Promise<AiRecommendationResponse> {
    const res = await apiClient.post<ApiResponse<AiRecommendationResponse>>(
      '/api/ai/recommendations',
      payload
    )
    return res.data.data
  },
}
