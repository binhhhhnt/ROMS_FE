import './helpers/register.mjs'
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
const { useStaffCallStore } = await import('../src/features/tables/store/staffCallStore.ts')
const { useReadyDishesStore } = await import('../src/features/tables/store/readyDishesStore.ts')
beforeEach(() => { useStaffCallStore.getState().clearAll(); useReadyDishesStore.getState().clearAll() })
test('staff call state deduplicates redelivered STOMP request IDs and keeps newest first', () => {
  const call = { requestId: 'one', tableId: 1, tableCode: 'T01', requestedAt: '2026-11-14T10:00:00Z' }
  useStaffCallStore.getState().addCall(call)
  useStaffCallStore.getState().addCall(call)
  useStaffCallStore.getState().addCall({ ...call, requestId: 'two' })
  assert.deepEqual(useStaffCallStore.getState().pendingCalls.map(c => c.requestId), ['two', 'one'])
})
test('staff call acknowledgement removes only the selected request', () => {
  useStaffCallStore.getState().addCall({ requestId: 'one', tableId: 1 })
  useStaffCallStore.getState().addCall({ requestId: 'two', tableId: 2 })
  useStaffCallStore.getState().removeCall('one')
  assert.deepEqual(useStaffCallStore.getState().pendingCalls.map(c => c.requestId), ['two'])
})
test('ready dishes replace duplicate items and keep their latest quantity', () => {
  useReadyDishesStore.getState().addReadyDish({ orderItemId: 7, quantity: 1, readyAt: '2026-11-14T10:00:00Z' })
  useReadyDishesStore.getState().addReadyDish({ orderItemId: 7, quantity: 2, readyAt: '2026-11-14T10:01:00Z' })
  assert.equal(useReadyDishesStore.getState().readyItems.length, 1)
  assert.equal(useReadyDishesStore.getState().readyItems[0].quantity, 2)
})
test('ready dishes initialize only READY items and sort newest first', () => {
  useReadyDishesStore.getState().setReadyOrders([{ id: 1, tableId: 1, tableCode: 'T01', items: [
    { id: 7, status: 'READY', quantity: 1, createdAt: '2026-11-14T10:00:00Z' },
    { id: 8, status: 'COOKING', quantity: 1, createdAt: '2026-11-14T10:02:00Z' },
    { id: 9, status: 'READY', quantity: 2, createdAt: '2026-11-14T10:01:00Z' },
  ] }])
  assert.deepEqual(useReadyDishesStore.getState().readyItems.map(i => i.orderItemId), [9, 7])
})
test('ready dishes preserve STOMP timestamp during API refresh and remove served items', () => {
  useReadyDishesStore.getState().addReadyDish({ orderItemId: 7, readyAt: '2026-11-14T11:00:00Z' })
  useReadyDishesStore.getState().setReadyOrders([{ id: 1, tableId: 1, tableCode: 'T01', items: [{ id: 7, status: 'READY', quantity: 1, createdAt: '2026-11-14T10:00:00Z' }] }])
  assert.equal(useReadyDishesStore.getState().readyItems[0].readyAt, '2026-11-14T11:00:00Z')
  useReadyDishesStore.getState().removeReadyDish(7)
  assert.deepEqual(useReadyDishesStore.getState().readyItems, [])
})
