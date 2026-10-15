import { apiClient } from '@/shared/lib/axios'
import type { ApiResponse, PageResponse } from '@/shared/types/api.types'
import type {
  PurchaseResponse,
  PurchaseDetailResponse,
  CreatePurchaseRequest,
  UpdatePurchaseItemRequest,
  PurchaseFilterParams,
} from '@/features/purchasing/types/purchase.types'

export const purchaseApi = {
  async getPurchases(params?: PurchaseFilterParams): Promise<PageResponse<PurchaseResponse>> {
    const searchParams = new URLSearchParams()
    if (params?.fromDate) {
      searchParams.append('fromDate', params.fromDate)
    }
    if (params?.toDate) {
      searchParams.append('toDate', params.toDate)
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
    const res = await apiClient.get<ApiResponse<PageResponse<PurchaseResponse>>>(
      `/api/purchases${queryStr ? `?${queryStr}` : ''}`
    )
    return res.data.data
  },

  async getPurchaseById(id: number): Promise<PurchaseDetailResponse> {
    const res = await apiClient.get<ApiResponse<PurchaseDetailResponse>>(
      `/api/purchases/${id}`
    )
    return res.data.data
  },

  async createPurchase(request: CreatePurchaseRequest): Promise<PurchaseDetailResponse> {
    const res = await apiClient.post<ApiResponse<PurchaseDetailResponse>>(
      '/api/purchases',
      request
    )
    return res.data.data
  },

  async correctPurchaseItem(
    purchaseId: number,
    itemId: number,
    request: UpdatePurchaseItemRequest
  ): Promise<PurchaseDetailResponse> {
    const res = await apiClient.patch<ApiResponse<PurchaseDetailResponse>>(
      `/api/purchases/${purchaseId}/items/${itemId}`,
      request
    )
    return res.data.data
  },
}
