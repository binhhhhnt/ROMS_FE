import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { kitchenApi } from '@/features/kitchen/api/kitchenApi'
import type { OrderItemStatus } from '@/features/ordering/types/ordering.types'
import { subscribeToTopic } from '@/shared/lib/stomp'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { KitchenCookingOrderCard } from '@/features/kitchen/components/KitchenCookingOrderCard'
import { Button } from '@/shared/components/ui/button'

export function KitchenCookingPage() {
  const queryClient = useQueryClient()
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

  // Query active orders for Kitchen cooking screen
  const {
    data: orders = [],
    isLoading,
  } = useQuery({
    queryKey: ['kitchen', 'orders', 'cooking'],
    queryFn: () => kitchenApi.getKitchenOrders(),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  // Realtime STOMP Subscription
  useEffect(() => {
    const unsubKitchen = subscribeToTopic('/topic/kitchen/orders', () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen', 'orders'] })
    })

    return () => {
      unsubKitchen()
    }
  }, [queryClient])

  // Update item status handler (Strict state machine: PENDING -> COOKING -> READY)
  const handleUpdateItemStatus = async (
    orderId: number,
    itemId: number,
    targetStatus: OrderItemStatus
  ) => {
    try {
      const order = orders.find((o) => o.id === orderId)
      const currentItem = order?.items.find((i) => i.id === itemId)
      if (currentItem?.status === 'PENDING' && targetStatus !== 'COOKING') {
        toast.error('Món chưa nấu, phải bắt đầu "Nấu" trước khi ra món!')
        return
      }

      await kitchenApi.updateOrderItemStatus(orderId, itemId, targetStatus)
      toast.success(
        targetStatus === 'READY'
          ? 'Đã báo món nấu xong (READY)!'
          : 'Đã nhận món vào chế biến (COOKING)!'
      )
      await queryClient.invalidateQueries({ queryKey: ['kitchen', 'orders'] })
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  // Cook all pending items in an order
  const handleCookAll = async (orderId: number) => {
    try {
      await kitchenApi.cookAll(orderId)
      toast.success(`Đã nhận nấu tất cả món cho đơn #${orderId}!`)
      await queryClient.invalidateQueries({ queryKey: ['kitchen', 'orders'] })
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  // Ready all items in an order that are currently COOKING
  const handleReadyAll = async (orderId: number) => {
    try {
      const order = orders.find((o) => o.id === orderId)
      if (!order) return
      const cookingItems = order.items.filter((i) => i.status === 'COOKING')
      if (cookingItems.length === 0) {
        toast.error('Chưa có món nào đang nấu để ra quầy!')
        return
      }
      await kitchenApi.readyAll(orderId)
      toast.success(`Đã ra tất cả món đang nấu cho đơn #${orderId}!`)
      await queryClient.invalidateQueries({ queryKey: ['kitchen', 'orders'] })
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  // Active cooking orders: includes orders with items that are COOKING or PENDING
  const activeCookingOrders = useMemo(() => {
    return orders.filter((order) =>
      order.items.some((item) => item.status === 'COOKING' || item.status === 'PENDING')
    )
  }, [orders])

  // Calculate statistics across active orders
  const stats = useMemo(() => {
    let totalDishes = 0
    let cookingDishes = 0
    let readyDishes = 0

    orders.forEach((o) => {
      o.items.forEach((item) => {
        totalDishes += item.quantity
        if (item.status === 'COOKING' || item.status === 'PENDING') {
          cookingDishes += item.quantity
        } else if (item.status === 'READY') {
          readyDishes += item.quantity
        }
      })
    })

    return { totalDishes, cookingDishes, readyDishes }
  }, [orders])

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-5">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-card px-5 py-4 rounded-xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-text tracking-tight">
              ĐANG CHẾ BIẾN
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-primary text-white">
              {activeCookingOrders.length} ĐƠN CẦN NẤU ({stats.cookingDishes} SUẤT)
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Quản lý tiến độ nấu từng món. Khi món nấu xong, bấm &ldquo;Ra món&rdquo; để chuyển ra quầy chờ bưng
          </p>
        </div>

        {/* Live Clock */}
        <div className="bg-surface border border-border px-3.5 py-1.5 rounded-lg text-right">
          <div className="text-[10px] text-muted font-bold uppercase tracking-wider">
            Thời gian
          </div>
          <div className="text-sm font-black text-primary font-mono">
            {currentTime}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-2xl p-6 h-80 animate-pulse flex flex-col justify-between shadow-xs"
            >
              <div className="flex justify-between items-center">
                <div className="w-28 h-6 bg-surface rounded-lg" />
                <div className="w-16 h-6 bg-surface rounded-lg" />
              </div>
              <div className="space-y-3">
                <div className="w-full h-12 bg-surface rounded-xl" />
                <div className="w-full h-12 bg-surface rounded-xl" />
              </div>
              <div className="w-full h-11 bg-surface rounded-xl" />
            </div>
          ))}
        </div>
      ) : activeCookingOrders.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-16 text-center flex flex-col items-center justify-center my-8 shadow-xs">
          <h2 className="text-lg font-bold text-text mb-1">
            {orders.length > 0
              ? 'Tất cả các món đã nấu xong & chuyển ra quầy!'
              : 'Hiện không có món nào cần nấu'}
          </h2>
          <p className="text-xs text-muted max-w-md leading-relaxed mb-6">
            {orders.length > 0
              ? 'Toàn bộ món ăn của các đơn đang chế biến đã chuyển sang quầy chờ bưng. Bạn có thể sang màn hình Quầy chờ bưng món để theo dõi phục vụ.'
              : 'Bếp đã hoàn thành tất cả các món ăn hoặc chưa có đơn hàng mới được đặt từ khách.'}
          </p>
          <div className="flex gap-3">
            <Link to="/kitchen/ready">
              <Button
                variant="primary"
                size="md"
                className="bg-status-ready hover:bg-emerald-600 font-bold"
              >
                Xem Quầy Chờ Bưng Món
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeCookingOrders.map((order) => (
            <KitchenCookingOrderCard
              key={order.id}
              order={order}
              onUpdateItemStatus={handleUpdateItemStatus}
              onReadyAll={handleReadyAll}
              onCookAll={handleCookAll}
            />
          ))}
        </div>
      )}
    </div>
  )
}
export default KitchenCookingPage
