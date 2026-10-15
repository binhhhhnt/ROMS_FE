export interface InventoryCheckItemRequest {
  ingredientId: number
  actualQuantity: number
  reason?: string | null
}

export interface CreateInventoryCheckRequest {
  note?: string | null
  checkedAt?: string | null
  items: InventoryCheckItemRequest[]
}

export interface InventoryCheckItemResponse {
  id: number
  ingredientId: number
  ingredientName: string
  unit: string
  systemQuantity: number
  actualQuantity: number
  difference: number
  reason: string | null
  createdAt: string
}

export interface InventoryCheckResponse {
  id: number
  checkedById: number | null
  checkedByName: string | null
  checkedAt: string
  note: string | null
  items: InventoryCheckItemResponse[]
  createdAt: string
  updatedAt: string
}
