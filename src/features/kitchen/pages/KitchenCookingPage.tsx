import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Flame,
  RefreshCw,
  Clock,
  CheckCircle2,
  Utensils,
  ArrowRight,
  BellRing,
} from 'lucide-react'

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
    isRefetching,
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
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold shrink-0">
            <Flame className="w-6 h-6 animate-pulse text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                Đang Chế Biến (KDS Cooking)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-sky-500 text-slate-950">
                {activeCookingOrders.length} ĐƠN CẦN NẤU
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Quản lý tiến độ nấu từng món và báo sẵn sàng phục vụ ra bàn
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Live Clock */}
          <div className="bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl text-center">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Thời gian
            </div>
            <div className="text-sm font-black text-sky-400 font-mono">
              {currentTime}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="text-xs h-10 border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <RefreshCw
              className={`w-4 h-4 mr-1.5 ${isRefetching ? 'animate-spin text-sky-400' : ''}`}
            />
            {isRefetching ? 'Đang tải...' : 'Làm mới'}
          </Button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
              <Utensils className="w-4 h-4 text-slate-400" />
              Tổng suất cần nấu
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {stats.totalDishes} suất
            </div>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-amber-400 uppercase flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              Đang trên bếp
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {stats.cookingDishes} suất
            </div>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Đã xong (READY)
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {stats.readyDishes} suất
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterMode('active')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterMode === 'active'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Đang cần nấu ({activeCookingOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterMode === 'all'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Tất cả đơn ({orders.length})
          </button>
        </div>

        <Link
          to="/kitchen/ready"
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 pr-2"
        >
          <BellRing className="w-3.5 h-3.5" />
          <span>Xem khu vực Món sẵn sàng bưng ({stats.readyDishes} suất READY)</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Main Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 h-80 animate-pulse flex flex-col justify-between"
            >
              <div className="flex justify-between items-center">
                <div className="w-28 h-6 bg-slate-700 rounded-lg" />
                <div className="w-16 h-6 bg-slate-700 rounded-lg" />
              </div>
              <div className="space-y-3">
                <div className="w-full h-12 bg-slate-700 rounded-xl" />
                <div className="w-full h-12 bg-slate-700 rounded-xl" />
              </div>
              <div className="w-full h-11 bg-slate-700 rounded-xl" />
            </div>
          ))}
        </div>
      ) : displayedOrders.length === 0 ? (
        <div className="bg-slate-950 border border-dashed border-slate-800 rounded-3xl p-16 text-center flex flex-col items-center justify-center my-8">
          <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 mb-4 shadow-inner">
            <Flame className="w-10 h-10 text-slate-600" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {filterMode === 'active' && orders.length > 0
              ? 'Tất cả các món đã nấu xong (READY)!'
              : 'Hiện không có món nào đang nấu'}
          </h2>
          <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-6">
            {filterMode === 'active' && orders.length > 0
              ? 'Toàn bộ món ăn của các đơn đang chế biến đã chuyển sang trạng thái Sẵn sàng phục vụ. Bạn có thể sang màn hình Món sẵn sàng để theo dõi.'
              : 'Bếp đã hoàn thành tất cả các món ăn hoặc chưa nhận đơn mới từ Hàng đợi.'}
          </p>
          <div className="flex gap-3">
            <Link to="/kitchen/ready">
              <Button
                variant="primary"
                size="md"
                className="bg-emerald-600 hover:bg-emerald-500 font-bold"
              >
                <BellRing className="w-4 h-4 mr-2" />
                Xem Món Sẵn Sàng (READY)
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
            <Link to="/kitchen/queue">
              <Button
                variant="outline"
                size="md"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <Clock className="w-4 h-4 mr-2" />
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
