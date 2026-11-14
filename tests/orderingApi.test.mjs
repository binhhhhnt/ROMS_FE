import './helpers/register.mjs'
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { calls, resetHttp, reply, rejectWith } from './helpers/httpMock.mjs'
const { orderApi } = await import('../src/features/ordering/api/orderApi.ts')
beforeEach(resetHttp)

test('ordering creates an order with session and item quantities and returns server totals', async () => {
  const input = { sessionId: 9, items: [{ menuItemId: 3, quantity: 2, note: 'Ít cay' }] }
  reply({ id: 42, totalAmount: 120000 })
  const result = await orderApi.createOrder(input)
  assert.deepEqual(calls, [{ method: 'post', args: ['/api/orders', input] }])
  assert.deepEqual(result, { id: 42, totalAmount: 120000 })
})
test('ordering filters by session and status and reads an order detail', async () => {
  await orderApi.getOrders(9, 'PENDING')
  await orderApi.getOrderById(42)
  assert.equal(calls[0].args[0], '/api/orders?sessionId=9&status=PENDING')
  assert.equal(calls[1].args[0], '/api/orders/42')
})
test('ordering cancellation preserves reason and partial item quantity', async () => {
  await orderApi.cancelOrder(42, 'Khách đổi ý')
  await orderApi.cancelOrderItem(42, 8, 'Gọi nhầm', 1)
  assert.deepEqual(calls[0], { method: 'post', args: ['/api/orders/42/cancel', { reason: 'Khách đổi ý' }] })
  assert.deepEqual(calls[1].args, ['/api/orders/42/items/8/cancel', { reason: 'Gọi nhầm', quantity: 1 }])
})
test('ordering cancellation without optional data sends an empty payload', async () => {
  await orderApi.cancelOrder(42)
  await orderApi.cancelOrderItem(42, 8)
  assert.deepEqual(calls[0].args[1], {})
  assert.deepEqual(calls[1].args[1], {})
})
test('ordering completes served items and returns direct-sale goods to the session', async () => {
  const input = { items: [{ orderItemId: 8, returnQuantity: 1 }] }
  await orderApi.completeOrderItem(42, 8)
  await orderApi.getSessionDirectSaleItems(9)
  await orderApi.returnSessionDirectSaleItems(9, input)
  assert.deepEqual(calls[0], { method: 'patch', args: ['/api/orders/42/items/8/complete'] })
  assert.equal(calls[1].args[0], '/api/sessions/9/direct-sale-items')
  assert.deepEqual(calls[2].args, ['/api/sessions/9/return-items', input])
})
test('ordering propagates insufficient-stock conflict without returning a fake success', async () => {
  const error = Object.assign(new Error('Insufficient stock'), { response: { status: 409 } })
  rejectWith(error)
  await assert.rejects(orderApi.createOrder({ sessionId: 9, items: [] }), actual => actual === error)
})
