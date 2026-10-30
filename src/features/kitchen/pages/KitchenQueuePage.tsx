import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { kitchenApi } from '@/features/kitchen/api/kitchenApi'
import type { OrderItemResponse } from '@/features/ordering/types/ordering.types'
import { subscribeToTopic } from '@/shared/lib/stomp'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { KitchenQueueOrderCard } from '@/features/kitchen/components/KitchenQueueOrderCard'

export function KitchenQueuePage() {
  const [currentTime, setCurrentTime] = useState<string>(
    new Date().toLocaleTimeString('vi-VN')
  )

  // Real-time ticking clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('vi-VN'))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Query all active kitchen orders
  const {
    data: allOrders = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['kitchen', 'orders', 'queue'],
    queryFn: () => kitchenApi.getKitchenOrders(),
  })

  // Realtime STOMP Subscription
  useEffect(() => {
    const unsubKitchen = subscribeToTopic('/topic/kitchen/orders', () => {
      refetch()
    })

    return () => {
      unsubKitchen()
    }
  }, [refetch])

  // Filter orders that have pending dishes waiting to be cooked
  const queueOrders = useMemo(() => {
    return allOrders
      .map((order) => {
        const pendingItems = order.items.filter((i) => i.status === 'PENDING')
        return {
          order,
          pendingItems,
        }
      })
      .filter(({ pendingItems }) => pendingItems.length > 0)
  }, [allOrders])

  // Total pending dishes count across all tables
  const totalPendingDishes = useMemo(() => {
    return queueOrders.reduce(
      (sum, { pendingItems }) =>
        sum + pendingItems.reduce((iSum, i) => iSum + i.quantity, 0),
      0
    )
  }, [queueOrders])

  // Accept a single item into cooking
  const handleAcceptItem = async (orderId: number, itemId: number) => {
    try {
      await kitchenApi.updateOrderItemStatus(orderId, itemId, 'COOKING')
      toast.success('Đã nhận món vào chế biến!')
      await refetch()
    } catch (err) {
      const msg = getApiErrorMessage(err)
      toast.error(msg)
    }
  }

  // Accept all pending items for an order into cooking
  const handleAcceptAllOrderItems = async (
    orderId: number,
    items: OrderItemResponse[]
  ) => {
    try {
      for (const item of items) {
        await kitchenApi.updateOrderItemStatus(orderId, item.id, 'COOKING')
      }
      toast.success(`Đã nhận toàn bộ ${items.length} món vào chế biến!`)
      await refetch()
    } catch (err) {
      const msg = getApiErrorMessage(err)
      toast.error(msg)
    }
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* KDS Queue Top Header */}
      <div className="flex items-center justify-between bg-card px-5 py-4 rounded-xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-text tracking-tight">
              HÀNG ĐỢI CHẾ BIẾN
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-status-pending text-white">
              {queueOrders.length} ĐƠN ({totalPendingDishes} SUẤT CHỜ NẤU)
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Quản lý các món ăn đang chờ tiếp nhận vào nấu theo từng đơn gọi món
          </p>
        </div>

        {/* Live Clock Display */}
        <div className="bg-surface border border-border px-3.5 py-1.5 rounded-lg text-right">
          <div className="text-[10px] text-muted font-bold uppercase tracking-wider">
            Thời gian
          </div>
          <div className="text-sm font-black text-primary font-mono">
            {currentTime}
          </div>
        </div>
      </div>

      {/* Main Queue Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-2xl p-6 h-72 animate-pulse flex flex-col justify-between shadow-xs"
            >
              <div className="flex justify-between items-center">
                <div className="w-28 h-6 bg-surface rounded-lg" />
                <div className="w-16 h-6 bg-surface rounded-lg" />
              </div>
              <div className="space-y-3">
                <div className="w-full h-5 bg-surface rounded" />
                <div className="w-3/4 h-5 bg-surface rounded" />
              </div>
              <div className="w-full h-11 bg-surface rounded-xl" />
            </div>
          ))}
        </div>
      ) : queueOrders.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-16 text-center flex flex-col items-center justify-center my-8 shadow-xs">
          <h2 className="text-lg font-bold text-text mb-1">
            Hàng đợi hiện đang trống
          </h2>
          <p className="text-xs text-muted max-w-md leading-relaxed">
            Hiện không có món ăn nào đang chờ tiếp nhận. Khi thực khách gửi order từ tablet, món mới sẽ lập tức xuất hiện tại đây.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {queueOrders.map(({ order, pendingItems }) => (
            <KitchenQueueOrderCard
              key={order.id}
              order={order}
              pendingItems={pendingItems}
              onAcceptItem={handleAcceptItem}
              onAcceptAll={handleAcceptAllOrderItems}
            />
          ))}
        </div>
      )}
    </div>
  )
}
export default KitchenQueuePage
