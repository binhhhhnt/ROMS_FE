export interface PurchaseItemResponse {
  id: number
  ingredientId: number
  ingredientName: string
  unit: string
  quantity: number
  unitPrice: number
  subtotal: number
  createdAt: string
  updatedAt: string
}

export interface PurchaseResponse {
  id: number
  purchaseDate: string
  totalAmount: number
  createdById?: number | null
  createdByName?: string | null
  note?: string | null
  createdAt: string
  updatedAt: string
}

export interface PurchaseDetailResponse {
  id: number
  purchaseDate: string
  totalAmount: number
  createdById?: number | null
  createdByName?: string | null
  note?: string | null
  items: PurchaseItemResponse[]
  createdAt: string
  updatedAt: string
}

export interface PurchaseItemRequest {
  ingredientId: number
  quantity: number
  unitPrice: number
}

export interface CreatePurchaseRequest {
  purchaseDate: string
  note?: string
  items: PurchaseItemRequest[]
}

export interface UpdatePurchaseItemRequest {
  quantity: number
  unitPrice: number
  reason?: string
}

export interface PurchaseFilterParams {
  fromDate?: string
  toDate?: string
  page?: number
  size?: number
  sort?: string
}
