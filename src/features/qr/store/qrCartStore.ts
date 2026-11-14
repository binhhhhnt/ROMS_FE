import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MenuItemReadResponse } from '@/features/menu/types/menu.types'
import type { QrCartItem } from '../types/qr.types'

interface QrCartState {
  qrToken: string | null
  sessionId: number | null
  items: QrCartItem[]
  syncSession: (qrToken: string, sessionId: number) => void
  addItem: (menuItem: MenuItemReadResponse, quantity?: number, note?: string) => void
  updateQuantity: (menuItemId: number, note: string | undefined, quantity: number) => void
  removeItem: (menuItemId: number, note?: string) => void
  clearCart: () => void
}

const sameLine = (item: QrCartItem, menuItemId: number, note?: string) =>
  item.menuItem.id === menuItemId && (item.note || '') === (note || '')

export const useQrCartStore = create<QrCartState>()(
  persist(
    (set) => ({
      qrToken: null,
      sessionId: null,
      items: [],

      syncSession: (qrToken, sessionId) =>
        set((state) => {
          if (state.qrToken === qrToken && state.sessionId === sessionId) {
            return state
          }
          return { qrToken, sessionId, items: [] }
        }),

      addItem: (menuItem, quantity = 1, note) =>
        set((state) => {
          const cleanNote = note?.trim() || undefined
          const existingIndex = state.items.findIndex((i) =>
            sameLine(i, menuItem.id, cleanNote)
          )
          if (existingIndex > -1) {
            const next = [...state.items]
            next[existingIndex] = {
              ...next[existingIndex],
              menuItem,
              quantity: next[existingIndex].quantity + quantity,
            }
            return { items: next }
          }
          return {
            items: [...state.items, { menuItem, quantity, note: cleanNote }],
          }
        }),

      updateQuantity: (menuItemId, note, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((i) => !sameLine(i, menuItemId, note)),
            }
          }
          return {
            items: state.items.map((i) =>
              sameLine(i, menuItemId, note) ? { ...i, quantity } : i
            ),
          }
        }),

      removeItem: (menuItemId, note) =>
        set((state) => ({
          items: state.items.filter((i) => !sameLine(i, menuItemId, note)),
        })),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'roms-qr-cart',
    }
  )
)
