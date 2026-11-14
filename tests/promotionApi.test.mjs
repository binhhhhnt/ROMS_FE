import './helpers/register.mjs'
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { calls, resetHttp, rejectWith } from './helpers/httpMock.mjs'
const { promotionApi } = await import('../src/features/promotions/api/promotionApi.ts')
beforeEach(resetHttp)
test('promotions search trims input and retains false active state', async () => {
  await promotionApi.getPromotions({ search: ' SALE ', isActive: false, page: 0, size: 10 })
  assert.equal(calls[0].args[0], '/api/promotions?search=SALE&isActive=false&page=0&size=10')
})
test('promotions manage valid listing creation editing toggling and deletion', async () => {
  const input = { name: 'Sale', code: 'SALE', discountType: 'PERCENT', discountValue: 10 }
  await promotionApi.getValidPromotions()
  await promotionApi.getPromotionById(3)
  await promotionApi.createPromotion(input)
  await promotionApi.updatePromotion(3, input)
  await promotionApi.toggleStatus(3)
  await promotionApi.deletePromotion(3)
  assert.deepEqual(calls.map(c => [c.method, c.args[0]]), [['get', '/api/promotions/valid'], ['get', '/api/promotions/3'], ['post', '/api/promotions'], ['put', '/api/promotions/3'], ['patch', '/api/promotions/3/toggle-status'], ['delete', '/api/promotions/3']])
  assert.deepEqual(calls[3].args[1], input)
})
test('promotions propagate duplicate-code errors', async () => {
  const error = new Error('Duplicate promotion')
  rejectWith(error)
  await assert.rejects(promotionApi.createPromotion({ code: 'SALE' }), actual => actual === error)
})
