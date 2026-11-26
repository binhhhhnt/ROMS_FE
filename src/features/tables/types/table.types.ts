export type TableRealtimeStatus = 'EMPTY' | 'OCCUPIED' | 'OUT_OF_SERVICE'
export type ServiceSessionStatus = 'ACTIVE' | 'CLOSED'

export interface AreaItem {
  id: number
  name: string
  isActive: boolean
  activeTableCount: number
}

export interface TableItem {
  id: number
  tableCode: string
  capacity: number
  areaId?: number | null
  area?: string | null
  isActive: boolean
  realtimeStatus: TableRealtimeStatus
  activeSessionId?: number | null
  activeSessionCode?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface CreateTablePayload {
  tableCode: string
  capacity: number
  areaId: number
}

export interface UpdateTablePayload {
  tableCode: string
  capacity: number
  areaId: number
}

export interface TableFilterParams {
  isActive?: boolean | ''
  areaId?: number
  search?: string
  page?: number
  size?: number
  sort?: string
}

export interface ServiceSessionItem {
  id: number
  sessionCode?: string
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
  search?: string
  page?: number
  size?: number
  sort?: string
}
