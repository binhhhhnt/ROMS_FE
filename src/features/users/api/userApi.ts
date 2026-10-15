import { apiClient } from '@/shared/lib/axios'
import type { ApiResponse, PageResponse } from '@/shared/types/api.types'
import type {
  UserItem,
  CreateUserPayload,
  UpdateUserPayload,
  UserFilterParams,
  TableOption,
} from '@/features/users/types/user.types'

export const userApi = {
  async getUsers(params: UserFilterParams = {}): Promise<PageResponse<UserItem>> {
    const queryParams: Record<string, string | number | boolean> = {}

    if (params.role) queryParams.role = params.role
    if (typeof params.isActive === 'boolean') queryParams.isActive = params.isActive
    if (params.search?.trim()) queryParams.search = params.search.trim()
    queryParams.page = params.page ?? 0
    queryParams.size = params.size ?? 10
    if (params.sort) queryParams.sort = params.sort

    const res = await apiClient.get<ApiResponse<PageResponse<UserItem>>>('/api/users', {
      params: queryParams,
    })
    return res.data.data
  },

  async getUserById(id: number): Promise<UserItem> {
    const res = await apiClient.get<ApiResponse<UserItem>>(`/api/users/${id}`)
    return res.data.data
  },

  async createUser(payload: CreateUserPayload): Promise<UserItem> {
    const res = await apiClient.post<ApiResponse<UserItem>>('/api/users', payload)
    return res.data.data
  },

  async updateUser(id: number, payload: UpdateUserPayload): Promise<UserItem> {
    const res = await apiClient.put<ApiResponse<UserItem>>(`/api/users/${id}`, payload)
    return res.data.data
  },

  async updateUserStatus(id: number, isActive: boolean): Promise<UserItem> {
    const res = await apiClient.patch<ApiResponse<UserItem>>(`/api/users/${id}/status`, {
      isActive,
    })
    return res.data.data
  },

  async getTables(): Promise<TableOption[]> {
    const res = await apiClient.get<ApiResponse<PageResponse<TableOption>>>('/api/tables', {
      params: { size: 100, isActive: true },
    })
    return res.data.data.content
  },
}
