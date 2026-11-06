import type { CellValue } from 'exceljs'
import type { IngredientResponse } from '../../inventory/types/ingredient.types'

export const MAX_PURCHASE_IMPORT_ROWS = 500
export const MAX_PURCHASE_IMPORT_BYTES = 5 * 1024 * 1024

export interface PurchaseExcelRow {
  rowNumber: number
  name: string
  unit: string
  quantity: string
  unitPrice: string
  ingredientIssue?: string
  quantityIssue?: string
  unitPriceIssue?: string
}

export interface PurchaseFormRow {
  tempId: string
  ingredientId: number | ''
  quantity: string
  unitPrice: string
  imported?: { rowNumber: number; name: string; unit: string }
  ingredientIssue?: string
  quantityIssue?: string
  unitPriceIssue?: string
}

const normalizeName = (value: string) => value.trim().normalize('NFC').toLocaleLowerCase('vi')
const normalizeHeader = (value: string) => normalizeName(value).normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[\s_()]+/g, '')

function cellText(value: CellValue): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim()
  if (typeof value === 'object' && 'richText' in value) return value.richText.map((part) => part.text).join('').trim()
  throw new Error('Không dùng công thức, ngày tháng hoặc ô lỗi; hãy nhập văn bản hoặc số.')
}

function normalizeNumber(value: string) {
  return /^\d+(?:[.,]\d+)?$/.test(value) ? value.replace(',', '.') : ''
}

export async function readPurchaseExcel(data: ArrayBuffer): Promise<PurchaseExcelRow[]> {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  try {
    await workbook.xlsx.load(data)
  } catch {
    throw new Error('Không đọc được file Excel. Vui lòng dùng file .xlsx không đặt mật khẩu hoặc tải file mẫu.')
  }
  const sheet = workbook.worksheets[0]
  if (!sheet) throw new Error('File không có trang tính.')
  if (sheet.rowCount > MAX_PURCHASE_IMPORT_ROWS + 1) throw new Error(`Tối đa ${MAX_PURCHASE_IMPORT_ROWS} dòng mỗi file.`)
  const columns: Partial<Record<'name' | 'unit' | 'quantity' | 'unitPrice', number>> = {}
  const aliases: Record<string, keyof typeof columns> = {
    tennguyenlieu: 'name', nguyenlieu: 'name', name: 'name', ingredientname: 'name',
    donvi: 'unit', donvitinh: 'unit', dvt: 'unit', unit: 'unit',
    soluongnhap: 'quantity', soluong: 'quantity', quantity: 'quantity',
    dongia: 'unitPrice', dongiavnd: 'unitPrice', dongiavndong: 'unitPrice', unitprice: 'unitPrice',
  }
  sheet.getRow(1).eachCell((cell, index) => {
    const field = aliases[normalizeHeader(cellText(cell.value))]
    if (!field) return
    if (columns[field]) throw new Error(`Cột "${cell.text}" xuất hiện nhiều lần.`)
    columns[field] = index
  })
  if (!columns.name || !columns.quantity || !columns.unitPrice) {
    throw new Error('Dòng đầu cần có cột Tên nguyên liệu, Số lượng nhập, Đơn giá. Vui lòng dùng file mẫu.')
  }
  const rows: PurchaseExcelRow[] = []
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    const parsed: PurchaseExcelRow = { rowNumber, name: '', unit: '', quantity: '', unitPrice: '' }
    for (const field of ['name', 'unit', 'quantity', 'unitPrice'] as const) {
      const index = columns[field]
      if (!index) continue
      try {
        parsed[field] = cellText(row.getCell(index).value)
      } catch (error) {
        const issue = field === 'name' || field === 'unit' ? 'ingredientIssue' : `${field}Issue` as const
        parsed[issue] = (error as Error).message
      }
    }
    if (!parsed.name && !parsed.unit && !parsed.quantity && !parsed.unitPrice
        && !parsed.ingredientIssue && !parsed.quantityIssue && !parsed.unitPriceIssue) return
    for (const field of ['quantity', 'unitPrice'] as const) {
      const original = parsed[field]
      const normalized = normalizeNumber(original)
      if (original && !normalized && !parsed[`${field}Issue`]) {
        parsed[`${field}Issue`] = `Giá trị trong file "${original}" không hợp lệ. Hãy nhập số không có dấu phân cách hàng nghìn.`
      }
      parsed[field] = normalized
    }
    rows.push(parsed)
  })
  if (!rows.length) throw new Error('File chưa có nguyên liệu nhập hàng.')
  return rows
}

