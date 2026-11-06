export interface CartItem {
  menuItemId: number
  name: string
  price: number
  quantity: number
  imageUrl?: string
  note?: string
}

export interface OrderItemRequest {
  menuItemId: number
  quantity: number
  note?: string | null
}

export interface CreateOrderRequest {
  sessionId: number
  items: OrderItemRequest[]
}

export type OrderStatus = 'PENDING' | 'COOKING' | 'COMPLETED' | 'CANCELLED'
export type OrderItemStatus = 'PENDING' | 'COOKING' | 'READY' | 'COMPLETED' | 'CANCELLED'

export interface OrderItemResponse {
  id: number
  menuItemId: number
  menuItemName: string
  quantity: number
  returned_quantity?: number
  returnedQuantity?: number
  is_direct_sale?: boolean
  isDirectSale?: boolean
  unitPrice: number
  subtotal: number
  status: OrderItemStatus
  note?: string | null
  terminationReason?: string | null
  terminatedById?: number | null
  terminatedAt?: string | null
  returnedById?: number | null
  returned_by_id?: number | null
  returnedByName?: string | null
  returned_by_name?: string | null
  createdAt: string
}

export interface DirectSaleItemDto {
  orderItemId: number
  orderId: number
  menuItemId: number
  menuItemName: string
  orderedQuantity: number
  returnedQuantity: number
  usedQuantity: number
  unitPrice: number
  subtotal: number
  status: OrderItemStatus
  orderCreatedAt?: string
}

export interface ReturnOrderItemsRequest {
  items: {
    orderItemId: number
    returnQuantity: number
  }[]
  note?: string
}

export interface OrderResponse {
  id: number
  sessionId: number
  tableId: number
  tableCode: string
  status: OrderStatus
  totalAmount: number
  createdById: number
  createdByName: string
  terminationReason?: string | null
  terminatedById?: number | null
  terminatedAt?: string | null
  items: OrderItemResponse[]
  createdAt: string
  updatedAt: string
}

export interface AffectedMenuItem {
  menuItemId: number
  menuItemName: string
  requestedQuantity: number
}

export interface InsufficientIngredient {
  ingredientId: number
  ingredientName: string
}

export interface InsufficientStockDetails {
  affectedMenuItems: AffectedMenuItem[]
  insufficientIngredients: InsufficientIngredient[]
}
