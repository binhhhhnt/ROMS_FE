import { test } from 'node:test'
import assert from 'node:assert/strict'
import ExcelJS from 'exceljs'
import { readPurchaseExcel, matchPurchaseRows, getPurchaseRowIssues } from '../src/features/purchasing/utils/purchaseImport.ts'

const ingredient = (id, name, unit, isActive = true) => ({ id, name, unit, isActive, currentStock: 10 })
const catalog = [ingredient(1, 'Gạo ST25', 'kg'), ingredient(2, 'Dầu ăn', 'lít'), ingredient(3, 'Thịt cũ', 'kg', false)]
async function excel(rows) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Nhập hàng')
  sheet.addRows(rows)
  return new Uint8Array(await workbook.xlsx.writeBuffer()).buffer
}

test('reads the template, decimal comma and matches real ingredient IDs without creating ingredients', async () => {
  const parsed = await readPurchaseExcel(await excel([
    ['Tên nguyên liệu', 'Đơn vị tính', 'Số lượng nhập', 'Đơn giá (VNĐ)'],
    [' GẠO ST25 ', 'kg', '2,125', 25000.5], [], ['Dầu ăn', 'lít', 3, 0],
  ]))
  const rows = matchPurchaseRows(parsed, catalog)
  assert.deepEqual(rows.map((row) => row.ingredientId), [1, 2])
  assert.deepEqual(rows.map((row) => row.imported.rowNumber), [2, 4])
  assert.equal(rows[0].quantity, '2.125')
  rows.forEach((row) => assert.deepEqual(getPurchaseRowIssues(row, catalog), []))
})

test('unknown, inactive and wrong-unit ingredients stay visible and cannot be submitted', async () => {
  const rows = matchPurchaseRows(await readPurchaseExcel(await excel([
    ['name', 'unit', 'quantity', 'unitPrice'],
    ['Không tồn tại', 'kg', 1, 1000], ['Thịt cũ', 'kg', 1, 1000], ['Gạo ST25', 'g', 1, 1000],
  ])), catalog)
  rows.forEach((row) => {
    assert.equal(row.ingredientId, '')
    assert.ok(getPurchaseRowIssues(row, catalog).length)
    assert.ok(row.imported.name)
  })
  assert.match(rows[0].ingredientIssue, /Không tìm thấy/)
  assert.match(rows[1].ingredientIssue, /ngưng sử dụng/)
  assert.match(rows[2].ingredientIssue, /Đơn vị/)
  const corrected = { ...rows[2], ingredientId: 1, ingredientIssue: undefined }
  assert.deepEqual(getPurchaseRowIssues(corrected, catalog), [])
})

test('supports reordered columns and missing optional units; never guesses ambiguous names', async () => {
  const parsed = await readPurchaseExcel(await excel([['Đơn giá', 'Tên nguyên liệu', 'Số lượng'], [2000, 'Gạo ST25', 2]]))
  assert.equal(matchPurchaseRows(parsed, catalog)[0].ingredientId, 1)
  const row = matchPurchaseRows(parsed, [...catalog, ingredient(4, 'Gạo ST25', 'g')])[0]
  assert.equal(row.ingredientId, '')
  assert.match(row.ingredientIssue, /nhiều nguyên liệu/)
})

test('invalid numeric text/formulas remain visible as issues; manual correction clears them', async () => {
  const parsed = await readPurchaseExcel(await excel([
    ['name', 'quantity', 'unitPrice'], ['Gạo ST25', '2abc', 1000],
    ['Dầu ăn', { formula: '1+1', result: 2 }, 1000], ['Gạo ST25', 1, new Date()],
  ]))
  const rows = matchPurchaseRows(parsed, catalog)
  rows.forEach((row) => assert.ok(getPurchaseRowIssues(row, catalog).length))
  assert.match(rows[0].quantityIssue, /2abc/)
  assert.deepEqual(getPurchaseRowIssues({ ...rows[0], quantity: '2', quantityIssue: undefined }, catalog), [])
})

test('validates quantities/prices and detects an ingredient deactivated after preview', () => {
  const base = { tempId: '1', ingredientId: 1, quantity: '1', unitPrice: '0' }
  assert.deepEqual(getPurchaseRowIssues(base, catalog), [])
  for (const quantity of ['', '0', '-1', '1e3', 'NaN', '0.0001', '1000000000']) {
    assert.ok(getPurchaseRowIssues({ ...base, quantity }, catalog).length)
  }
  for (const unitPrice of ['', '-1', '1x', 'Infinity', '0.001', '10000000000']) {
    assert.ok(getPurchaseRowIssues({ ...base, unitPrice }, catalog).length)
  }
  assert.ok(getPurchaseRowIssues(base, [ingredient(1, 'Gạo ST25', 'kg', false)]).length)
})

test('rejects corrupt, empty, missing/duplicate-header and oversized files', async () => {
  await assert.rejects(readPurchaseExcel(new TextEncoder().encode('bad data').buffer), /Không đọc được/)
  await assert.rejects(readPurchaseExcel(await excel([['name', 'quantity', 'unitPrice']])), /chưa có/)
  await assert.rejects(readPurchaseExcel(await excel([['name', 'quantity']])), /Dòng đầu/)
  await assert.rejects(readPurchaseExcel(await excel([['name', 'quantity', 'unitPrice', 'Đơn giá']])), /nhiều lần/)
  await assert.rejects(readPurchaseExcel(await excel([
    ['name', 'quantity', 'unitPrice'], ...Array.from({ length: 501 }, () => ['Gạo ST25', 1, 1000]),
  ])), /500/)
})
