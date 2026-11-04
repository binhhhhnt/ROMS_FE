import { apiClient } from '@/shared/lib/axios'
import type { ApiResponse } from '@/shared/types/api.types'
import type {
  RestaurantSettingResponse,
  UpdateSettingRequest,
  TaxCategoryResponse,
  TaxCategoryRequest,
} from '@/features/settings/types/settings.types'

export const settingsApi = {
  async getSettings(): Promise<RestaurantSettingResponse> {
    const res = await apiClient.get<ApiResponse<any>>('/api/settings')
    const raw = res.data.data
    const val = raw?.menuPriceIncludesVat ?? raw?.menu_price_includes_vat ?? true
    return {
      id: raw?.id ?? 1,
      menuPriceIncludesVat: Boolean(val),
      menu_price_includes_vat: Boolean(val),
      createdAt: raw?.createdAt ?? raw?.created_at ?? '',
      updatedAt: raw?.updatedAt ?? raw?.updated_at ?? '',
    }
  },

  async updateSettings(data: UpdateSettingRequest): Promise<RestaurantSettingResponse> {
    const val = Boolean(data.menuPriceIncludesVat ?? data.menu_price_includes_vat)
    const payload = {
      menu_price_includes_vat: val,
      menuPriceIncludesVat: val,
    }
    const res = await apiClient.put<ApiResponse<any>>('/api/settings', payload)
    const raw = res.data.data
    const resVal = raw?.menuPriceIncludesVat ?? raw?.menu_price_includes_vat ?? val
    return {
      id: raw?.id ?? 1,
      menuPriceIncludesVat: Boolean(resVal),
      menu_price_includes_vat: Boolean(resVal),
      createdAt: raw?.createdAt ?? raw?.created_at ?? '',
      updatedAt: raw?.updatedAt ?? raw?.updated_at ?? '',
    }
  },

  async getTaxCategories(): Promise<TaxCategoryResponse[]> {
    const res = await apiClient.get<ApiResponse<TaxCategoryResponse[]>>('/api/tax-categories')
    return res.data.data
  },

  async getTaxCategoryById(id: number): Promise<TaxCategoryResponse> {
    const res = await apiClient.get<ApiResponse<TaxCategoryResponse>>(`/api/tax-categories/${id}`)
    return res.data.data
  },

  async createTaxCategory(data: TaxCategoryRequest): Promise<TaxCategoryResponse> {
    const res = await apiClient.post<ApiResponse<TaxCategoryResponse>>('/api/tax-categories', data)
    return res.data.data
  },
}
