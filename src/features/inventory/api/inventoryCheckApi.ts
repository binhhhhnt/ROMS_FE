import { apiClient } from '@/shared/lib/axios'
import type { ApiResponse, PageResponse } from '@/shared/types/api.types'
import type {
  InventoryCheckResponse,
  CreateInventoryCheckRequest,
} from '@/features/inventory/types/inventoryCheck.types'

export const inventoryCheckApi = {
  async getInventoryChecks(
    page = 0,
    size = 20
  ): Promise<PageResponse<InventoryCheckResponse>> {
    const res = await apiClient.get<ApiResponse<PageResponse<InventoryCheckResponse>>>(
      `/api/inventory-checks?page=${page}&size=${size}&sort=checkedAt,desc`
    )
    return res.data.data
  },

  async getInventoryCheckById(id: number): Promise<InventoryCheckResponse> {
    const res = await apiClient.get<ApiResponse<InventoryCheckResponse>>(
      `/api/inventory-checks/${id}`
    )
    return res.data.data
  },

  async createInventoryCheck(
    request: CreateInventoryCheckRequest
  ): Promise<InventoryCheckResponse> {
    const res = await apiClient.post<ApiResponse<InventoryCheckResponse>>(
      '/api/inventory-checks',
      request
    )
    return res.data.data
  },
}
