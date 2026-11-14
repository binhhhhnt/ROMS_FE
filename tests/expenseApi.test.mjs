import './helpers/register.mjs'
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { calls, resetHttp, rejectWith } from './helpers/httpMock.mjs'
const { expenseApi } = await import('../src/features/expenses/api/expenseApi.ts')
beforeEach(resetHttp)
test('expenses omit ALL status but retain date range and page zero', async () => {
  await expenseApi.getExpenses({ startDate: '2026-11-01', endDate: '2026-11-14', status: 'ALL', page: 0, size: 10 })
  assert.equal(calls[0].args[0], '/api/expenses?startDate=2026-11-01&endDate=2026-11-14&page=0&size=10')
})
test('expenses create read correct and cancel with the requested reason', async () => {
  const input = { name: 'Điện', amount: 100000, expenseDate: '2026-11-14' }
  await expenseApi.createExpense(input)
  await expenseApi.getExpenseById(4)
  await expenseApi.updateExpense(4, input)
  await expenseApi.cancelExpense(4, { cancelReason: 'Nhập nhầm' })
  assert.deepEqual(calls.map(c => [c.method, c.args[0]]), [['post', '/api/expenses'], ['get', '/api/expenses/4'], ['put', '/api/expenses/4'], ['post', '/api/expenses/4/cancel']])
  assert.deepEqual(calls[3].args[1], { cancelReason: 'Nhập nhầm' })
})
test('expenses propagate cancellation conflicts', async () => {
  const error = new Error('Already cancelled')
  rejectWith(error)
  await assert.rejects(expenseApi.cancelExpense(4, { cancelReason: 'Nhầm' }), actual => actual === error)
})
