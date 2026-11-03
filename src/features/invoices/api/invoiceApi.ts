import { apiClient } from '@/shared/lib/axios'
import type { ApiResponse, PageResponse } from '@/shared/types/api.types'
import type {
  CheckoutPreviewPayload,
  CheckoutPreviewResponse,
  CheckoutPayload,
  InvoiceResponse,
} from '@/features/invoices/types/invoice.types'

export interface InvoiceFilterParams {
  tableId?: number
  startDate?: string
  endDate?: string
  page?: number
  size?: number
  sort?: string
}

export const invoiceApi = {
  async previewCheckout(payload: CheckoutPreviewPayload): Promise<CheckoutPreviewResponse> {
    const res = await apiClient.post<ApiResponse<CheckoutPreviewResponse>>('/api/invoices/preview', payload)
    return res.data.data
  },

  async checkout(payload: CheckoutPayload): Promise<InvoiceResponse> {
    const res = await apiClient.post<ApiResponse<InvoiceResponse>>('/api/invoices/checkout', payload)
    return res.data.data
  },

  async getInvoiceById(id: number): Promise<InvoiceResponse> {
    const res = await apiClient.get<ApiResponse<InvoiceResponse>>(`/api/invoices/${id}`)
    return res.data.data
  },

  async getInvoiceBySessionId(sessionId: number): Promise<InvoiceResponse> {
    const res = await apiClient.get<ApiResponse<InvoiceResponse>>(`/api/invoices/session/${sessionId}`)
    return res.data.data
  },

  async getInvoices(params: InvoiceFilterParams = {}): Promise<PageResponse<InvoiceResponse>> {
    const queryParams: Record<string, string | number> = {}
    if (params.tableId) queryParams.tableId = params.tableId
    if (params.startDate) queryParams.startDate = params.startDate
    if (params.endDate) queryParams.endDate = params.endDate
    queryParams.page = params.page ?? 0
    queryParams.size = params.size ?? 15
    if (params.sort) queryParams.sort = params.sort

    const res = await apiClient.get<ApiResponse<PageResponse<InvoiceResponse>>>('/api/invoices', {
      params: queryParams,
    })
    return res.data.data
  },
}
