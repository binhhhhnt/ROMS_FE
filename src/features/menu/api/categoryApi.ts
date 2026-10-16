import axios from 'axios'
import { apiClient } from '@/shared/lib/axios'
import type { ApiResponse, PageResponse } from '@/shared/types/api.types'
import type {
  CategoryResponse,
  CategoryWriteRequest,
  CategoryFilterParams,
} from '../types/category.types'

export const categoryApi = {
  // Feature Thuy API methods
  async list(page: number, size: number, signal?: AbortSignal) {
    const response = await apiClient.get<ApiResponse<PageResponse<CategoryResponse>>>(
      '/api/categories',
      { params: { page, size, sort: 'displayOrder,asc' }, signal },
    )
    return response.data.data
  },

  async create(payload: CategoryWriteRequest) {
    const response = await apiClient.post<ApiResponse<CategoryResponse>>('/api/categories', payload)
    return response.data.data
  },

  async update(id: number, payload: CategoryWriteRequest) {
    const response = await apiClient.put<ApiResponse<CategoryResponse>>(`/api/categories/${id}`, payload)
    return response.data.data
  },

  // Backward-compatible methods
  async getCategories(params?: CategoryFilterParams): Promise<PageResponse<CategoryResponse>> {
    const searchParams = new URLSearchParams()
    if (params?.page !== undefined) searchParams.append('page', params.page.toString())
    if (params?.size !== undefined) searchParams.append('size', params.size.toString())
    if (params?.sort) searchParams.append('sort', params.sort)

    const res = await apiClient.get<ApiResponse<PageResponse<CategoryResponse>>>(
      `/api/categories${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    )
    return res.data.data
  },

  async getCategory(id: number): Promise<CategoryResponse> {
    const res = await apiClient.get<ApiResponse<CategoryResponse>>(`/api/categories/${id}`)
    return res.data.data
  },

  async createCategory(data: CategoryWriteRequest): Promise<CategoryResponse> {
    return this.create(data)
  },

  async updateCategory(id: number, data: CategoryWriteRequest): Promise<CategoryResponse> {
    return this.update(id, data)
  },

  async toggleCategoryStatus(category: CategoryResponse): Promise<CategoryResponse> {
    const updatedData: CategoryWriteRequest = {
      name: category.name,
      description: category.description || '',
      displayOrder: category.displayOrder,
      isActive: !category.isActive,
    }
    return this.update(category.id, updatedData)
  },
}

export function getCategoryErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    switch (error.response?.status) {
      case 400: return 'Thông tin danh mục chưa hợp lệ. Vui lòng kiểm tra lại các trường.'
      case 401: return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
      case 403: return 'Bạn không có quyền quản lý danh mục món.'
      case 404: return 'Danh mục không còn tồn tại. Vui lòng đóng biểu mẫu và làm mới danh sách.'
      case 409: return 'Dữ liệu đã thay đổi hoặc có xung đột. Vui lòng kiểm tra và thử lại.'
    }
  }
  return 'Không thể kết nối hoặc xử lý yêu cầu. Vui lòng thử lại.'
}
