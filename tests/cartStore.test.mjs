import './helpers/register.mjs'
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
const { useCartStore } = await import('../src/features/ordering/store/cartStore.ts')
beforeEach(() => useCartStore.getState().clearCart())

test('cart adds a new dish with default quantity and calculates total', () => {
  useCartStore.getState().addItem({ menuItemId: 1, name: 'Phở', price: 65000 })
  assert.equal(useCartStore.getState().items[0].quantity, 1)
  assert.equal(useCartStore.getState().getTotalAmount(), 65000)
})
test('cart merges repeated dishes and retains an existing note when no replacement is provided', () => {
  useCartStore.getState().addItem({ menuItemId: 1, price: 65000, note: 'Ít hành' }, 2)
  useCartStore.getState().addItem({ menuItemId: 1, price: 65000 }, 3)
  assert.equal(useCartStore.getState().items.length, 1)
  assert.equal(useCartStore.getState().items[0].quantity, 5)
  assert.equal(useCartStore.getState().items[0].note, 'Ít hành')
})
test('cart lets a new note replace or clear the previous note', () => {
  useCartStore.getState().addItem({ menuItemId: 1, price: 65000, note: 'Ít hành' })
  useCartStore.getState().addItem({ menuItemId: 1, price: 65000, note: '' })
  assert.equal(useCartStore.getState().items[0].note, '')
  useCartStore.getState().updateNote(1, 'Không cay')
  assert.equal(useCartStore.getState().items[0].note, 'Không cay')
})
test('cart quantity update removes dishes at zero or negative quantity', () => {
  useCartStore.getState().addItem({ menuItemId: 1, price: 65000 }, 2)
  useCartStore.getState().addItem({ menuItemId: 2, price: 20000 })
  useCartStore.getState().updateQuantity(1, 0)
  assert.deepEqual(useCartStore.getState().items.map(i => i.menuItemId), [2])
  useCartStore.getState().updateQuantity(2, -1)
  assert.deepEqual(useCartStore.getState().items, [])
})
test('cart totals multiple dishes after quantity changes and removal', () => {
  useCartStore.getState().addItem({ menuItemId: 1, price: 65000 }, 2)
  useCartStore.getState().addItem({ menuItemId: 2, price: 20000 }, 3)
  useCartStore.getState().updateQuantity(1, 1)
  assert.equal(useCartStore.getState().getTotalAmount(), 125000)
  assert.equal(useCartStore.getState().getTotalItemCount(), 4)
  useCartStore.getState().removeItem(2)
  assert.equal(useCartStore.getState().getTotalAmount(), 65000)
})
test('cart clear resets both totals without altering a previously captured state', () => {
  useCartStore.getState().addItem({ menuItemId: 1, price: 65000 }, 2)
  const previous = useCartStore.getState().items
  useCartStore.getState().clearCart()
  assert.equal(useCartStore.getState().getTotalAmount(), 0)
  assert.equal(useCartStore.getState().getTotalItemCount(), 0)
  assert.equal(previous.length, 1)
})
