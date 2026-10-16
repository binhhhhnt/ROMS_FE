export interface CategoryResponse {
  id: number
  name: string
  description: string | null
  displayOrder: number
  isActive: boolean
}

export interface CategoryWriteRequest {
  name: string
  description?: string
  displayOrder: number
  isActive: boolean
}

export interface CategoryFilterParams {
  page?: number
  size?: number
  sort?: string
}
