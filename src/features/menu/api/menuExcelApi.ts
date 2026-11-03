import axios from 'axios'
import { apiClient, getApiErrorMessage } from '@/shared/lib/axios'
import type { ApiErrorResponse, ApiResponse } from '@/shared/types/api.types'

export interface MenuExcelSheet {
  name: string
  columns: string[]
  rows: (string | number)[][]
}

export interface MenuExcelPreview {
  filename: string
  sheets: MenuExcelSheet[]
}

export interface MenuExcelImportResult {
  categoriesCreated: number
  categoriesReused: number
  itemsCreated: number
  itemsSkipped: number
}

export interface MenuExcelImportError {
  sheet: string
  row: number | null
  column: number | null
  message: string
}

export interface MenuExcelDuplicateConfirmation {
  duplicateCount: number
  itemsToCreate: number
  categoriesToCreate: number
  confirmationToken: string
  duplicates: { row: number; name: string; category: string; source: 'CATALOG' | 'FILE'; originalRow: number | null }[]
}

export function getExcelDuplicateConfirmation(error: unknown): MenuExcelDuplicateConfirmation | null {
  if (!axios.isAxiosError<ApiErrorResponse>(error) || error.response?.status !== 409
    || error.response.data.error?.code !== 'EXCEL_DUPLICATES_CONFIRMATION_REQUIRED') return null
  const details = error.response.data.error.details
  if (!details || typeof details !== 'object') return null
  const value = details as Partial<MenuExcelDuplicateConfirmation>
  if (typeof value.confirmationToken !== 'string' || !value.confirmationToken
    || typeof value.duplicateCount !== 'number' || value.duplicateCount <= 0
    || !Number.isInteger(value.itemsToCreate) || !Number.isInteger(value.categoriesToCreate)
    || !Array.isArray(value.duplicates) || value.duplicates.length !== value.duplicateCount
    || !value.duplicates.every(item => item && Number.isInteger(item.row) && typeof item.name === 'string'
      && typeof item.category === 'string' && (item.source === 'CATALOG' || item.source === 'FILE')
      && (item.originalRow === null || Number.isInteger(item.originalRow)))) return null
  return value as MenuExcelDuplicateConfirmation
}

export function getExcelImportErrors(error: unknown): MenuExcelImportError[] {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) return []
  const details = error.response?.data?.error?.details
  if (!Array.isArray(details)) return []
  return details.filter((value): value is MenuExcelImportError => value !== null && typeof value === 'object'
    && typeof value.sheet === 'string' && typeof value.message === 'string'
    && (value.row === null || Number.isInteger(value.row))
    && (value.column === null || Number.isInteger(value.column)))
}

export const menuExcelApi = {
  async preview(signal?: AbortSignal) {
    const response = await apiClient.get<ApiResponse<MenuExcelPreview>>('/api/menu-excel/template/preview', { signal })
    return response.data.data
  },
  async download() {
    const response = await apiClient.get<Blob>('/api/menu-excel/template', { responseType: 'blob' })
    return response.data
  },
  async import(file: File, confirmationToken?: string) {
    const body = new FormData()
    body.append('file', file)
    if (confirmationToken) body.append('confirmationToken', confirmationToken)
    const response = await apiClient.post<ApiResponse<MenuExcelImportResult>>('/api/menu-excel/import', body, {
      headers: { 'Content-Type': undefined },
    })
    return response.data.data
  },
}

export async function getExcelErrorMessage(error: unknown) {
  if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      const data: { message?: string } = JSON.parse(await error.response.data.text())
      if (data.message) return data.message
    } catch { /* Fall back to the normal API error message. */ }
  }
  return getApiErrorMessage(error)
}