export function matchPurchaseRows(rows: PurchaseExcelRow[], ingredients: IngredientResponse[]): PurchaseFormRow[] {
  return rows.map((row) => {
    const matches = ingredients.filter((ingredient) => normalizeName(ingredient.name) === normalizeName(row.name))
    const active = matches.filter((ingredient) => ingredient.isActive)
    let ingredientIssue = row.ingredientIssue
    let ingredientId: number | '' = ''
    if (!ingredientIssue) {
      if (!row.name) ingredientIssue = 'File chưa có tên nguyên liệu. Vui lòng chọn nguyên liệu kho.'
      else if (!matches.length) ingredientIssue = `Không tìm thấy nguyên liệu "${row.name}" trong kho.`
      else if (!active.length) ingredientIssue = `Nguyên liệu "${row.name}" đã ngưng sử dụng.`
      else if (active.length > 1) ingredientIssue = 'Có nhiều nguyên liệu trùng tên. Vui lòng chọn đúng nguyên liệu kho.'
      else if (row.unit && normalizeName(row.unit) !== normalizeName(active[0].unit)) {
        ingredientIssue = `Đơn vị trong file là "${row.unit}", trong kho là "${active[0].unit}". Kiểm tra số lượng và chọn lại nguyên liệu.`
      } else ingredientId = active[0].id
    }
    return {
      tempId: crypto.randomUUID(), ingredientId, quantity: row.quantity, unitPrice: row.unitPrice,
      imported: { rowNumber: row.rowNumber, name: row.name, unit: row.unit },
      ingredientIssue, quantityIssue: row.quantityIssue, unitPriceIssue: row.unitPriceIssue,
    }
  })
}

export function getPurchaseRowIssues(row: PurchaseFormRow, ingredients: IngredientResponse[]): string[] {
  const issues: string[] = []
  const ingredient = ingredients.find((item) => item.id === row.ingredientId)
  if (row.ingredientIssue) issues.push(row.ingredientIssue)
  else if (!ingredient) issues.push('Vui lòng chọn nguyên liệu có trong kho.')
  else if (!ingredient.isActive) issues.push('Nguyên liệu đã ngưng sử dụng; vui lòng chọn nguyên liệu khác.')
  if (row.quantityIssue) issues.push(`Số lượng: ${row.quantityIssue}`)
  else if (!/^\d+(?:\.\d{1,3})?$/.test(row.quantity) || Number(row.quantity) <= 0 || Number(row.quantity) > 999999999.999) {
    issues.push('Số lượng phải lớn hơn 0, tối đa 999999999,999 và 3 chữ số thập phân.')
  }
  if (row.unitPriceIssue) issues.push(`Đơn giá: ${row.unitPriceIssue}`)
  else if (!/^\d+(?:\.\d{1,2})?$/.test(row.unitPrice) || Number(row.unitPrice) > 9999999999.99) {
    issues.push('Đơn giá phải từ 0 đến 9999999999,99 và tối đa 2 chữ số thập phân.')
  }
  return issues
}

export async function downloadPurchaseTemplate() {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Nhập hàng')
  sheet.addRows([
    ['Tên nguyên liệu', 'Đơn vị tính', 'Số lượng nhập', 'Đơn giá (VNĐ)'],
    ['Gạo ST25', 'kg', 10, 25000], ['Dầu ăn', 'lít', 2.5, 40000],
  ])
  sheet.getRow(1).font = { bold: true }
  sheet.columns.forEach((column) => { column.width = 26 })
  const buffer = await workbook.xlsx.writeBuffer()
  const url = URL.createObjectURL(new Blob([new Uint8Array(buffer)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'mau-nhap-hang.xlsx'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
