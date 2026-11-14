import './helpers/register.mjs'
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { calls, resetHttp, reply, replyRaw, rejectWith } from './helpers/httpMock.mjs'
const { reportApi } = await import('../src/features/reports/api/reportApi.ts')
beforeEach(resetHttp)
test('reports query daily trends and overview using the same selected range', async () => {
  reply([{ date: '2026-11-14', netProfit: -1000 }])
  const rows = await reportApi.getDailyTrends('2026-11-01', '2026-11-14')
  await reportApi.getOverview('2026-11-01', '2026-11-14')
  assert.equal(rows[0].netProfit, -1000)
  assert.equal(calls[0].args[0], '/api/dashboard/trends?startDate=2026-11-01&endDate=2026-11-14')
  assert.equal(calls[1].args[0], '/api/dashboard/overview?startDate=2026-11-01&endDate=2026-11-14')
})
test('reports request twenty top-selling dishes by default and allow a custom limit', async () => {
  await reportApi.getBestSellingDishes()
  await reportApi.getBestSellingDishes(undefined, '2026-11-14', 3)
  assert.deepEqual(calls.map(c => c.args[0]), ['/api/dashboard/best-selling?limit=20', '/api/dashboard/best-selling?endDate=2026-11-14&limit=3'])
})
test('reports export CSV bytes with blob response type', async () => {
  const blob = new Blob(['report'], { type: 'text/csv' })
  replyRaw(blob)
  const result = await reportApi.exportReportCsv()
  assert.equal(result, blob)
  assert.deepEqual(calls[0].args, ['/api/dashboard/export', { responseType: 'blob' }])
})
test('reports export failure is propagated without downloading a fake report', async () => {
  const error = new Error('Export unavailable')
  rejectWith(error)
  await assert.rejects(reportApi.exportReportCsv(), actual => actual === error)
})
