import './helpers/register.mjs'
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { calls, resetHttp, reply, rejectWith } from './helpers/httpMock.mjs'
const { settingsApi } = await import('../src/features/settings/api/settingsApi.ts')
beforeEach(resetHttp)
test('settings normalize snake_case response without losing false VAT or print flags', async () => {
  reply({ menu_price_includes_vat: false, print_ready_ticket: false, restaurant_name: 'ROMS Test', bill_paper_size: 'K58' })
  const result = await settingsApi.getSettings()
  assert.equal(result.menuPriceIncludesVat, false)
  assert.equal(result.menu_price_includes_vat, false)
  assert.equal(result.printReadyTicket, false)
  assert.equal(result.restaurantName, 'ROMS Test')
  assert.equal(result.billPaperSize, 'K58')
})
test('settings prefer explicit camelCase response values and provide defaults for absent fields', async () => {
  reply({ menuPriceIncludesVat: false, menu_price_includes_vat: true, restaurantName: 'A', restaurant_name: 'B' })
  const result = await settingsApi.getSettings()
  assert.equal(result.restaurantName, 'A')
  assert.equal(result.menuPriceIncludesVat, false)
  assert.equal(result.billPaperSize, 'K80')
})
test('settings update maps editable values to request fields and keeps VAT false', async () => {
  reply({})
  const result = await settingsApi.updateSettings({ menuPriceIncludesVat: false, restaurantName: 'Tên mới', printReadyTicket: false, billPaperSize: 'A5' })
  assert.equal(calls[0].method, 'put')
  assert.equal(calls[0].args[0], '/api/settings')
  assert.equal(calls[0].args[1].menu_price_includes_vat, false)
  assert.equal(calls[0].args[1].restaurant_name, 'Tên mới')
  assert.equal(result.menuPriceIncludesVat, false)
  assert.equal(result.billPaperSize, 'A5')
})
test('settings handle missing printer list as empty and support tax category operations', async () => {
  reply(null)
  const printers = await settingsApi.getAvailablePrinters()
  await settingsApi.getTaxCategories()
  await settingsApi.getTaxCategoryById(2)
  const tax = { rate: 8 }
  await settingsApi.createTaxCategory(tax)
  assert.deepEqual(printers, [])
  assert.deepEqual(calls.map(c => c.args[0]), ['/api/settings/printers', '/api/tax-categories', '/api/tax-categories/2', '/api/tax-categories'])
  assert.deepEqual(calls[3].args[1], tax)
})
test('settings propagate unauthorized updates instead of manufacturing defaults', async () => {
  const error = new Error('Forbidden')
  rejectWith(error)
  await assert.rejects(settingsApi.updateSettings({ menuPriceIncludesVat: true }), actual => actual === error)
})
