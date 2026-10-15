export type StockStatus = 'NORMAL' | 'LOW' | 'OUT_OF_STOCK'

export interface IngredientResponse {
  id: number
  name: string
  unit: string
  currentStock: number
  minimumStock: number | null
  isActive: boolean
  stockStatus: StockStatus
  createdAt: string
  updatedAt: string
}

export interface CreateIngredientRequest {
  name: string
  unit: string
  minimumStock?: number | null
}

export interface UpdateIngredientRequest {
  name: string
  unit: string
  minimumStock?: number | null
}

export interface IngredientFilterParams {
  isActive?: boolean
  page?: number
  size?: number
  sort?: string
}
