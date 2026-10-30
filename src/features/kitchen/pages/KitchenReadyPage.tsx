import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { kitchenApi } from '@/features/kitchen/api/kitchenApi'
import { subscribeToTopic } from '@/shared/lib/stomp'
import { KitchenReadyTableCard } from '@/features/kitchen/components/KitchenReadyTableCard'
import { Button } from '@/shared/components/ui/button'

export function KitchenReadyPage() {
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
    queryKey: ['kitchen', 'orders', 'ready'],
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

  // Extract orders that have READY items
  const ordersWithReadyItems = useMemo(() => {
    return allOrders
      .map((order) => {
        const readyItems = order.items.filter((item) => item.status === 'READY')
        return {
          order,
          readyItems,
        }
      })
      .filter(({ readyItems }) => readyItems.length > 0)
  }, [allOrders])

  // Total ready items count across all tables
  const totalReadyCount = useMemo(() => {
    return ordersWithReadyItems.reduce(
      (sum, { readyItems }) =>
        sum + readyItems.reduce((iSum, i) => iSum + i.quantity, 0),
      0
    )
  }, [ordersWithReadyItems])

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-5">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-card px-5 py-4 rounded-xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-text tracking-tight">
              QUẦY CHỜ BƯNG MÓN
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-status-ready text-white">
              {totalReadyCount} SUẤT CẦN BƯNG ({ordersWithReadyItems.length} BÀN)
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Món đã nấu xong, đang đặt ở quầy chờ nhân viên phục vụ bưng ra bàn cho thực khách
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
              className="bg-card border border-border rounded-2xl p-6 h-72 animate-pulse flex flex-col justify-between shadow-xs"
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
      ) : ordersWithReadyItems.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-16 text-center flex flex-col items-center justify-center my-8 shadow-xs">
          <h2 className="text-lg font-bold text-text mb-1">
            Không có món nào đang chờ bưng
          </h2>
          <p className="text-xs text-muted max-w-md leading-relaxed mb-6">
            Tất cả các món ăn bếp nấu xong đều đã được bưng phục vụ tới bàn cho thực khách.
          </p>
          <Link to="/kitchen/cooking">
            <Button
              variant="primary"
              size="md"
              className="bg-primary hover:bg-primary-hover font-bold text-white"
            >
              Xem KDS Đang Chế Biến
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ordersWithReadyItems.map(({ order, readyItems }) => (
            <KitchenReadyTableCard
              key={order.id}
              order={order}
              readyItems={readyItems}
            />
          ))}
        </div>
      )}
    </div>
  )
}
export default KitchenReadyPage
