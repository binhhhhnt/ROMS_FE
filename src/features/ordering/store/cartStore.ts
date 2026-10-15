import { create } from 'zustand'
import type { CartItem } from '@/features/ordering/types/ordering.types'

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  updateQuantity: (menuItemId: number, quantity: number) => void
  updateNote: (menuItemId: number, note: string) => void
  removeItem: (menuItemId: number) => void
  clearCart: () => void
  getTotalAmount: () => number
  getTotalItemCount: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (item, quantity = 1) => {
    set((state) => {
      const existingIndex = state.items.findIndex(
        (i) => i.menuItemId === item.menuItemId
      )

      if (existingIndex > -1) {
        const newItems = [...state.items]
        const existing = newItems[existingIndex]
        newItems[existingIndex] = {
          ...existing,
          quantity: existing.quantity + quantity,
          note: item.note !== undefined ? item.note : existing.note,
        }
        return { items: newItems }
      }

      return {
        items: [...state.items, { ...item, quantity }],
      }
    })
  },

  updateQuantity: (menuItemId, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        return {
          items: state.items.filter((i) => i.menuItemId !== menuItemId),
        }
      }

      return {
        items: state.items.map((item) =>
          item.menuItemId === menuItemId ? { ...item, quantity } : item
        ),
      }
    })
  },

  updateNote: (menuItemId, note) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.menuItemId === menuItemId ? { ...item, note } : item
      ),
    }))
  },

  removeItem: (menuItemId) => {
    set((state) => ({
      items: state.items.filter((i) => i.menuItemId !== menuItemId),
    }))
  },

  clearCart: () => {
    set({ items: [] })
  },

  getTotalAmount: () => {
    return get().items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
  },

  getTotalItemCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0)
  },
}))

if (import.meta.env.DEV) {
  // @ts-expect-error dev helper
  window.__cartStore = useCartStore
}
