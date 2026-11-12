import { apiClient } from '@/shared/lib/axios'
import type { ApiResponse } from '@/shared/types/api.types'

export const staffCallApi = {
  async callStaff(tableId: number): Promise<void> {
    await apiClient.post<ApiResponse<void>>(`/api/tables/${tableId}/call-staff`)
  },

  async acknowledgeCall(tableId: number, requestId: string): Promise<void> {
    await apiClient.post<ApiResponse<void>>(
      `/api/tables/${tableId}/call-staff/acknowledge`,
      null,
      { params: { requestId } }
    )
  },
}

