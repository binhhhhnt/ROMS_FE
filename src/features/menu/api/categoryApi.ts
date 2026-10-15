import axios from 'axios'
import { apiClient } from '@/shared/lib/axios'
import type { ApiResponse, PageResponse } from '@/shared/types/api.types'
import type { CategoryResponse, CategoryWriteRequest } from '../types/category.types'

export const categoryApi = {
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
