import type { CellValue } from 'exceljs'
import type { CreateIngredientRequest } from '../types/ingredient.types'

export const MAX_IMPORT_ROWS = 500
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024

export interface IngredientImportRow {
  rowNumber: number
  name: string
  unit: string
  minimumStock: string
  cellError?: string
}

const normalizeHeader = (value: string) => value.trim().toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[\s_]+/g, '')

function cellText(value: CellValue): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim()
  if (typeof value === 'object' && 'richText' in value) {
    return value.richText.map((part) => part.text).join('').trim()
  }
  throw new Error('Chỉ nhập văn bản hoặc số; không dùng công thức, ngày tháng hay ô lỗi.')
}

export async function readIngredientExcel(data: ArrayBuffer): Promise<IngredientImportRow[]> {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  try {
    await workbook.xlsx.load(data)
  } catch {
    throw new Error('Không đọc được file Excel. File có thể bị hỏng hoặc được đặt mật khẩu; vui lòng dùng file mẫu.')
  }
  const sheet = workbook.worksheets[0]
  if (!sheet) throw new Error('File không có trang tính.')
  if (sheet.rowCount > MAX_IMPORT_ROWS + 1) {
    throw new Error(`File chỉ được có tối đa ${MAX_IMPORT_ROWS} dòng nguyên liệu. Hãy chia nhỏ file.`)
  }
  const columns: Partial<Record<'name' | 'unit' | 'minimumStock', number>> = {}
  const aliases: Record<string, 'name' | 'unit' | 'minimumStock'> = {
    tennguyenlieu: 'name', name: 'name',
    donvitinh: 'unit', donvi: 'unit', unit: 'unit',
    muctontoithieu: 'minimumStock', tontoithieu: 'minimumStock', minimumstock: 'minimumStock',
  }
  sheet.getRow(1).eachCell((cell, col) => {
    const key = aliases[normalizeHeader(cellText(cell.value))]
    if (!key) return
    if (columns[key]) throw new Error(`Cột ${cell.text} xuất hiện nhiều lần.`)
    columns[key] = col
  })
  if (!columns.name || !columns.unit) {
    throw new Error('Dòng đầu cần có cột "Tên nguyên liệu" và "Đơn vị tính". Vui lòng dùng file mẫu.')
  }
  const rows: IngredientImportRow[] = []
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    const parsed: IngredientImportRow = { rowNumber, name: '', unit: '', minimumStock: '' }
    for (const key of ['name', 'unit', 'minimumStock'] as const) {
      const column = columns[key]
      if (!column) continue
      try {
        parsed[key] = cellText(row.getCell(column).value)
      } catch (error) {
        parsed.cellError = (error as Error).message
      }
    }
    if (parsed.name || parsed.unit || parsed.minimumStock || parsed.cellError) rows.push(parsed)
  })
  if (!rows.length) throw new Error('File chưa có dữ liệu nguyên liệu.')
  return rows
}

export function validateImportRow(row: IngredientImportRow, selectedRows: IngredientImportRow[]): string[] {
  const errors: string[] = []
  if (row.cellError) errors.push(row.cellError)
  if (!row.name || row.name.length > 255) errors.push('Tên bắt buộc, tối đa 255 ký tự.')
  if (!row.unit || row.unit.length > 20) errors.push('Đơn vị bắt buộc, tối đa 20 ký tự.')
  if (row.minimumStock && (!/^\d+(?:[.,]\d{1,3})?$/.test(row.minimumStock)
      || Number(row.minimumStock.replace(',', '.')) > 999999999.999)) {
    errors.push('Tồn tối thiểu phải từ 0 đến 999999999,999; tối đa 3 số thập phân, không dùng dấu phân cách hàng nghìn.')
  }
  if (row.name && selectedRows.filter((other) => other.name.toLocaleLowerCase('vi') === row.name.toLocaleLowerCase('vi')).length > 1) {
    errors.push('Trùng tên với dòng khác đang chọn.')
  }
  return errors
}

export function toIngredientRequest(row: IngredientImportRow): CreateIngredientRequest {
  return {
    name: row.name,
    unit: row.unit,
    minimumStock: row.minimumStock ? Number(row.minimumStock.replace(',', '.')) : null,
  }
}

export async function downloadIngredientTemplate() {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Nguyên liệu')
  sheet.addRow(['Tên nguyên liệu', 'Đơn vị tính', 'Mức tồn tối thiểu'])
  sheet.addRow(['Gạo ST25', 'kg', 5])
  sheet.addRow(['Dầu ăn', 'lít', 2.5])
  sheet.getRow(1).font = { bold: true }
  sheet.columns.forEach((column) => { column.width = 26 })
  const buffer = await workbook.xlsx.writeBuffer()
  const url = URL.createObjectURL(new Blob([new Uint8Array(buffer)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'mau-nhap-nguyen-lieu.xlsx'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
