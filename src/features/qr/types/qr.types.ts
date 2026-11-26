import type { MenuItemReadResponse } from '@/features/menu/types/menu.types'
import type { OrderResponse } from '@/features/ordering/types/ordering.types'

export type QrOrderRequestStatus = 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'CANCELLED'

export interface QrContextResponse {
  qrOrderingEnabled: boolean
  tableId: number
  tableCode: string
  area?: string | null
  sessionId: number
  sessionCode?: string
  restaurantName: string
  address?: string | null
}

export interface QrOrderRequestItemResponse {
  id: number
  menuItemId: number
  menuItemName: string
  unitPrice: number
  quantity: number
  note?: string | null
}

export interface QrOrderRequestResponse {
  id: number
  serviceSessionId: number
  serviceSessionCode?: string
  tableId: number
  tableCode: string
  area?: string | null
  status: QrOrderRequestStatus
  confirmedOrderId?: number | null
  confirmedById?: number | null
  confirmedByName?: string | null
  cancelledById?: number | null
  cancelledByName?: string | null
  cancellationReason?: string | null
  createdAt: string
  updatedAt: string
  items: QrOrderRequestItemResponse[]
}

export interface QrOrdersTrackingResponse {
  sessionId: number | null
  tableId: number
  tableCode: string
  pendingRequests: QrOrderRequestResponse[]
  confirmedOrders: OrderResponse[]
}

export interface QrOrderRequestCreateRequest {
  items: Array<{
    menuItemId: number
    quantity: number
    note?: string
  }>
}

export interface TableQrItem {
  tableId: number
  tableCode: string
  area?: string | null
  qrToken: string
}

export interface GenerateTableQrResponse {
  restaurantName: string
  address?: string | null
  tables: TableQrItem[]
}

export interface QrCartItem {
  menuItem: MenuItemReadResponse
  quantity: number
  note?: string
}
