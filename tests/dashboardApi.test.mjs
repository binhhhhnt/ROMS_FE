import './helpers/register.mjs'
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { calls, resetHttp, reply, replyRaw, rejectWith } from './helpers/httpMock.mjs'
const { dashboardApi } = await import('../src/features/dashboard/api/dashboardApi.ts')
beforeEach(resetHttp)
test('dashboard overview applies the selected date range and unwraps totals', async () => {
  reply({ revenue: 1000000, expenses: 300000 })
  const result = await dashboardApi.getOverview('2026-11-01', '2026-11-14')
  assert.equal(calls[0].args[0], '/api/dashboard/overview?startDate=2026-11-01&endDate=2026-11-14')
  assert.equal(result.revenue, 1000000)
})
test('dashboard default top-selling limit is five and trends support no filter', async () => {
  await dashboardApi.getBestSellingDishes()
  await dashboardApi.getDailyTrends()
  assert.deepEqual(calls.map(c => c.args[0]), ['/api/dashboard/best-selling?limit=5', '/api/dashboard/trends'])
})
test('dashboard CSV export returns a raw blob rather than the JSON envelope', async () => {
  const blob = new Blob(['Ngày,Doanh thu\n2026-11-14,1000'], { type: 'text/csv' })
  replyRaw(blob)
  const result = await dashboardApi.exportDailyReport('2026-11-14')
  assert.equal(result, blob)
  assert.deepEqual(calls[0].args, ['/api/dashboard/export?startDate=2026-11-14', { responseType: 'blob' }])
})
test('dashboard propagates permission errors without producing empty successful totals', async () => {
  const error = new Error('Forbidden')
  rejectWith(error)
  await assert.rejects(dashboardApi.getOverview(), actual => actual === error)
})
