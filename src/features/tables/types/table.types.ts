export type TableRealtimeStatus = 'EMPTY' | 'OCCUPIED' | 'OUT_OF_SERVICE'
export type ServiceSessionStatus = 'ACTIVE' | 'CLOSED'

export interface TableItem {
  id: number
  tableCode: string
  capacity: number
  area?: string | null
  isActive: boolean
  realtimeStatus: TableRealtimeStatus
  activeSessionId?: number | null
  createdAt?: string
  updatedAt?: string
}

export interface CreateTablePayload {
  tableCode: string
  capacity: number
  area?: string | null
}

export interface UpdateTablePayload {
  tableCode: string
  capacity: number
  area?: string | null
}

export interface TableFilterParams {
  isActive?: boolean | ''
  area?: string
  search?: string
  page?: number
  size?: number
  sort?: string
}

export interface ServiceSessionItem {
  id: number
  tableId: number
  tableCode: string
  status: ServiceSessionStatus
  openedAt: string
  openedById?: number | null
  openedByName?: string | null
  closedAt?: string | null
  closedById?: number | null
  closedByName?: string | null
}

export interface TableTransferHistoryItem {
  id: number
  serviceSessionId: number
  fromTableId: number
  fromTableCode: string
  toTableId: number
  toTableCode: string
  transferredById?: number | null
  transferredByName?: string | null
  transferredAt: string
}

export interface SessionFilterParams {
  tableId?: number
  status?: ServiceSessionStatus
  page?: number
  size?: number
  sort?: string
}
