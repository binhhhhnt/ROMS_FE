import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { kitchenApi } from '@/features/kitchen/api/kitchenApi'
import type { OrderItemStatus } from '@/features/ordering/types/ordering.types'
import { subscribeToTopic } from '@/shared/lib/stomp'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { KitchenCookingOrderCard } from '@/features/kitchen/components/KitchenCookingOrderCard'
import { Button } from '@/shared/components/ui/button'

export function KitchenCookingPage() {
  const [currentTime, setCurrentTime] = useState<string>(
    new Date().toLocaleTimeString('vi-VN')
  )
  const [filterMode, setFilterMode] = useState<'active' | 'all'>('active')

  // Real-time ticking clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('vi-VN'))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Query COOKING orders for Kitchen
  const {
    data: orders = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['kitchen', 'orders', 'cooking'],
    queryFn: () => kitchenApi.getKitchenOrders('COOKING'),
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

  // Update item status handler
  const handleUpdateItemStatus = async (
    orderId: number,
    itemId: number,
    targetStatus: OrderItemStatus
  ) => {
    try {
      await kitchenApi.updateOrderItemStatus(orderId, itemId, targetStatus)
      toast.success(
        targetStatus === 'READY'
          ? 'Đã báo món nấu xong (READY)!'
          : 'Đã cập nhật trạng thái món!'
      )
      await refetch()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  // Active cooking orders: at least 1 item is still COOKING or PENDING
  const activeCookingOrders = useMemo(() => {
    return orders.filter((order) =>
      order.items.some(
        (item) => item.status === 'COOKING' || item.status === 'PENDING'
      )
    )
  }, [orders])

  const displayedOrders = filterMode === 'active' ? activeCookingOrders : orders

  // Calculate statistics across active cooking orders
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
            Quản lý tiến độ nấu từng món. Khi món nấu xong, bấm &ldquo;Xong món&rdquo; để chuyển ra quầy chờ bưng
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

      {/* Filter Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface/60 px-3 py-2 rounded-xl border border-border">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterMode('active')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterMode === 'active'
                ? 'bg-primary text-white shadow-xs'
                : 'text-muted hover:text-text hover:bg-surface'
            }`}
          >
            Đang cần nấu ({activeCookingOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterMode === 'all'
                ? 'bg-primary text-white shadow-xs'
                : 'text-muted hover:text-text hover:bg-surface'
            }`}
          >
            Tất cả đơn ({orders.length})
          </button>
        </div>

        <Link
          to="/kitchen/ready"
          className="text-xs font-semibold text-status-ready hover:underline pr-2"
        >
          <span>Xem Quầy chờ bưng món ({stats.readyDishes} suất đã ra quầy)</span>
        </Link>
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
      ) : displayedOrders.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-16 text-center flex flex-col items-center justify-center my-8 shadow-xs">
          <h2 className="text-lg font-bold text-text mb-1">
            {filterMode === 'active' && orders.length > 0
              ? 'Tất cả các món đã nấu xong & chuyển ra quầy!'
              : 'Hiện không có món nào đang nấu'}
          </h2>
          <p className="text-xs text-muted max-w-md leading-relaxed mb-6">
            {filterMode === 'active' && orders.length > 0
              ? 'Toàn bộ món ăn của các đơn đang chế biến đã chuyển sang quầy chờ bưng. Bạn có thể sang màn hình Quầy chờ bưng món để theo dõi phục vụ.'
              : 'Bếp đã hoàn thành tất cả các món ăn hoặc chưa nhận đơn mới từ Hàng đợi.'}
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
            <Link to="/kitchen/queue">
              <Button
                variant="outline"
                size="md"
                className="border-border text-text hover:bg-surface font-semibold"
              >
                Hàng đợi KDS
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedOrders.map((order) => (
            <KitchenCookingOrderCard
              key={order.id}
              order={order}
              onUpdateItemStatus={handleUpdateItemStatus}
            />
          ))}
        </div>
      )}
    </div>
  )
}
export default KitchenCookingPage
