export interface RestaurantSettingResponse {
  id: number
  menuPriceIncludesVat: boolean
  menu_price_includes_vat?: boolean
  createdAt?: string
  updatedAt?: string
  updated_at?: string
}

export interface UpdateSettingRequest {
  menuPriceIncludesVat: boolean
  menu_price_includes_vat?: boolean
}

export interface TaxCategoryResponse {
  id: number
  rate: number
  createdAt: string
  updatedAt: string
}

export interface TaxCategoryRequest {
  rate: number
}
