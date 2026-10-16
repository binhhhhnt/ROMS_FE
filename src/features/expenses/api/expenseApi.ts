import { apiClient } from '@/shared/lib/axios'
import type { ApiResponse, PageResponse } from '@/shared/types/api.types'
import type {
  ExpenseResponse,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  CancelExpenseRequest,
  ExpenseFilterParams,
} from '@/features/expenses/types/expense.types'

export const expenseApi = {
  async getExpenses(params?: ExpenseFilterParams): Promise<PageResponse<ExpenseResponse>> {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    if (params?.status && params.status !== 'ALL') queryParams.append('status', params.status)
    if (params?.page !== undefined) queryParams.append('page', params.page.toString())
    if (params?.size !== undefined) queryParams.append('size', params.size.toString())
    if (params?.sort) queryParams.append('sort', params.sort)

    const res = await apiClient.get<ApiResponse<PageResponse<ExpenseResponse>>>(
      `/api/expenses${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    )
    return res.data.data
  },

  async getExpenseById(id: number): Promise<ExpenseResponse> {
    const res = await apiClient.get<ApiResponse<ExpenseResponse>>(`/api/expenses/${id}`)
    return res.data.data
  },

  async createExpense(data: CreateExpenseRequest): Promise<ExpenseResponse> {
    const res = await apiClient.post<ApiResponse<ExpenseResponse>>('/api/expenses', data)
    return res.data.data
  },

  async updateExpense(id: number, data: UpdateExpenseRequest): Promise<ExpenseResponse> {
    const res = await apiClient.put<ApiResponse<ExpenseResponse>>(`/api/expenses/${id}`, data)
    return res.data.data
  },

  async cancelExpense(id: number, data: CancelExpenseRequest): Promise<ExpenseResponse> {
    const res = await apiClient.post<ApiResponse<ExpenseResponse>>(`/api/expenses/${id}/cancel`, data)
    return res.data.data
  },
}
