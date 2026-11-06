import type { CellValue } from 'exceljs'

export const MAX_IMPORT_ROWS = 1000
export const MAX_IMPORT_BYTES = 10 * 1024 * 1024

export interface MenuImportRow {
  rowNumber: number
  name: string
  category: string
  price: string
  vatRate: string
  description: string
  status: string
  isFeatured: boolean
  isDirectSale: boolean
  cellError?: string
}

const normalizeHeader = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[\s_*()/%]+/g, '')

function cellText(value: CellValue): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim()
  if (typeof value === 'object' && 'richText' in value) {
    return value.richText.map((part) => part.text).join('').trim()
  }
  return String(value).trim()
}

export async function readMenuExcel(data: ArrayBuffer): Promise<MenuImportRow[]> {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  try {
    await workbook.xlsx.load(data)
  } catch {
    throw new Error('Không đọc được file Excel. File có thể bị hỏng hoặc được đặt mật khẩu; vui lòng dùng file mẫu.')
  }
  const sheet = workbook.worksheets[0]
  if (!sheet) throw new Error('File không có trang tính nào.')
  if (sheet.rowCount > MAX_IMPORT_ROWS + 1) {
    throw new Error(`File chỉ được có tối đa ${MAX_IMPORT_ROWS} dòng món ăn. Hãy chia nhỏ file.`)
  }

  const columns: Partial<
    Record<
      | 'name'
      | 'category'
      | 'price'
      | 'vatRate'
      | 'description'
      | 'status'
      | 'isFeatured'
      | 'isDirectSale',
      number
    >
  > = {}

  const aliases: Record<
    string,
    | 'name'
    | 'category'
    | 'price'
    | 'vatRate'
    | 'description'
    | 'status'
    | 'isFeatured'
    | 'isDirectSale'
  > = {
    tenmon: 'name',
    name: 'name',
    tendanhmuc: 'category',
    danhmuc: 'category',
    category: 'category',
    gianiemyet: 'price',
    gia: 'price',
    price: 'price',
    thuesuatvat: 'vatRate',
    thuevat: 'vatRate',
    vat: 'vatRate',
    vatrate: 'vatRate',
    mota: 'description',
    description: 'description',
    trangthai: 'status',
    status: 'status',
    monnoibat: 'isFeatured',
    noibat: 'isFeatured',
    isfeatured: 'isFeatured',
    hangbantructiep: 'isDirectSale',
    bantructiep: 'isDirectSale',
    isdirectsale: 'isDirectSale',
  }

  sheet.getRow(1).eachCell((cell, col) => {
    const key = aliases[normalizeHeader(cellText(cell.value))]
    if (!key) return
    if (!columns[key]) columns[key] = col
  })

  if (!columns.name || !columns.category || !columns.price) {
    throw new Error(
      'Dòng đầu cần có ít nhất các cột: "Tên món (*)", "Tên danh mục (*)", "Giá niêm yết (*)". Vui lòng dùng file mẫu.'
    )
  }

  const rows: MenuImportRow[] = []
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return

    const name = columns.name ? cellText(row.getCell(columns.name).value) : ''
    const category = columns.category ? cellText(row.getCell(columns.category).value) : ''
    const price = columns.price ? cellText(row.getCell(columns.price).value) : ''
    const vatRate = columns.vatRate ? cellText(row.getCell(columns.vatRate).value) : '8'
    const description = columns.description ? cellText(row.getCell(columns.description).value) : ''
    const statusRaw = columns.status ? cellText(row.getCell(columns.status).value).toUpperCase() : 'AVAILABLE'
    const featuredRaw = columns.isFeatured ? cellText(row.getCell(columns.isFeatured).value).toUpperCase() : ''
    const directSaleRaw = columns.isDirectSale ? cellText(row.getCell(columns.isDirectSale).value).toUpperCase() : ''

    if (!name && !category && !price) return

    const isFeatured = ['CÓ', 'CO', 'YES', 'TRUE', '1'].includes(featuredRaw)
    const isDirectSale = ['CÓ', 'CO', 'YES', 'TRUE', '1'].includes(directSaleRaw)
    const status = statusRaw.includes('TEMP') || statusRaw.includes('TAM_NGUNG')
      ? 'TEMPORARILY_UNAVAILABLE'
      : statusRaw.includes('DISCONTINUED') || statusRaw.includes('NGUNG')
      ? 'DISCONTINUED'
      : 'AVAILABLE'

    rows.push({
      rowNumber,
      name,
      category,
      price,
      vatRate: vatRate || '8',
      description,
      status,
      isFeatured,
      isDirectSale,
    })
  })

  if (!rows.length) throw new Error('File chưa có dữ liệu món ăn.')
  return rows
}

export function validateMenuImportRow(
  row: MenuImportRow,
  selectedRows: MenuImportRow[],
  validCategories: string[]
): string[] {
  const errors: string[] = []
  if (row.cellError) errors.push(row.cellError)
  if (!row.name || row.name.length > 255) errors.push('Tên món bắt buộc, tối đa 255 ký tự.')
  if (!row.category) {
    errors.push('Tên danh mục không được để trống.')
  } else if (
    validCategories.length > 0 &&
    !validCategories.some(
      (cat) => cat.trim().toLowerCase() === row.category.trim().toLowerCase()
    )
  ) {
    errors.push(`Danh mục "${row.category}" chưa có trong hệ thống. Vui lòng tạo danh mục trước.`)
  }

  const numPrice = Number(row.price.replace(/[^\d.-]/g, ''))
  if (isNaN(numPrice) || numPrice < 0) {
    errors.push('Giá niêm yết không hợp lệ (phải >= 0).')
  }

  if (row.vatRate) {
    const numVat = Number(row.vatRate.replace(',', '.'))
    if (isNaN(numVat) || numVat < 0 || numVat > 100) {
      errors.push('Thuế suất VAT phải từ 0% đến 100%.')
    }
  }

  if (
    row.name &&
    selectedRows.filter(
      (other) => other.name.toLocaleLowerCase('vi') === row.name.toLocaleLowerCase('vi')
    ).length > 1
  ) {
    errors.push('Trùng tên món với dòng khác đang chọn trong file.')
  }

  return errors
}
