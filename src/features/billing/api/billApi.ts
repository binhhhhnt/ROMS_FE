import { apiClient } from '@/shared/lib/axios'
import type { ApiResponse, PageResponse } from '@/shared/types/api.types'
import type {
  BillPreviewResponse,
  CheckoutBillPayload,
  BillResponse,
} from '@/features/billing/types/bill.types'

export const billApi = {
  async getBillPreview(sessionId: number): Promise<BillPreviewResponse> {
    const res = await apiClient.get<ApiResponse<BillPreviewResponse>>(
      `/api/bills/sessions/${sessionId}/preview`
    )
    return res.data.data
  },

  async checkoutBill(sessionId: number, payload: CheckoutBillPayload): Promise<BillResponse> {
    const res = await apiClient.post<ApiResponse<BillResponse>>(
      `/api/bills/sessions/${sessionId}/checkout`,
      payload
    )
    return res.data.data
  },

  async getBillById(id: number): Promise<BillResponse> {
    const res = await apiClient.get<ApiResponse<BillResponse>>(`/api/bills/${id}`)
    return res.data.data
  },

  async getBillBySessionId(sessionId: number): Promise<BillResponse> {
    const res = await apiClient.get<ApiResponse<BillResponse>>(`/api/bills/sessions/${sessionId}`)
    return res.data.data
  },

  async getBills(
    page: number = 0,
    size: number = 20,
    search?: string
  ): Promise<PageResponse<BillResponse>> {
    const params: Record<string, string | number> = { page, size }
    if (search && search.trim()) {
      params.search = search.trim()
    }
    const res = await apiClient.get<ApiResponse<PageResponse<BillResponse>>>('/api/bills', {
      params,
    })
    return res.data.data
  },

  async printBill(id: number): Promise<void> {
    await apiClient.post(`/api/bills/${id}/print`)
  },

  async printProforma(sessionId: number): Promise<void> {
    await apiClient.post(`/api/bills/sessions/${sessionId}/print-proforma`)
  },
}

