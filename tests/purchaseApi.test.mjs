import './helpers/register.mjs'
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { calls, resetHttp, rejectWith } from './helpers/httpMock.mjs'
const { purchaseApi } = await import('../src/features/purchasing/api/purchaseApi.ts')
beforeEach(resetHttp)
test('purchases retain selected date range and page zero', async () => {
  await purchaseApi.getPurchases({ fromDate: '2026-11-01', toDate: '2026-11-14', page: 0, size: 10 })
  assert.equal(calls[0].args[0], '/api/purchases?fromDate=2026-11-01&toDate=2026-11-14&page=0&size=10')
})
test('purchases create detail and correction preserve ingredient quantity and price', async () => {
  const input = { purchaseDate: '2026-11-14', items: [{ ingredientId: 7, quantity: 2, unitPrice: 20000 }] }
  await purchaseApi.createPurchase(input)
  await purchaseApi.getPurchaseById(5)
  await purchaseApi.correctPurchaseItem(5, 8, { quantity: 3, unitPrice: 21000 })
  assert.deepEqual(calls[0], { method: 'post', args: ['/api/purchases', input] })
  assert.equal(calls[1].args[0], '/api/purchases/5')
  assert.deepEqual(calls[2], { method: 'patch', args: ['/api/purchases/5/items/8', { quantity: 3, unitPrice: 21000 }] })
})
test('purchases propagate stock correction conflicts without retrying automatically', async () => {
  const error = new Error('Correction conflict')
  rejectWith(error)
  await assert.rejects(purchaseApi.correctPurchaseItem(5, 8, { quantity: 1 }), actual => actual === error)
  assert.equal(calls.length, 1)
})
