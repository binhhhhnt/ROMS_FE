import type { CategoryResponse } from './category.types'

export const menuStatuses = ['AVAILABLE', 'TEMPORARILY_UNAVAILABLE', 'DISCONTINUED'] as const
export type MenuStatus = typeof menuStatuses[number]

export interface MenuItemImage {
  id: number
  menuItemId: number
  imageUrl: string
  displayOrder: number
}

export interface MenuAvailability {
  sellable: boolean
  reason: string | null
  requestedQuantity: number
  maxPossibleQuantity: number | null
}

export interface MenuItemReadResponse {
  id: number
  category: CategoryResponse
  name: string
  description: string | null
  price: number
  isFeatured: boolean
  status: MenuStatus
  images: MenuItemImage[]
  availability: MenuAvailability
}

export interface MenuItemWriteRequest {
  categoryId: number
  name: string
  description: string
  price: number
  isFeatured: boolean
}

export interface MenuItemWriteResponse extends Omit<MenuItemWriteRequest, 'description'> {
  id: number
  description: string | null
  status: MenuStatus
}

export interface MenuStatusResponse {
  id: number
  name: string
  status: MenuStatus
  updatedAt: string
}

export interface MenuListParams {
  page: number
  size: number
  categoryId?: number
  status?: MenuStatus
  sort: string
  quantity?: number
}
