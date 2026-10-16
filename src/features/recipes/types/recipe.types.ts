export interface RecipeItemResponse {
  id: number
  ingredientId: number
  ingredientName: string
  unit: string
  quantityRequired: number
}

export interface RecipeResponse {
  menuItemId: number
  menuItemName: string
  items: RecipeItemResponse[]
}

export interface UpsertRecipeItemRequest {
  ingredientId: number
  quantityRequired: number
}

export interface BatchUpsertRecipeRequest {
  items: UpsertRecipeItemRequest[]
}

export interface UpdateRecipeItemQuantityRequest {
  quantityRequired: number
}

export interface RecipeCategory {
  id: number
  name: string
  description?: string
}

export interface RecipeMenuItem {
  id: number
  name: string
  description?: string | null
  price: number
  status: 'AVAILABLE' | 'TEMPORARILY_UNAVAILABLE' | 'DISCONTINUED'
  category?: RecipeCategory | null
  availability?: {
    sellable: boolean
    reason?: string
    requestedQuantity?: number
    maxPossibleQuantity?: number
  }
}
