export type StockMovementType =
  | 'PURCHASE'
  | 'ORDER_CONSUMPTION'
  | 'INVENTORY_ADJUSTMENT'

export interface StockMovementResponse {
  id: number
  ingredientId: number
  ingredientName: string
  unit: string
  movementType: StockMovementType
  quantityChange: number
  balanceAfter: number
  purchaseItemId: number | null
  orderItemId: number | null
  inventoryCheckItemId: number | null
  note: string | null
  occurredAt: string
}

export interface StockMovementFilterParams {
  ingredientId?: number
  movementType?: StockMovementType
  page?: number
  size?: number
  sort?: string
}
