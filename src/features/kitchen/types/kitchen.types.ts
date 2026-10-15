import type {
  OrderStatus,
  OrderItemResponse,
  OrderItemStatus,
} from '@/features/ordering/types/ordering.types'

export interface KitchenOrderResponse {
  id: number
  sessionId: number
  tableId: number
  tableCode: string
  status: OrderStatus
  items: OrderItemResponse[]
  createdAt: string
  updatedAt: string
}

export interface UpdateOrderItemStatusRequest {
  status: OrderItemStatus
}

export type MenuItemAvailabilityStatus =
  | 'AVAILABLE'
  | 'TEMPORARILY_UNAVAILABLE'
  | 'DISCONTINUED'

export interface MenuItemImage {
  id: number
  imageUrl: string
  isPrimary: boolean
  displayOrder: number
}

export interface CategoryItem {
  id: number
  name: string
  description?: string
  displayOrder?: number
}

export interface MenuItemReadItem {
  id: number
  name: string
  description?: string | null
  price: number
  status: MenuItemAvailabilityStatus
  isFeatured?: boolean
  category?: CategoryItem | null
  images: MenuItemImage[]
}

export interface UpdateMenuStatusRequest {
  status: MenuItemAvailabilityStatus
}

export interface MenuItemStatusResponse {
  id: number
  name: string
  status: MenuItemAvailabilityStatus
  updatedAt: string
}
