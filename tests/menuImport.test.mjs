import './helpers/register.mjs'
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import ExcelJS from 'exceljs'
import { calls, resetHttp, replyRaw } from './helpers/httpMock.mjs'
const { readMenuExcel, validateMenuImportRow } = await import('../src/features/menu/utils/menuImport.ts')
const { menuApi } = await import('../src/features/menu/api/menuApi.ts')
const { menuExcelApi, getExcelDuplicateConfirmation, getExcelImportErrors, getExcelErrorMessage } = await import('../src/features/menu/api/menuExcelApi.ts')
beforeEach(resetHttp)
async function excel(rows) { const book = new ExcelJS.Workbook(); book.addWorksheet('Menu').addRows(rows); return new Uint8Array(await book.xlsx.writeBuffer()).buffer }
test('menu import reads required headers and preserves row numbers across blank rows', async () => {
  const rows = await readMenuExcel(await excel([['Tên món', 'Danh mục', 'Giá'], ['Phở', 'Món chính', 65000], [], ['Trà', 'Đồ uống', 20000]]))
  assert.deepEqual(rows.map(r => r.rowNumber), [2, 4])
  assert.equal(rows[0].name, 'Phở')
})
test('menu import rejects corrupted files missing headers and empty worksheets', async () => {
  await assert.rejects(readMenuExcel(new TextEncoder().encode('bad').buffer))
  await assert.rejects(readMenuExcel(await excel([['Sai cột'], ['Phở']])))
  await assert.rejects(readMenuExcel(await excel([['Tên món', 'Danh mục', 'Giá']])))
})
test('menu import rejects duplicate dish names unknown categories and VAT above a hundred', () => {
  const row = { rowNumber: 2, name: 'Phở', category: 'Món chính', price: '65000', vatRate: '8', status: 'AVAILABLE' }
  assert.deepEqual(validateMenuImportRow(row, [row], ['Món chính']), [])
  assert.ok(validateMenuImportRow(row, [row, { ...row, name: 'PHỞ' }], ['Món chính']).some(e => e.includes('Trùng tên')))
  assert.ok(validateMenuImportRow({ ...row, category: 'Không có' }, [row], ['Món chính']).length)
  assert.ok(validateMenuImportRow({ ...row, vatRate: '101' }, [row], ['Món chính']).length)
})
test('menu Excel duplicate confirmation accepts only a structurally valid confirmation response', () => {
  const details = { confirmationToken: 'token', duplicateCount: 1, itemsToCreate: 2, categoriesToCreate: 0, duplicates: [{ row: 2, name: 'Phở', category: 'Món chính', source: 'CATALOG', originalRow: null }] }
  const error = { isAxiosError: true, response: { status: 409, data: { error: { code: 'EXCEL_DUPLICATES_CONFIRMATION_REQUIRED', details } } } }
  assert.deepEqual(getExcelDuplicateConfirmation(error), details)
  assert.equal(getExcelDuplicateConfirmation({ ...error, response: { ...error.response, status: 400 } }), null)
  assert.equal(getExcelDuplicateConfirmation({ isAxiosError: true, response: { status: 409, data: { error: { code: 'EXCEL_DUPLICATES_CONFIRMATION_REQUIRED', details: { ...details, duplicateCount: 2 } } } } }), null)
})
test('menu Excel errors discard malformed row details and decode JSON errors inside blobs', async () => {
  const valid = { sheet: 'Menu', row: 2, column: 3, message: 'Giá sai' }
  const error = { isAxiosError: true, response: { data: { error: { details: [valid, null, { row: 'two' }] } } } }
  assert.deepEqual(getExcelImportErrors(error), [valid])
  const message = await getExcelErrorMessage({ isAxiosError: true, response: { data: new Blob([JSON.stringify({ message: 'Không có quyền' })]) } })
  assert.equal(message, 'Không có quyền')
})
test('menu Excel uploads a real file and confirmation token as multipart form data', async () => {
  const file = new File(['xlsx'], 'menu.xlsx')
  await menuExcelApi.import(file, 'confirmation')
  await menuApi.importExcel(file)
  assert.equal(calls[0].args[0], '/api/menu-excel/import')
  assert.equal(calls[0].args[1].get('file').name, 'menu.xlsx')
  assert.equal(calls[0].args[1].get('confirmationToken'), 'confirmation')
  assert.equal(calls[1].args[0], '/api/menu-items/excel/import')
})
test('menu Excel template preview and downloads preserve binary response handling', async () => {
  await menuExcelApi.preview()
  const blob = new Blob(['xlsx'])
  replyRaw(blob)
  const download = await menuExcelApi.download()
  const template = await menuApi.downloadTemplate()
  const exported = await menuApi.exportExcel()
  assert.equal(download, blob)
  assert.equal(template, blob)
  assert.equal(exported, blob)
  assert.deepEqual(calls.slice(1).map(c => c.args[1]), [{ responseType: 'blob' }, { responseType: 'blob' }, { responseType: 'blob' }])
})
