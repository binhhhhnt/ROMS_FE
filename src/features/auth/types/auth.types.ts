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
