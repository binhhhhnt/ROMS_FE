import { apiClient } from '@/shared/lib/axios'
import type { ApiResponse } from '@/shared/types/api.types'
import type {
  LoginRequest,
  LoginResponseData,
  UserProfile,
  ForgotPasswordRequest,
  VerifyOtpRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  UserProfileDetail,
  UpdateProfileRequest,
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

  async forgotPassword(payload: ForgotPasswordRequest): Promise<string> {
    const res = await apiClient.post<ApiResponse<null>>(
      '/api/auth/forgot-password',
      payload
    )
    return res.data.message
  },

  async verifyOtp(payload: VerifyOtpRequest): Promise<string> {
    const res = await apiClient.post<ApiResponse<null>>(
      '/api/auth/verify-otp',
      payload
    )
    return res.data.message
  },

  async resetPassword(payload: ResetPasswordRequest): Promise<string> {
    const res = await apiClient.post<ApiResponse<null>>(
      '/api/auth/reset-password',
      payload
    )
    return res.data.message
  },

  async getProfile(): Promise<UserProfileDetail> {
    const res = await apiClient.get<ApiResponse<UserProfileDetail>>(
      '/api/users/me/profile'
    )
    return res.data.data
  },

  async updateProfile(payload: UpdateProfileRequest): Promise<UserProfileDetail> {
    const res = await apiClient.put<ApiResponse<UserProfileDetail>>(
      '/api/users/me/profile',
      payload
    )
    return res.data.data
  },

  async changePassword(payload: ChangePasswordRequest): Promise<string> {
    const res = await apiClient.post<ApiResponse<null>>(
      '/api/users/me/change-password',
      payload
    )
    return res.data.message
  },
}

