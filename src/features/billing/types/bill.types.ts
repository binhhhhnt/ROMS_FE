export type PaymentMethod = 'CASH' | 'BANK_TRANSFER'

export interface TaxBreakdownDto {
  rate: number
  taxableAmount: number
  taxAmount: number
}

export interface BillPreviewItemDto {
  orderItemId: number
  menuItemId?: number
  itemName: string
  quantity: number
  unitPrice: number
  taxRate: number
  isVatInclusive: boolean
  subtotal: number
}

export interface PromotionDto {
  id: number
  name: string
  code: string
  discountType: 'PERCENT' | 'FIXED_AMOUNT'
  discountValue: number
  maxUses?: number
  usedCount: number
  startDate?: string
  endDate?: string
}

export interface BillPreviewResponse {
  sessionId: number
  tableCode: string
  openedAt: string
  items: BillPreviewItemDto[]
  subtotal: number
  menuPriceIncludesVat: boolean
  taxBreakdowns: TaxBreakdownDto[]
  totalTax: number
  amountBeforeDiscount: number
  availablePromotions: PromotionDto[]
}

export interface PaymentItemDto {
  paymentMethod: PaymentMethod
  amount: number
}

export interface CheckoutBillPayload {
  promotionCode?: string
  payments: PaymentItemDto[]
}

export interface BillItemResponse {
  id: number
  orderItemId?: number
  itemName: string
  quantity: number
  unitPrice: number
  taxRate: number
  isVatInclusive: boolean
  subtotal: number
}

export interface PaymentResponse {
  id: number
  paymentMethod: PaymentMethod
  amount: number
}

export interface BillResponse {
  id: number
  billCode: string
  sessionId: number
  tableCode: string
  amountBeforeDiscount: number
  promotionId?: number
  promotionCode?: string
  promotionName?: string
  discountAmount: number
  totalAmount: number
  items: BillItemResponse[]
  payments: PaymentResponse[]
  createdById?: number
  createdByName?: string
  createdAt: string
  openedAt?: string
  closedAt?: string
}

