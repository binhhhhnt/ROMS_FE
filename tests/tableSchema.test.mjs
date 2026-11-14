import { test } from 'node:test'
import assert from 'node:assert/strict'
import { tableSchema } from '../src/features/tables/schemas/tableSchema.ts'

test('table accepts an alphanumeric code with hyphen and underscore', () => {
  const input = { tableCode: 'VIP_01-A', capacity: 4, area: 'Tầng 1' }
  assert.deepEqual(tableSchema.parse(input), input)
})

test('table accepts capacity boundaries of one and fifty seats', () => {
  assert.equal(tableSchema.safeParse({ tableCode: 'T01', capacity: 1 }).success, true)
  assert.equal(tableSchema.safeParse({ tableCode: 'T01', capacity: 50 }).success, true)
})

test('table rejects zero, negative, excessive and nonnumeric capacity', () => {
  for (const capacity of [0, -1, 51, '4', NaN]) {
    assert.equal(tableSchema.safeParse({ tableCode: 'T01', capacity }).success, false)
  }
})

test('table rejects empty codes and codes containing spaces or punctuation', () => {
  for (const tableCode of ['', 'T 01', 'T@01']) {
    assert.equal(tableSchema.safeParse({ tableCode, capacity: 4 }).success, false)
  }
})

test('table enforces code and area length boundaries', () => {
  assert.equal(tableSchema.safeParse({ tableCode: 'A'.repeat(20), capacity: 4, area: 'a'.repeat(50) }).success, true)
  assert.equal(tableSchema.safeParse({ tableCode: 'A'.repeat(21), capacity: 4 }).success, false)
  assert.equal(tableSchema.safeParse({ tableCode: 'T01', capacity: 4, area: 'a'.repeat(51) }).success, false)
})

test('table permits omitted or empty area', () => {
  assert.equal(tableSchema.safeParse({ tableCode: 'T01', capacity: 4 }).success, true)
  assert.equal(tableSchema.safeParse({ tableCode: 'T01', capacity: 4, area: '' }).success, true)
})
