export type DiscountType = 'PERCENT' | 'FIXED_AMOUNT'

export type PromotionStatusBadge =
  | 'ACTIVE'
  | 'EXPIRED'
  | 'NOT_STARTED'
  | 'OUT_OF_USES'
  | 'INACTIVE'

export interface PromotionResponse {
  id: number
  name: string
  code: string
  discountType: DiscountType
  discountValue: number
  maxUses: number | null
  usedCount: number
  startDate: string | null
  endDate: string | null
  isActive: boolean
  statusBadge: PromotionStatusBadge
  createdById: number | null
  createdByName: string | null
  createdAt: string
  updatedAt: string
}

export interface PromotionDto {
  id: number
  name: string
  code: string
  discountType: DiscountType
  discountValue: number
  maxUses: number | null
  usedCount?: number
  startDate: string | null
  endDate: string | null
}

export interface CreatePromotionRequest {
  name: string
  code: string
  discountType: DiscountType
  discountValue: number
  maxUses?: number | null
  startDate?: string | null
  endDate?: string | null
  isActive?: boolean
}

export interface UpdatePromotionRequest {
  name: string
  code: string
  discountType: DiscountType
  discountValue: number
  maxUses?: number | null
  startDate?: string | null
  endDate?: string | null
  isActive?: boolean
}

export interface PromotionFilterParams {
  search?: string
  isActive?: boolean
  page?: number
  size?: number
  sort?: string
}

