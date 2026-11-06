import { apiClient } from '@/shared/lib/axios'
import type { ApiResponse, PageResponse } from '@/shared/types/api.types'
import type {
  IngredientResponse,
  CreateIngredientRequest,
  UpdateIngredientRequest,
  IngredientFilterParams,
  ExcelImportResult,
} from '@/features/inventory/types/ingredient.types'

export const ingredientApi = {
  async getIngredients(params?: IngredientFilterParams): Promise<PageResponse<IngredientResponse>> {
    const searchParams = new URLSearchParams()
    if (params?.isActive !== undefined) {
      searchParams.append('isActive', params.isActive.toString())
    }
    if (params?.page !== undefined) {
      searchParams.append('page', params.page.toString())
    }
    if (params?.size !== undefined) {
      searchParams.append('size', params.size.toString())
    }
    if (params?.sort) {
      searchParams.append('sort', params.sort)
    }

    const queryStr = searchParams.toString()
    const res = await apiClient.get<ApiResponse<PageResponse<IngredientResponse>>>(
      `/api/ingredients${queryStr ? `?${queryStr}` : ''}`
    )
    return res.data.data
  },

  async getIngredientById(id: number): Promise<IngredientResponse> {
    const res = await apiClient.get<ApiResponse<IngredientResponse>>(`/api/ingredients/${id}`)
    return res.data.data
  },

  async createIngredient(request: CreateIngredientRequest): Promise<IngredientResponse> {
    const res = await apiClient.post<ApiResponse<IngredientResponse>>('/api/ingredients', request)
    return res.data.data
  },

  async importIngredients(ingredients: CreateIngredientRequest[]): Promise<IngredientResponse[]> {
    const res = await apiClient.post<ApiResponse<IngredientResponse[]>>('/api/ingredients/import', { ingredients })
    return res.data.data
  },

  async updateIngredient(id: number, request: UpdateIngredientRequest): Promise<IngredientResponse> {
    const res = await apiClient.put<ApiResponse<IngredientResponse>>(`/api/ingredients/${id}`, request)
    return res.data.data
  },

  async deactivateIngredient(id: number): Promise<IngredientResponse> {
    const res = await apiClient.patch<ApiResponse<IngredientResponse>>(`/api/ingredients/${id}/deactivate`)
    return res.data.data
  },

  async downloadTemplate(): Promise<Blob> {
    const res = await apiClient.get('/api/ingredients/excel/template', {
      responseType: 'blob',
    })
    return res.data
  },

  async exportExcel(): Promise<Blob> {
    const res = await apiClient.get('/api/ingredients/excel/export', {
      responseType: 'blob',
    })
    return res.data
  },

  async importExcel(file: File): Promise<ExcelImportResult> {
    const body = new FormData()
    body.append('file', file)
    const res = await apiClient.post<ApiResponse<ExcelImportResult>>(
      '/api/ingredients/excel/import',
      body,
      {
        headers: { 'Content-Type': undefined },
      }
    )
    return res.data.data
  },
}
