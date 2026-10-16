import type { UserRole } from '@/features/auth/types/auth.types'

export interface UserItem {
  id: number
  username: string
  fullName: string
  email: string
  role: UserRole
  tableId?: number | null
  tableCode?: string | null
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

export interface CreateUserPayload {
  username: string
  password: string
  fullName: string
  email?: string
  role: UserRole
  tableId?: number | null
}

export interface UpdateUserPayload {
  fullName: string
  email?: string
  role: UserRole
  tableId?: number | null
  password?: string
}

export interface UserFilterParams {
  role?: UserRole | ''
  isActive?: boolean | ''
  search?: string
  page?: number
  size?: number
  sort?: string
}

export interface TableOption {
  id: number
  tableCode: string
  capacity: number
  area?: string | null
  isActive: boolean
}
