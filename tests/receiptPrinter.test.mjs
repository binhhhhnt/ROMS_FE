import './helpers/register.mjs'
import { test, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
const { printReceiptViaBrowser } = await import('../src/features/billing/utils/receiptPrinter.ts')
let html, timers, printed, removed, previousDocument, previousTimeout
beforeEach(() => {
  html = ''; timers = []; printed = 0; removed = 0
  previousDocument = globalThis.document; previousTimeout = globalThis.setTimeout
  globalThis.setTimeout = fn => { timers.push(fn); return timers.length }
  const frame = { style: {}, contentWindow: { document: { open() {}, write(text) { html = text }, close() {} }, focus() {}, print() { printed++ } } }
  globalThis.document = { createElement: () => frame, body: { appendChild() {}, removeChild() { removed++ } } }
})
afterEach(() => { globalThis.document = previousDocument; globalThis.setTimeout = previousTimeout })
test('receipt preview includes table items and a provisional bill notice', () => {
  const input = { title: 'PHIẾU TẠM TÍNH', tableCode: 'T01', items: [{ index: 1, itemName: 'Phở', quantity: 2, unitPrice: 65000, subtotal: 130000 }], amountBeforeDiscount: 130000, totalAmount: 130000 }
  printReceiptViaBrowser(input)
  assert.match(html, /Phở/)
  assert.match(html, /T01/)
  assert.match(html, /Phiếu tạm tính dùng đối soát/)
  assert.equal(printed, 0)
})
test('receipt paid bill includes payment methods and A5 page configuration', () => {
  printReceiptViaBrowser({ title: 'HÓA ĐƠN THANH TOÁN', tableCode: 'T01', items: [], amountBeforeDiscount: 100000, totalAmount: 100000, paperSize: 'A5', payments: [{ method: 'CASH', amount: 40000 }, { method: 'BANK_TRANSFER', amount: 60000 }] })
  assert.match(html, /A5 portrait/)
  assert.match(html, /Tiền mặt/)
  assert.match(html, /Chuyển khoản/)
  assert.doesNotMatch(html, /Phiếu tạm tính dùng đối soát/)
})
test('receipt thermal paper selects K58 and cleans up its mock frame after printing', () => {
  printReceiptViaBrowser({ title: 'HÓA ĐƠN THANH TOÁN', tableCode: 'T01', items: [], amountBeforeDiscount: 0, totalAmount: 0, paperSize: 'K58' })
  assert.match(html, /58mm auto/)
  timers.shift()()
  assert.equal(printed, 1)
  timers.shift()()
  assert.equal(removed, 1)
})
