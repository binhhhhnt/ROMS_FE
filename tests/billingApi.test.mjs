import './helpers/register.mjs'
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { calls, resetHttp, reply, rejectWith } from './helpers/httpMock.mjs'
const { billApi } = await import('../src/features/billing/api/billApi.ts')
beforeEach(resetHttp)

test('billing retrieves server preview and both bill lookup variants', async () => {
  reply({ totalAmount: 110000, taxAmount: 10000 })
  const preview = await billApi.getBillPreview(9)
  await billApi.getBillById(42)
  await billApi.getBillBySessionId(9)
  assert.equal(preview.totalAmount, 110000)
  assert.deepEqual(calls.map(c => c.args[0]), ['/api/bills/sessions/9/preview', '/api/bills/42', '/api/bills/sessions/9'])
})
test('billing checkout preserves promotion and split-payment amounts', async () => {
  const payload = { promotionCode: 'SALE10', payments: [{ paymentMethod: 'CASH', amount: 50000 }, { paymentMethod: 'BANK_TRANSFER', amount: 60000 }] }
  await billApi.checkoutBill(9, payload)
  assert.deepEqual(calls, [{ method: 'post', args: ['/api/bills/sessions/9/checkout', payload] }])
})
test('billing history trims search and preserves zero-based pagination', async () => {
  await billApi.getBills(0, 10, '  HD001  ')
  assert.deepEqual(calls[0].args, ['/api/bills', { params: { page: 0, size: 10, search: 'HD001' } }])
})
test('billing print requests target the bill and session endpoints without printing locally', async () => {
  await billApi.printBill(42)
  await billApi.printProforma(9)
  assert.deepEqual(calls.map(c => c.args[0]), ['/api/bills/42/print', '/api/bills/sessions/9/print-proforma'])
})
test('billing duplicate checkout conflict is propagated to the caller', async () => {
  const error = Object.assign(new Error('Already paid'), { response: { status: 409 } })
  rejectWith(error)
  await assert.rejects(billApi.checkoutBill(9, { payments: [] }), actual => actual === error)
})
