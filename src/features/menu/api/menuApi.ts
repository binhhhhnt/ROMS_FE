import { apiClient } from '@/shared/lib/axios'
import type { ApiResponse, PageResponse } from '@/shared/types/api.types'
import type {
  MenuItemImage, MenuItemReadResponse, MenuItemWriteRequest, MenuItemWriteResponse,
  MenuListParams, MenuStatus, MenuStatusResponse, ExcelImportResult,
} from '../types/menu.types'

export const menuApi = {
  async remove(id: number) {
    await apiClient.delete(`/api/menu-items/${id}`)
  },
  async list(params: MenuListParams, signal?: AbortSignal) {
    const response = await apiClient.get<ApiResponse<PageResponse<MenuItemReadResponse>>>(
      '/api/menu-items', { params, signal },
    )
    return response.data.data
  },
  async detail(id: number, quantity = 1, signal?: AbortSignal) {
    const response = await apiClient.get<ApiResponse<MenuItemReadResponse>>(
      `/api/menu-items/${id}`, { params: { quantity }, signal },
    )
    return response.data.data
  },
  async create(payload: MenuItemWriteRequest) {
    const response = await apiClient.post<ApiResponse<MenuItemWriteResponse>>('/api/menu-items', payload)
    return response.data.data
  },
  async update(id: number, payload: MenuItemWriteRequest) {
    const response = await apiClient.put<ApiResponse<MenuItemWriteResponse>>(`/api/menu-items/${id}`, payload)
    return response.data.data
  },
  async updateStatus(id: number, status: MenuStatus) {
    const response = await apiClient.patch<ApiResponse<MenuStatusResponse>>(`/api/menu-items/${id}/status`, { status })
    return response.data.data
  },
  async uploadImage(id: number, file: File, displayOrder: number) {
    const body = new FormData()
    body.append('file', file)
    const response = await apiClient.post<ApiResponse<MenuItemImage>>(`/api/menu-items/${id}/images`, body, {
      params: { displayOrder },
      // Let the browser supply the multipart boundary instead of the client's JSON header.
      headers: { 'Content-Type': undefined },
    })
    return response.data.data
  },
  async deleteImage(id: number, imageId: number) {
    await apiClient.delete(`/api/menu-items/${id}/images/${imageId}`)
  },
  async downloadTemplate(): Promise<Blob> {
    const response = await apiClient.get('/api/menu-items/excel/template', {
      responseType: 'blob',
    })
    return response.data
  },
  async exportExcel(): Promise<Blob> {
    const response = await apiClient.get('/api/menu-items/excel/export', {
      responseType: 'blob',
    })
    return response.data
  },
  async importExcel(file: File): Promise<ExcelImportResult> {
    const body = new FormData()
    body.append('file', file)
    const response = await apiClient.post<ApiResponse<ExcelImportResult>>(
      '/api/menu-items/excel/import',
      body,
      {
        headers: { 'Content-Type': undefined },
      },
    )
    return response.data.data
  },
}
