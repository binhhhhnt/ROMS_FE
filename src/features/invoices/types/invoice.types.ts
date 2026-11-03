export type DiscountType = 'NONE' | 'PERCENTAGE' | 'FIXED_AMOUNT'

export interface CheckoutItem {
  menuItemId: number
  menuItemName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface CheckoutPreviewPayload {
  sessionId: number
  discountType: DiscountType
  discountValue: number
}

export interface CheckoutPreviewResponse {
  sessionId: number
  tableId: number
  tableCode: string
  subtotal: number
  discountType: DiscountType
  discountValue: number
  discountAmount: number
  finalAmount: number
  items: CheckoutItem[]
}

export interface CheckoutPayload {
  sessionId: number
  discountType: DiscountType
  discountValue: number
  discountReason?: string
  note?: string
}

export interface InvoiceResponse {
  id: number
  invoiceCode: string
  sessionId: number
  tableId: number
  tableCode: string
  subtotal: number
  discountType: DiscountType
  discountValue: number
  discountAmount: number
  discountReason?: string
  finalAmount: number
  note?: string
  createdAt: string
  closedById?: number
  closedByName?: string
  items: CheckoutItem[]
}

