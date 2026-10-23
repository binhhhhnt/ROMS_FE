import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/app/store/authStore'
import type { ApiResponse } from '@/shared/types/api.types'
import type { LoginResponseData } from '@/features/auth/types/auth.types'

const baseURL = import.meta.env.VITE_API_BASE_URL || ''

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

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error)
    } else if (token) {
      promise.resolve(token)
    }
  })
  failedQueue = []
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
      originalRequest.url?.includes('/api/auth/refresh')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return apiClient(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshResponse = await axios.post<ApiResponse<LoginResponseData>>(
          `${baseURL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        )

        const newAccessToken = refreshResponse.data.data.accessToken
        useAuthStore.getState().setAccessToken(newAccessToken)
        processQueue(null, newAccessToken)

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        }

        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        useAuthStore.getState().clearAuth()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

const ERROR_TRANSLATIONS: Record<string, string> = {
  CANNOT_DEACTIVATE_SELF: 'Bạn không thể tự khóa tài khoản của chính mình.',
  TABLE_ACCOUNT_LOCKED: 'Không thể mở phiên phục vụ cho bàn có tài khoản máy tính bảng đang bị khóa.',
  TARGET_TABLE_ACCOUNT_LOCKED: 'Không thể chuyển bàn sang bàn có tài khoản máy tính bảng đang bị khóa.',
  TABLE_HAS_ACTIVE_SESSION: 'Không thể khóa tài khoản khi bàn đang có phiên phục vụ hoạt động.',
  TABLE_ID_REQUIRED: 'Bắt buộc phải chọn bàn ăn liên kết cho tài khoản máy tính bảng.',
  TABLE_INACTIVE: 'Không thể liên kết tài khoản với bàn đang ngưng hoạt động.',
  TABLE_ALREADY_ASSIGNED: 'Bàn ăn này đã được liên kết với một tài khoản máy tính bảng khác.',
  INVALID_TABLE_ASSIGNMENT: 'Tài khoản nhân viên không được phép gán bàn ăn.',
  DUPLICATE_USERNAME: 'Tên đăng nhập này đã tồn tại, vui lòng chọn tên khác.',
  DUPLICATE_EMAIL: 'Địa chỉ email này đã được sử dụng bởi một tài khoản khác.',
  INVALID_CREDENTIALS: 'Tên đăng nhập hoặc mật khẩu không chính xác.',
  USER_NOT_FOUND: 'Không tìm thấy tài khoản người dùng.',
  TABLE_NOT_FOUND: 'Không tìm thấy thông tin bàn ăn yêu cầu.',
  PASSWORD_MISMATCH: 'Mật khẩu cũ không chính xác.',
  INTERNAL_SERVER_ERROR: 'Hệ thống máy chủ gặp lỗi tạm thời. Vui lòng thử lại sau.',
}

function translateErrorMessage(message: string, code?: string): string {
  if (code && ERROR_TRANSLATIONS[code]) {
    return ERROR_TRANSLATIONS[code]
  }

  const lower = message.toLowerCase()

  if (lower.includes('cannot deactivate your own account')) {
    return 'Bạn không thể tự vô hiệu hóa tài khoản của chính mình.'
  }
  if (lower.includes('already linked to user') || lower.includes('already assigned')) {
    return 'Bàn ăn này đã được liên kết với một tài khoản máy tính bảng khác.'
  }
  if (lower.includes('email is already in use') || lower.includes('duplicate_email')) {
    return 'Địa chỉ email này đã được sử dụng bởi tài khoản khác.'
  }
  if (lower.includes('username is already taken') || lower.includes('duplicate_username')) {
    return 'Tên đăng nhập này đã tồn tại trong hệ thống.'
  }
  if (lower.includes('table id is required')) {
    return 'Bắt buộc phải chọn một bàn ăn cho máy tính bảng.'
  }
  if (lower.includes('cannot link account to an inactive table')) {
    return 'Không thể liên kết tài khoản với bàn đang ngưng hoạt động.'
  }
  if (lower.includes('staff accounts cannot be linked to a table')) {
    return 'Tài khoản nhân viên không được liên kết với bàn ăn.'
  }
  if (lower.includes('user not found')) {
    return 'Không tìm thấy tài khoản người dùng tương ứng.'
  }
  if (lower.includes('table not found')) {
    return 'Không tìm thấy bàn ăn tương ứng.'
  }
  if (lower.includes('password must be at least') || lower.includes('password length')) {
    return 'Mật khẩu phải có độ dài tối thiểu 6 ký tự.'
  }
  if (lower.includes('full name cannot be blank')) {
    return 'Họ và tên không được để trống.'
  }
  if (lower.includes('email must be valid')) {
    return 'Địa chỉ email không đúng định dạng.'
  }
  if (lower.includes('invalid username or password') || lower.includes('bad credentials')) {
    return 'Tên đăng nhập hoặc mật khẩu không đúng.'
  }
  if (lower.includes('unexpected internal server error')) {
    return 'Hệ thống máy chủ gặp sự cố tạm thời. Vui lòng thử lại sau.'
  }
  if (lower.includes('access is denied') || lower.includes('forbidden')) {
    return 'Bạn không có quyền thực hiện thao tác này.'
  }
  if (lower.includes('unauthorized')) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
  }
  if (lower.includes('network error')) {
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.'
  }

  return message
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as { message?: string; error?: { code?: string } } | undefined
    const errorCode = responseData?.error?.code
    const rawMessage = responseData?.message

    if (rawMessage) {
      return translateErrorMessage(rawMessage, errorCode)
    }

    if (errorCode && ERROR_TRANSLATIONS[errorCode]) {
      return ERROR_TRANSLATIONS[errorCode]
    }

    if (error.response?.status === 401) {
      return 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.'
    }
    if (error.response?.status === 403) {
      return 'Bạn không có quyền thực hiện hành động này.'
    }
    if (error.response?.status === 404) {
      return 'Không tìm thấy dữ liệu yêu cầu.'
    }
    if (error.response?.status === 409) {
      return 'Dữ liệu đang có xung đột. Vui lòng kiểm tra lại.'
    }
    if (error.response?.status && error.response.status >= 500) {
      return 'Hệ thống máy chủ gặp lỗi tạm thời. Vui lòng thử lại sau.'
    }
    return translateErrorMessage(error.message || 'Có lỗi xảy ra khi kết nối tới máy chủ.')
  }
  return error instanceof Error ? translateErrorMessage(error.message) : 'Có lỗi không xác định xảy ra.'
}
