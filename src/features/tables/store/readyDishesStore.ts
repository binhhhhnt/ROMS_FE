import { create } from 'zustand'
import type { KitchenOrderResponse } from '@/features/kitchen/types/kitchen.types'

export interface ReadyDishItem {
  orderId: number
  sessionId?: number
  tableId: number
  tableCode: string
  orderItemId: number
  menuItemName: string
  quantity: number
  note?: string
  readyAt: string
}

interface ReadyDishesStore {
  readyItems: ReadyDishItem[]
  setReadyOrders: (orders: KitchenOrderResponse[]) => void
  addReadyDish: (dish: ReadyDishItem) => void
  removeReadyDish: (orderItemId: number) => void
  clearAll: () => void
}

export const useReadyDishesStore = create<ReadyDishesStore>((set) => ({
  readyItems: [],

  // Khởi tạo từ danh sách đơn bếp hiện tại
  setReadyOrders: (orders: KitchenOrderResponse[]) => {
    const items: ReadyDishItem[] = []
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.status === 'READY') {
          items.push({
            orderId: order.id,
            sessionId: order.sessionId,
            tableId: order.tableId,
            tableCode: order.tableCode,
            orderItemId: item.id,
            menuItemName: item.menuItemName,
            quantity: item.quantity,
            note: item.note ?? undefined,
            readyAt: item.createdAt, // Fallback nếu không có timestamp ready cụ thể
          })
        }
      })
    })

    // Sắp xếp món mới nhất lên đầu tiên
    items.sort(
      (a, b) =>
        new Date(b.readyAt || 0).getTime() - new Date(a.readyAt || 0).getTime()
    )

    set((state) => {
      // Giữ lại các món vừa nhận qua STOMP nếu chưa có trong response API
      const combined = [...state.readyItems]
      items.forEach((item) => {
        const index = combined.findIndex((i) => i.orderItemId === item.orderItemId)
        if (index === -1) {
          combined.push(item)
        } else {
          combined[index] = { ...item, readyAt: combined[index].readyAt || item.readyAt }
        }
      })

      // Lọc bỏ những món không còn trong API và sắp xếp lại mới nhất lên đầu
      const finalItems = combined
        .filter((c) => items.some((i) => i.orderItemId === c.orderItemId))
        .sort(
          (a, b) =>
            new Date(b.readyAt || 0).getTime() - new Date(a.readyAt || 0).getTime()
        )

      return { readyItems: finalItems }
    })
  },

  // Thêm một món vừa nấu xong từ STOMP
  addReadyDish: (dish: ReadyDishItem) => {
    set((state) => {
      // Đảm bảo có timestamp hiện tại nếu thiếu
      const validDish = {
        ...dish,
        readyAt: dish.readyAt || new Date().toISOString(),
      }

      // Xóa món cũ nếu trùng orderItemId, sau đó đưa món mới nhất lên ĐẦU danh sách
      const filtered = state.readyItems.filter(
        (i) => i.orderItemId !== validDish.orderItemId
      )

      return {
        readyItems: [validDish, ...filtered],
      }
    })
  },

  // Xóa món khi đã bưng xong (COMPLETED) hoặc bị hủy
  removeReadyDish: (orderItemId: number) => {
    set((state) => ({
      readyItems: state.readyItems.filter((i) => i.orderItemId !== orderItemId),
    }))
  },

  clearAll: () => set({ readyItems: [] }),
}))
