import { apiClient } from '@/shared/lib/axios'
import type { ApiResponse, PageResponse } from '@/shared/types/api.types'
import type {
  CreateOrderRequest,
  OrderResponse,
  OrderItemResponse,
  OrderStatus,
  DirectSaleItemDto,
  ReturnOrderItemsRequest,
} from '@/features/ordering/types/ordering.types'

export const orderApi = {
  async createOrder(request: CreateOrderRequest): Promise<OrderResponse> {
    const res = await apiClient.post<ApiResponse<OrderResponse>>(
      '/api/orders',
      request
    )
    return res.data.data
  },

  async getOrderById(id: number): Promise<OrderResponse> {
    const res = await apiClient.get<ApiResponse<OrderResponse>>(
      `/api/orders/${id}`
    )
    return res.data.data
  },

  async getOrders(
    sessionId?: number,
    status?: OrderStatus
  ): Promise<OrderResponse[]> {
    const params = new URLSearchParams()
    if (sessionId) params.append('sessionId', sessionId.toString())
    if (status) params.append('status', status)

    const res = await apiClient.get<ApiResponse<OrderResponse[]>>(
      `/api/orders?${params.toString()}`
    )
    return res.data.data
  },

  async getOrdersPaged(query: {
    status?: OrderStatus
    session?: string
    fromDate?: string
    toDate?: string
    page?: number
    size?: number
    sort?: string
  }): Promise<PageResponse<OrderResponse>> {
    const params = new URLSearchParams()
    if (query.status) params.append('status', query.status)
    if (query.session?.trim()) params.append('session', query.session.trim())
    if (query.fromDate) params.append('fromDate', query.fromDate)
    if (query.toDate) params.append('toDate', query.toDate)
    params.append('page', String(query.page ?? 0))
    params.append('size', String(query.size ?? 21))
    if (query.sort) params.append('sort', query.sort)

    const res = await apiClient.get<ApiResponse<PageResponse<OrderResponse>>>(
      `/api/orders/paged?${params.toString()}`
    )
    return res.data.data
  },

  async cancelOrder(
    id: number,
    cancelReason?: string
  ): Promise<OrderResponse> {
    const res = await apiClient.post<ApiResponse<OrderResponse>>(
      `/api/orders/${id}/cancel`,
      cancelReason ? { reason: cancelReason } : {}
    )
    return res.data.data
  },

  async cancelOrderItem(
    orderId: number,
    itemId: number,
    cancelReason?: string,
    quantity?: number
  ): Promise<OrderItemResponse> {
    const payload: { reason?: string; quantity?: number } = {}
    if (cancelReason) payload.reason = cancelReason
    if (quantity !== undefined) payload.quantity = quantity

    const res = await apiClient.post<ApiResponse<OrderItemResponse>>(
      `/api/orders/${orderId}/items/${itemId}/cancel`,
      payload
    )
    return res.data.data
  },

  async completeOrderItem(
    orderId: number,
    itemId: number
  ): Promise<OrderItemResponse> {
    const res = await apiClient.patch<ApiResponse<OrderItemResponse>>(
      `/api/orders/${orderId}/items/${itemId}/complete`
    )
    return res.data.data
  },

  async getSessionDirectSaleItems(sessionId: number): Promise<DirectSaleItemDto[]> {
    const res = await apiClient.get<ApiResponse<DirectSaleItemDto[]>>(
      `/api/sessions/${sessionId}/direct-sale-items`
    )
    return res.data.data
  },

  async returnSessionDirectSaleItems(
    sessionId: number,
    request: ReturnOrderItemsRequest
  ): Promise<DirectSaleItemDto[]> {
    const res = await apiClient.post<ApiResponse<DirectSaleItemDto[]>>(
      `/api/sessions/${sessionId}/return-items`,
      request
    )
    return res.data.data
  },
}
