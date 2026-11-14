import './helpers/register.mjs'
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { calls, resetHttp, rejectWith } from './helpers/httpMock.mjs'
const { kitchenApi } = await import('../src/features/kitchen/api/kitchenApi.ts')
beforeEach(resetHttp)

test('kitchen reads pending queues and order details without a dangling query separator', async () => {
  await kitchenApi.getKitchenOrders()
  await kitchenApi.getKitchenOrders('PENDING')
  await kitchenApi.getKitchenOrderById(4)
  assert.deepEqual(calls.map(c => c.args[0]), ['/api/kitchen/orders', '/api/kitchen/orders?status=PENDING', '/api/kitchen/orders/4'])
})
test('kitchen accepts an order and sends bulk cooking and ready commands', async () => {
  await kitchenApi.acceptOrder(4)
  await kitchenApi.cookAll(4)
  await kitchenApi.readyAll(4)
  assert.deepEqual(calls.map(c => [c.method, c.args[0]]), [['post', '/api/kitchen/orders/4/accept'], ['post', '/api/kitchen/orders/4/cook-all'], ['post', '/api/kitchen/orders/4/ready-all']])
})
test('kitchen updates a single item status and menu availability independently', async () => {
  await kitchenApi.updateOrderItemStatus(4, 8, 'READY')
  await kitchenApi.updateMenuStatus(3, 'TEMPORARILY_UNAVAILABLE')
  assert.deepEqual(calls[0], { method: 'patch', args: ['/api/kitchen/orders/4/items/8/status', { status: 'READY' }] })
  assert.deepEqual(calls[1].args, ['/api/menu-items/3/status', { status: 'TEMPORARILY_UNAVAILABLE' }])
})
test('kitchen menu applies category and pagination and lists category options', async () => {
  await kitchenApi.getMenuItems(2, 0, 20)
  await kitchenApi.getCategories()
  assert.equal(calls[0].args[0], '/api/menu-items?categoryId=2&page=0&size=20')
  assert.equal(calls[1].args[0], '/api/categories?size=100')
})
test('kitchen preserves an invalid-transition conflict from the server', async () => {
  const error = new Error('Invalid transition')
  rejectWith(error)
  await assert.rejects(kitchenApi.updateOrderItemStatus(4, 8, 'READY'), actual => actual === error)
})
