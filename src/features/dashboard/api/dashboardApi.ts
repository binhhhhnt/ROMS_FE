import { apiClient } from '@/shared/lib/axios'
import type { ApiResponse } from '@/shared/types/api.types'
import type {
  DashboardOverviewResponse,
  BestSellingDishResponse,
  DailyRevenueExpenseResponse,
} from '@/features/dashboard/types/dashboard.types'

export const dashboardApi = {
  async getOverview(startDate?: string, endDate?: string): Promise<DashboardOverviewResponse> {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)

    const res = await apiClient.get<ApiResponse<DashboardOverviewResponse>>(
      `/api/dashboard/overview${params.toString() ? `?${params.toString()}` : ''}`
    )
    return res.data.data
  },

  async getBestSellingDishes(
    startDate?: string,
    endDate?: string,
    limit = 5
  ): Promise<BestSellingDishResponse[]> {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    if (limit) params.append('limit', limit.toString())

    const res = await apiClient.get<ApiResponse<BestSellingDishResponse[]>>(
      `/api/dashboard/best-selling${params.toString() ? `?${params.toString()}` : ''}`
    )
    return res.data.data
  },

  async getDailyTrends(
    startDate?: string,
    endDate?: string
  ): Promise<DailyRevenueExpenseResponse[]> {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)

    const res = await apiClient.get<ApiResponse<DailyRevenueExpenseResponse[]>>(
      `/api/dashboard/trends${params.toString() ? `?${params.toString()}` : ''}`
    )
    return res.data.data
  },

  async exportDailyReport(startDate?: string, endDate?: string): Promise<Blob> {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)

    const res = await apiClient.get(
      `/api/dashboard/export${params.toString() ? `?${params.toString()}` : ''}`,
      { responseType: 'blob' }
    )
    return res.data
  },
}
