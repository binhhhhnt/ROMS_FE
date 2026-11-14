import './helpers/register.mjs'
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { calls, resetHttp, rejectWith } from './helpers/httpMock.mjs'
const { tableApi } = await import('../src/features/tables/api/tableApi.ts')
const { staffCallApi } = await import('../src/features/tables/api/staffCallApi.ts')
beforeEach(resetHttp)
test('tables retain false active filter and trim area and search', async () => {
  await tableApi.getTables({ isActive: false, area: ' VIP ', search: ' T01 ' })
  assert.deepEqual(calls[0].args[1], { params: { isActive: false, area: 'VIP', search: 'T01', page: 0, size: 50 } })
})
test('tables create update read and disable the selected table', async () => {
  const input = { tableCode: 'T01', capacity: 4 }
  await tableApi.createTable(input)
  await tableApi.updateTable(1, input)
  await tableApi.getTableById(1)
  await tableApi.updateTableStatus(1, false)
  await tableApi.getAreas()
  assert.deepEqual(calls.map(c => [c.method, c.args[0]]), [['post', '/api/tables'], ['put', '/api/tables/1'], ['get', '/api/tables/1'], ['patch', '/api/tables/1/status'], ['get', '/api/tables/areas']])
  assert.deepEqual(calls[3].args[1], { isActive: false })
})
test('table sessions open close transfer and query transfer history', async () => {
  await tableApi.openSession(1)
  await tableApi.getSessionById(9)
  await tableApi.transferTable(9, 2)
  await tableApi.getTransferHistory(9, 0, 5)
  await tableApi.closeSession(9)
  assert.deepEqual(calls.map(c => c.args[0]), ['/api/sessions/tables/1/open', '/api/sessions/9', '/api/sessions/9/transfer', '/api/sessions/9/transfers', '/api/sessions/9/close'])
  assert.deepEqual(calls[2].args[1], { toTableId: 2 })
  assert.deepEqual(calls[3].args[1], { params: { page: 0, size: 5 } })
})
test('table session list preserves table and status filters', async () => {
  await tableApi.getSessions({ tableId: 2, status: 'ACTIVE', page: 0, size: 10 })
  assert.deepEqual(calls[0].args, ['/api/sessions', { params: { tableId: 2, status: 'ACTIVE', page: 0, size: 10 } }])
})
test('staff calls acknowledge the exact request without duplicate local submissions', async () => {
  await staffCallApi.callStaff(1)
  await staffCallApi.acknowledgeCall(1, 'request-9')
  assert.deepEqual(calls[0], { method: 'post', args: ['/api/tables/1/call-staff'] })
  assert.deepEqual(calls[1].args, ['/api/tables/1/call-staff/acknowledge', null, { params: { requestId: 'request-9' } }])
})
test('table transfer propagates occupied-target conflicts', async () => {
  const error = new Error('Target table occupied')
  rejectWith(error)
  await assert.rejects(tableApi.transferTable(9, 2), actual => actual === error)
})
