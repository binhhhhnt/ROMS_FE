import { test } from 'node:test'
import assert from 'node:assert/strict'
import { promotionFormSchema } from '../src/features/promotions/schemas/promotionSchema.ts'

test('promotion trims name and code before submission', () => {
  const input = { name: '  Giảm giá  ', code: ' SALE_10 ', discountType: 'PERCENT', discountValue: 10, isActive: true }
  const result = promotionFormSchema.parse(input)
  assert.equal(result.name, 'Giảm giá')
  assert.equal(result.code, 'SALE_10')
})

test('promotion accepts a hundred percent boundary and rejects percentages above it', () => {
  const input = { name: 'Ưu đãi', code: 'SALE', discountType: 'PERCENT', isActive: true }
  assert.equal(promotionFormSchema.safeParse({ ...input, discountValue: 100 }).success, true)
  assert.equal(promotionFormSchema.safeParse({ ...input, discountValue: 100.01 }).success, false)
})

test('promotion fixed amount can exceed one hundred currency units', () => {
  const input = { name: 'Ưu đãi', code: 'SALE', discountType: 'FIXED_AMOUNT', discountValue: 50000, isActive: true }
  assert.equal(promotionFormSchema.safeParse(input).success, true)
})

test('promotion rejects zero or negative discount and invalid code characters', () => {
  const input = { name: 'Ưu đãi', code: 'SALE', discountType: 'PERCENT', discountValue: 10, isActive: true }
  assert.equal(promotionFormSchema.safeParse({ ...input, discountValue: 0 }).success, false)
  assert.equal(promotionFormSchema.safeParse({ ...input, discountValue: -1 }).success, false)
  assert.equal(promotionFormSchema.safeParse({ ...input, code: 'SALE 10!' }).success, false)
})

test('promotion permits unlimited use and requires positive integer limits', () => {
  const input = { name: 'Ưu đãi', code: 'SALE', discountType: 'PERCENT', discountValue: 10, isActive: true }
  assert.equal(promotionFormSchema.safeParse({ ...input, maxUses: null }).success, true)
  assert.equal(promotionFormSchema.safeParse({ ...input, maxUses: 1 }).success, true)
  for (const maxUses of [0, -1, 1.5]) assert.equal(promotionFormSchema.safeParse({ ...input, maxUses }).success, false)
})

test('promotion permits equal start and end dates but rejects reversed dates', () => {
  const input = { name: 'Ưu đãi', code: 'SALE', discountType: 'PERCENT', discountValue: 10, isActive: true, startDate: '2026-11-14' }
  assert.equal(promotionFormSchema.safeParse({ ...input, endDate: '2026-11-14' }).success, true)
  const result = promotionFormSchema.safeParse({ ...input, endDate: '2026-11-13' })
  assert.equal(result.success, false)
  assert.ok(result.error.issues.some(issue => issue.path.join('.') === 'endDate'))
})
