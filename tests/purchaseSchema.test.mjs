import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createPurchaseSchema, purchaseItemSchema } from '../src/features/purchasing/schemas/purchaseSchema.ts'

test('purchase item accepts minimum quantity and zero unit price boundaries', () => {
  const input = { ingredientId: 1, quantity: 0.001, unitPrice: 0 }
  assert.deepEqual(purchaseItemSchema.parse(input), input)
})

test('purchase item rejects missing ingredient, nonpositive quantity and negative price', () => {
  const input = { ingredientId: 1, quantity: 1, unitPrice: 10000 }
  assert.equal(purchaseItemSchema.safeParse({ ...input, ingredientId: 0 }).success, false)
  assert.equal(purchaseItemSchema.safeParse({ ...input, quantity: 0 }).success, false)
  assert.equal(purchaseItemSchema.safeParse({ ...input, quantity: 0.0009 }).success, false)
  assert.equal(purchaseItemSchema.safeParse({ ...input, unitPrice: -1 }).success, false)
})

test('purchase requires a date and at least one ingredient', () => {
  assert.equal(createPurchaseSchema.safeParse({ purchaseDate: '2026-11-14', items: [] }).success, false)
  assert.equal(createPurchaseSchema.safeParse({ purchaseDate: '', items: [{ ingredientId: 1, quantity: 1, unitPrice: 0 }] }).success, false)
})

test('purchase accepts multiple ingredients and checks note length boundary', () => {
  const input = { purchaseDate: '2026-11-14', items: [{ ingredientId: 1, quantity: 2, unitPrice: 10000 }, { ingredientId: 2, quantity: 1, unitPrice: 0 }] }
  assert.equal(createPurchaseSchema.safeParse({ ...input, note: 'a'.repeat(255) }).success, true)
  assert.equal(createPurchaseSchema.safeParse({ ...input, note: 'a'.repeat(256) }).success, false)
})
