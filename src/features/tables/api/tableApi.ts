import { apiClient } from '@/shared/lib/axios'
import type { ApiResponse, PageResponse } from '@/shared/types/api.types'
import type {
  TableItem,
  CreateTablePayload,
  UpdateTablePayload,
  TableFilterParams,
  ServiceSessionItem,
  TableTransferHistoryItem,
  SessionFilterParams,
} from '@/features/tables/types/table.types'

export const tableApi = {
  // Table operations
  async getTables(params: TableFilterParams = {}): Promise<PageResponse<TableItem>> {
    const queryParams: Record<string, string | number | boolean> = {}
    if (typeof params.isActive === 'boolean') queryParams.isActive = params.isActive
    if (params.area?.trim()) queryParams.area = params.area.trim()
    if (params.search?.trim()) queryParams.search = params.search.trim()
    queryParams.page = params.page ?? 0
    queryParams.size = params.size ?? 50
    if (params.sort) queryParams.sort = params.sort

    const res = await apiClient.get<ApiResponse<PageResponse<TableItem>>>('/api/tables', {
      params: queryParams,
    })
    return res.data.data
  },

  async getTableById(id: number): Promise<TableItem> {
    const res = await apiClient.get<ApiResponse<TableItem>>(`/api/tables/${id}`)
    return res.data.data
  },

  async createTable(payload: CreateTablePayload): Promise<TableItem> {
    const res = await apiClient.post<ApiResponse<TableItem>>('/api/tables', payload)
    return res.data.data
  },

  async updateTable(id: number, payload: UpdateTablePayload): Promise<TableItem> {
    const res = await apiClient.put<ApiResponse<TableItem>>(`/api/tables/${id}`, payload)
    return res.data.data
  },

  async updateTableStatus(id: number, isActive: boolean): Promise<TableItem> {
    const res = await apiClient.patch<ApiResponse<TableItem>>(`/api/tables/${id}/status`, {
      isActive,
    })
    return res.data.data
  },

  async getAreas(): Promise<string[]> {
    const res = await apiClient.get<ApiResponse<string[]>>('/api/tables/areas')
    return res.data.data
  },

  // Service session operations
  async openSession(tableId: number): Promise<ServiceSessionItem> {
    const res = await apiClient.post<ApiResponse<ServiceSessionItem>>(
      `/api/sessions/tables/${tableId}/open`
    )
    return res.data.data
  },

  async closeSession(sessionId: number): Promise<ServiceSessionItem> {
    const res = await apiClient.post<ApiResponse<ServiceSessionItem>>(
      `/api/sessions/${sessionId}/close`
    )
    return res.data.data
  },

  async getSessionById(sessionId: number): Promise<ServiceSessionItem> {
    const res = await apiClient.get<ApiResponse<ServiceSessionItem>>(
      `/api/sessions/${sessionId}`
    )
    return res.data.data
  },

  async getSessions(params: SessionFilterParams = {}): Promise<PageResponse<ServiceSessionItem>> {
    const queryParams: Record<string, string | number> = {}
    if (params.tableId) queryParams.tableId = params.tableId
    if (params.status) queryParams.status = params.status
    queryParams.page = params.page ?? 0
    queryParams.size = params.size ?? 20
    if (params.sort) queryParams.sort = params.sort

    const res = await apiClient.get<ApiResponse<PageResponse<ServiceSessionItem>>>(
      '/api/sessions',
      { params: queryParams }
    )
    return res.data.data
  },

  async transferTable(sessionId: number, toTableId: number): Promise<ServiceSessionItem> {
    const res = await apiClient.post<ApiResponse<ServiceSessionItem>>(
      `/api/sessions/${sessionId}/transfer`,
      { toTableId }
    )
    return res.data.data
  },

  async getTransferHistory(
    sessionId: number,
    page = 0,
    size = 20
  ): Promise<PageResponse<TableTransferHistoryItem>> {
    const res = await apiClient.get<ApiResponse<PageResponse<TableTransferHistoryItem>>>(
      `/api/sessions/${sessionId}/transfers`,
      { params: { page, size } }
    )
    return res.data.data
  },
}
