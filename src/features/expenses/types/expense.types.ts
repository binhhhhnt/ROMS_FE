export interface ExpenseResponse {
  id: number
  name: string
  amount: number
  expenseDate: string
  note: string | null
  status: 'ACTIVE' | 'CANCELLED'
  createdById: number | null
  createdByName: string | null
  cancelledAt: string | null
  cancelledById: number | null
  cancelledByName: string | null
  cancelReason: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateExpenseRequest {
  name: string
  amount: number
  expenseDate: string
  note?: string
}

export interface UpdateExpenseRequest {
  name: string
  amount: number
  expenseDate: string
  note?: string
}

export interface CancelExpenseRequest {
  cancelReason: string
}

export interface ExpenseFilterParams {
  startDate?: string
  endDate?: string
  status?: string
  page?: number
  size?: number
  sort?: string
}
