export type UserRole =
  | 'OWNER'
  | 'SERVICE_STAFF'
  | 'KITCHEN_STAFF'
  | 'INVENTORY_STAFF'
  | 'TABLE_ACCOUNT'

export interface UserProfile {
  id: number
  username: string
  fullName: string
  role: UserRole
  tableId?: number | null
  tableName?: string | null
  status: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponseData {
  accessToken: string
  tokenType: string
  expiresIn: number
}

export interface ForgotPasswordRequest {
  email: string
}

export interface VerifyOtpRequest {
  email: string
  otp: string
}

export interface ResetPasswordRequest {
  email: string
  otp: string
  newPassword: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface UserProfileDetail {
  id: number
  username: string
  fullName: string
  email: string
  role: UserRole
  tableId?: number | null
  tableCode?: string | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface UpdateProfileRequest {
  fullName: string
  email: string
}
