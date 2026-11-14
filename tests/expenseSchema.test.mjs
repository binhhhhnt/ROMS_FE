import { test } from 'node:test'
import assert from 'node:assert/strict'
import { expenseFormSchema, cancelExpenseSchema } from '../src/features/expenses/schemas/expenseSchema.ts'

test('expense accepts zero amount and maximum amount boundaries', () => {
  const input = { name: 'Điện nước', expenseDate: '2026-11-14', note: '' }
  assert.equal(expenseFormSchema.safeParse({ ...input, amount: 0 }).success, true)
  assert.equal(expenseFormSchema.safeParse({ ...input, amount: 999999999999.99 }).success, true)
})

test('expense rejects negative amounts and amounts above the maximum', () => {
  const input = { name: 'Điện nước', expenseDate: '2026-11-14', note: '' }
  assert.equal(expenseFormSchema.safeParse({ ...input, amount: -0.01 }).success, false)
  assert.equal(expenseFormSchema.safeParse({ ...input, amount: 1000000000000 }).success, false)
})

test('expense requires a name and expense date', () => {
  assert.equal(expenseFormSchema.safeParse({ name: '', amount: 1, expenseDate: '2026-11-14', note: '' }).success, false)
  assert.equal(expenseFormSchema.safeParse({ name: 'Điện nước', amount: 1, expenseDate: '', note: '' }).success, false)
})

test('expense cancellation requires a reason with at most 255 characters', () => {
  assert.equal(cancelExpenseSchema.safeParse({ cancelReason: 'Nhập nhầm chi phí' }).success, true)
  assert.equal(cancelExpenseSchema.safeParse({ cancelReason: 'a'.repeat(255) }).success, true)
  assert.equal(cancelExpenseSchema.safeParse({ cancelReason: '' }).success, false)
  assert.equal(cancelExpenseSchema.safeParse({ cancelReason: 'a'.repeat(256) }).success, false)
})
