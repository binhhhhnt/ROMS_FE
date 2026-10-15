import { apiClient } from '@/shared/lib/axios'
import type { ApiResponse, PageResponse } from '@/shared/types/api.types'
import type {
  StockMovementResponse,
  StockMovementFilterParams,
} from '@/features/inventory/types/stockMovement.types'

export const stockMovementApi = {
  async getStockMovements(
    params?: StockMovementFilterParams
  ): Promise<PageResponse<StockMovementResponse>> {
    const searchParams = new URLSearchParams()
    if (params?.ingredientId !== undefined) {
      searchParams.append('ingredientId', params.ingredientId.toString())
    }
    if (params?.movementType) {
      searchParams.append('movementType', params.movementType)
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
    const res = await apiClient.get<ApiResponse<PageResponse<StockMovementResponse>>>(
      `/api/stock-movements${queryStr ? `?${queryStr}` : ''}`
    )
    return res.data.data
  },
}
