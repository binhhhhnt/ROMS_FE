import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  CheckCircle2,
  RefreshCw,
  BellRing,
  Utensils,
  Sparkles,
  ArrowRight,
  Flame,
} from 'lucide-react'

import { kitchenApi } from '@/features/kitchen/api/kitchenApi'
import { subscribeToTopic } from '@/shared/lib/stomp'
import { getApiErrorMessage } from '@/shared/lib/axios'
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
    isRefetching,
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

  // Mark item as COMPLETED (served to guest)
  const handleCompleteItem = async (orderId: number, itemId: number) => {
    try {
      await kitchenApi.updateOrderItemStatus(orderId, itemId, 'COMPLETED')
      toast.success('Đã xác nhận bưng món ra bàn thành công!')
      await refetch()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

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
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 rounded-2xl border border-border shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-status-ready/15 border border-status-ready/30 flex items-center justify-center text-status-ready font-bold shrink-0">
            <BellRing className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black text-text tracking-wide">
                Món Sẵn Sàng Phục Vụ (KDS Ready)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-status-ready text-white">
                {totalReadyCount} SUẤT CẦN BƯNG
              </span>
            </div>
            <p className="text-xs text-muted mt-1">
              Bếp đã nấu xong, nhân viên phục vụ nhận món và bưng ra bàn cho thực khách
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Live Clock */}
          <div className="bg-surface border border-border px-3.5 py-1.5 rounded-xl text-center">
            <div className="text-[10px] text-muted font-bold uppercase tracking-wider">
              Thời gian
            </div>
            <div className="text-sm font-black text-primary font-mono">
              {currentTime}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="text-xs h-10 border-border bg-card text-text hover:bg-surface"
          >
            <RefreshCw
              className={`w-4 h-4 mr-1.5 ${isRefetching ? 'animate-spin text-primary' : ''}`}
            />
            {isRefetching ? 'Đang tải...' : 'Làm mới'}
          </Button>
        </div>
      </div>

      {/* KPI Counters Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-card border border-border p-4 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs font-bold text-muted uppercase flex items-center gap-1.5">
              <Utensils className="w-4 h-4 text-muted" />
              Số bàn đang đợi món
            </div>
            <div className="text-2xl font-black text-text mt-1">
              {ordersWithReadyItems.length} bàn
            </div>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs font-bold text-status-ready uppercase flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-status-ready" />
              Tổng suất ăn đã xong
            </div>
            <div className="text-2xl font-black text-status-ready mt-1">
              {totalReadyCount} suất
            </div>
          </div>
          <span className="text-[10px] font-black text-white bg-status-ready px-2.5 py-1 rounded-full uppercase">
            Bưng ngay
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-card border border-border p-4 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs font-bold text-muted uppercase flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Phục vụ bàn
            </div>
            <div className="text-xs font-semibold text-text mt-1">
              Nhấn &ldquo;Đã bưng&rdquo; khi giao món tới bàn
            </div>
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
        <div className="bg-card border border-dashed border-border rounded-3xl p-16 text-center flex flex-col items-center justify-center my-8 shadow-xs">
          <div className="w-20 h-20 rounded-2xl bg-surface border border-border flex items-center justify-center text-status-ready mb-4 shadow-xs">
            <CheckCircle2 className="w-10 h-10 text-status-ready" />
          </div>
          <h2 className="text-xl font-bold text-text mb-2 flex items-center gap-2">
            <span>Không có món nào chờ bưng</span>
            <Sparkles className="w-5 h-5 text-amber-500" />
          </h2>
          <p className="text-xs text-muted max-w-md leading-relaxed mb-6">
            Tuyệt vời! Tất cả các món ăn bếp nấu xong đều đã được bưng phục vụ chu đáo cho thực khách tại bàn.
          </p>
          <Link to="/kitchen/cooking">
            <Button
              variant="primary"
              size="md"
              className="bg-primary hover:bg-primary-hover font-bold text-white"
            >
              <Flame className="w-4 h-4 mr-2 text-status-cooking" />
              Xem KDS Đang Chế Biến
              <ArrowRight className="w-4 h-4 ml-1.5" />
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
              onCompleteItem={handleCompleteItem}
            />
          ))}
        </div>
      )}
    </div>
  )
}
export default KitchenReadyPage
