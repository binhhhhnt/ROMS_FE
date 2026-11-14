import { apiClient } from '@/shared/lib/axios'
import type { ApiResponse, PageResponse } from '@/shared/types/api.types'
import type { CategoryResponse } from '@/features/menu/types/category.types'
import type { MenuItemReadResponse } from '@/features/menu/types/menu.types'
import type {
  GenerateTableQrResponse,
  QrContextResponse,
  QrOrderRequestCreateRequest,
  QrOrderRequestResponse,
  QrOrdersTrackingResponse,
} from '../types/qr.types'

export const qrApi = {
  // Public Guest QR APIs (no auth required)
  resolveContext: async (qrToken: string): Promise<QrContextResponse> => {
    const res = await apiClient.get<ApiResponse<QrContextResponse>>(
      `/api/qr/${qrToken}/context`
    )
    return res.data.data
  },

  getCategories: async (qrToken: string): Promise<PageResponse<CategoryResponse>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<CategoryResponse>>>(
      `/api/qr/${qrToken}/categories`,
      { params: { page: 0, size: 100 } }
    )
    return res.data.data
  },

  getMenu: async (
    qrToken: string,
    categoryId?: number
  ): Promise<PageResponse<MenuItemReadResponse>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<MenuItemReadResponse>>>(
      `/api/qr/${qrToken}/menu`,
      { params: { categoryId, page: 0, size: 100 } }
    )
    return res.data.data
  },

  submitQrOrder: async (
    qrToken: string,
    payload: QrOrderRequestCreateRequest
  ): Promise<QrOrderRequestResponse> => {
    const res = await apiClient.post<ApiResponse<QrOrderRequestResponse>>(
      `/api/qr/${qrToken}/orders`,
      payload
    )
    return res.data.data
  },

  getSessionOrders: async (qrToken: string): Promise<QrOrdersTrackingResponse> => {
    const res = await apiClient.get<ApiResponse<QrOrdersTrackingResponse>>(
      `/api/qr/${qrToken}/orders`
    )
    return res.data.data
  },

  callStaff: async (qrToken: string): Promise<void> => {
    await apiClient.post(`/api/qr/${qrToken}/call-staff`)
  },

  // Staff Verification APIs (SERVICE_STAFF / OWNER)
  getPendingRequests: async (): Promise<QrOrderRequestResponse[]> => {
    const res = await apiClient.get<ApiResponse<QrOrderRequestResponse[]>>(
      '/api/qr-orders/pending'
    )
    return res.data.data
  },

  confirmQrOrder: async (id: number): Promise<QrOrderRequestResponse> => {
    const res = await apiClient.post<ApiResponse<QrOrderRequestResponse>>(
      `/api/qr-orders/${id}/confirm`
    )
    return res.data.data
  },

  cancelQrOrder: async (
    id: number,
    reason: string
  ): Promise<QrOrderRequestResponse> => {
    const res = await apiClient.post<ApiResponse<QrOrderRequestResponse>>(
      `/api/qr-orders/${id}/cancel`,
      { reason }
    )
    return res.data.data
  },

  // Owner QR Generation API
  generateTableQrTokens: async (
    tableIds: number[],
    regenerate = false
  ): Promise<GenerateTableQrResponse> => {
    const res = await apiClient.post<ApiResponse<GenerateTableQrResponse>>(
      '/api/tables/qr-tokens/generate',
      { tableIds, regenerate }
    )
    return res.data.data
  },
}
