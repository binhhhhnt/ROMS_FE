import { test } from 'node:test'
import assert from 'node:assert/strict'
import ExcelJS from 'exceljs'
import {
  readIngredientExcel, validateImportRow, toIngredientRequest,
} from '../src/features/inventory/utils/ingredientImport.ts'

async function excel(rows) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Nguyên liệu')
  rows.forEach((row) => sheet.addRow(row))
  const buffer = await workbook.xlsx.writeBuffer()
  return new Uint8Array(buffer).buffer
}

test('reads Vietnamese headers, trims values, preserves Excel row numbers and skips empty rows', async () => {
  const rows = await readIngredientExcel(await excel([
    ['Tên nguyên liệu', 'Đơn vị tính', 'Mức tồn tối thiểu'],
    [' Gạo ', ' kg ', 5.125], [], ['Dầu ăn', 'lít'],
  ]))
  assert.deepEqual(rows.map(toIngredientRequest), [
    { name: 'Gạo', unit: 'kg', minimumStock: 5.125 },
    { name: 'Dầu ăn', unit: 'lít', minimumStock: null },
  ])
  assert.deepEqual(rows.map((row) => row.rowNumber), [2, 4])
  assert.equal(validateImportRow(rows[0], rows).length, 0)
})

test('accepts reordered headers and optional minimum-stock column', async () => {
  const rows = await readIngredientExcel(await excel([['unit', 'name'], ['kg', 'Gạo']]))
  assert.deepEqual(toIngredientRequest(rows[0]), { name: 'Gạo', unit: 'kg', minimumStock: null })
})

test('duplicates are case-insensitive and deselecting one resolves the conflict', async () => {
  const rows = await readIngredientExcel(await excel([
    ['Tên nguyên liệu', 'Đơn vị tính'], ['Gạo', 'kg'], ['gẠO', 'g'],
  ]))
  assert.match(validateImportRow(rows[0], rows).join(' '), /Trùng tên/)
  assert.equal(validateImportRow(rows[0], [rows[0]]).length, 0)
})

test('missing cells and invalid numeric ranges are visible before confirmation', async () => {
  const rows = await readIngredientExcel(await excel([
    ['name', 'unit', 'minimumStock'], ['', 'kg', 0], ['Gạo', '', -1],
    ['Dầu ăn', 'lít', '1,125'], ['Muối', 'kg', 'Infinity'],
    ['Đường', 'kg', '0.0001'], ['Bột', 'kg', 1000000000],
  ]))
  for (const index of [0, 1, 3, 4, 5]) assert.ok(validateImportRow(rows[index], rows).length)
  assert.equal(validateImportRow(rows[2], rows).length, 0)
  assert.equal(toIngredientRequest(rows[2]).minimumStock, 1.125)
})

test('rejects formula and date cells rather than importing cached or misleading values', async () => {
  const rows = await readIngredientExcel(await excel([
    ['name', 'unit', 'minimumStock'],
    ['Gạo', 'kg', { formula: '1+1', result: 2 }],
    ['Đường', 'kg', new Date('2026-11-04')],
  ]))
  rows.forEach((row) => assert.ok(validateImportRow(row, rows).length))
})

test('rejects missing/duplicate headers, empty data and corrupted workbooks', async () => {
  await assert.rejects(readIngredientExcel(await excel([['Sai cột'], ['Gạo']])), /Dòng đầu/)
  await assert.rejects(readIngredientExcel(await excel([['name', 'name', 'unit']])), /nhiều lần/)
  await assert.rejects(readIngredientExcel(await excel([['name', 'unit']])), /chưa có dữ liệu/)
  await assert.rejects(readIngredientExcel(new TextEncoder().encode('not an Excel file').buffer))
})

test('accepts 500 rows and rejects larger files', async () => {
  const rows = [['name', 'unit'], ...Array.from({ length: 500 }, (_, index) => [`Nguyên liệu ${index}`, 'kg'])]
  assert.equal((await readIngredientExcel(await excel(rows))).length, 500)
  rows.push(['Dòng 501', 'kg'])
  await assert.rejects(readIngredientExcel(await excel(rows)), /500 dòng/)
})
