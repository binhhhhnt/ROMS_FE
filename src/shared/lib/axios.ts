import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/app/store/authStore'
import { resolveApiErrorMessage } from '@/shared/lib/errorMessages'
import type { ApiResponse } from '@/shared/types/api.types'
import type { LoginResponseData } from '@/features/auth/types/auth.types'

const baseURL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach in-memory access token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

let refreshPromise: Promise<LoginResponseData> | null = null

export async function performTokenRefresh(): Promise<LoginResponseData> {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = axios
    .post<ApiResponse<LoginResponseData>>(
      `${baseURL}/api/auth/refresh`,
      {},
      { withCredentials: true }
    )
    .then((res) => {
      const tokenData = res.data.data
      useAuthStore.getState().setAccessToken(tokenData.accessToken)
      return tokenData
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

// 401 Interceptor with single-flight refresh token rotation
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (!originalRequest) {
      return Promise.reject(error)
    }

    const isAuthRoute =
      originalRequest.url?.includes('/api/auth/login') ||
      originalRequest.url?.includes('/api/auth/refresh') ||
      originalRequest.url?.includes('/api/auth/logout')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true

      try {
        const tokenData = await performTokenRefresh()
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${tokenData.accessToken}`
        }
        return apiClient(originalRequest)
      } catch (refreshError) {
        useAuthStore.getState().clearAuth()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export function getApiErrorMessage(error: unknown): string {
  return resolveApiErrorMessage(error)
}
