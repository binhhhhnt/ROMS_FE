import { apiClient } from '@/shared/lib/axios'
import type { ApiResponse, PageResponse } from '@/shared/types/api.types'
import type {
  KitchenOrderResponse,
  MenuItemReadItem,
  MenuItemAvailabilityStatus,
  MenuItemStatusResponse,
  CategoryItem,
} from '@/features/kitchen/types/kitchen.types'
import type {
  OrderItemResponse,
  OrderItemStatus,
  OrderStatus,
} from '@/features/ordering/types/ordering.types'

export const kitchenApi = {
  async getKitchenOrders(status?: OrderStatus): Promise<KitchenOrderResponse[]> {
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    const res = await apiClient.get<ApiResponse<KitchenOrderResponse[]>>(
      `/api/kitchen/orders${params.toString() ? `?${params.toString()}` : ''}`
    )
    return res.data.data
  },

  async getKitchenOrderById(id: number): Promise<KitchenOrderResponse> {
    const res = await apiClient.get<ApiResponse<KitchenOrderResponse>>(
      `/api/kitchen/orders/${id}`
    )
    return res.data.data
  },

  async acceptOrder(id: number): Promise<KitchenOrderResponse> {
    const res = await apiClient.post<ApiResponse<KitchenOrderResponse>>(
      `/api/kitchen/orders/${id}/accept`
    )
    return res.data.data
  },

  async updateOrderItemStatus(
    orderId: number,
    itemId: number,
    status: OrderItemStatus
  ): Promise<OrderItemResponse> {
    const res = await apiClient.patch<ApiResponse<OrderItemResponse>>(
      `/api/kitchen/orders/${orderId}/items/${itemId}/status`,
      { status }
    )
    return res.data.data
  },

  async getMenuItems(
    categoryId?: number,
    page = 0,
    size = 100
  ): Promise<PageResponse<MenuItemReadItem>> {
    const params = new URLSearchParams()
    if (categoryId) params.append('categoryId', categoryId.toString())
    params.append('page', page.toString())
    params.append('size', size.toString())

    const res = await apiClient.get<ApiResponse<PageResponse<MenuItemReadItem>>>(
      `/api/menu-items?${params.toString()}`
    )
    return res.data.data
  },

  async updateMenuStatus(
    id: number,
    status: MenuItemAvailabilityStatus
  ): Promise<MenuItemStatusResponse> {
    const res = await apiClient.patch<ApiResponse<MenuItemStatusResponse>>(
      `/api/menu-items/${id}/status`,
      { status }
    )
    return res.data.data
  },

  async getCategories(): Promise<PageResponse<CategoryItem>> {
    const res = await apiClient.get<ApiResponse<PageResponse<CategoryItem>>>(
      '/api/categories?size=100'
    )
    return res.data.data
  },
}
