import { apiClient } from '@/shared/lib/axios'
import type { ApiResponse } from '@/shared/types/api.types'
import type {
  LoginRequest,
  LoginResponseData,
  UserProfile,
} from '@/features/auth/types/auth.types'

export const authApi = {
  async login(credentials: LoginRequest): Promise<LoginResponseData> {
    const res = await apiClient.post<ApiResponse<LoginResponseData>>(
      '/api/auth/login',
      credentials
    )
    return res.data.data
  },

  async refresh(): Promise<LoginResponseData> {
    const res = await apiClient.post<ApiResponse<LoginResponseData>>(
      '/api/auth/refresh',
      {}
    )
    return res.data.data
  },

  async getMe(): Promise<UserProfile> {
    const res = await apiClient.get<ApiResponse<UserProfile>>('/api/auth/me')
    return res.data.data
  },

  async logout(): Promise<void> {
    await apiClient.post('/api/auth/logout')
  },
}
