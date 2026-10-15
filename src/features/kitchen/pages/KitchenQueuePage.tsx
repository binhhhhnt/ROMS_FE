import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Clock, ChefHat, RefreshCw, Sparkles } from 'lucide-react'

import { kitchenApi } from '@/features/kitchen/api/kitchenApi'
import { subscribeToTopic } from '@/shared/lib/stomp'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { KitchenQueueOrderCard } from '@/features/kitchen/components/KitchenQueueOrderCard'
import { Button } from '@/shared/components/ui/button'

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

  // Query PENDING orders for Kitchen Queue
  const {
    data: orders = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['kitchen', 'orders', 'queue'],
    queryFn: () => kitchenApi.getKitchenOrders('PENDING'),
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

  // Accept Order Handler
  const handleAcceptOrder = async (orderId: number) => {
    try {
      await kitchenApi.acceptOrder(orderId)
      toast.success(`Đã nhận đơn #${orderId} vào chế biến thành công!`)
      await refetch()
    } catch (err) {
      const msg = getApiErrorMessage(err)
      toast.error(msg)
    }
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* KDS Queue Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                Hàng Đợi Chế Biến (KDS Queue)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-slate-950">
                {orders.length} ĐƠN CHỜ
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Các đơn hàng mới gửi từ tablet đang chờ bếp nhận vào nấu
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Live Clock Display */}
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

      {/* Main Queue Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 h-72 animate-pulse flex flex-col justify-between"
            >
              <div className="flex justify-between items-center">
                <div className="w-28 h-6 bg-slate-700 rounded-lg" />
                <div className="w-16 h-6 bg-slate-700 rounded-lg" />
              </div>
              <div className="space-y-3">
                <div className="w-full h-5 bg-slate-700 rounded" />
                <div className="w-3/4 h-5 bg-slate-700 rounded" />
              </div>
              <div className="w-full h-11 bg-slate-700 rounded-xl" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-slate-950 border border-dashed border-slate-800 rounded-3xl p-16 text-center flex flex-col items-center justify-center my-8">
          <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-400 mb-4 shadow-inner">
            <ChefHat className="w-10 h-10 text-slate-600" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <span>Hàng đợi đang trống</span>
            <Sparkles className="w-5 h-5 text-amber-400" />
          </h2>
          <p className="text-xs text-slate-400 max-w-md leading-relaxed">
            Hiện tại không có đơn gọi món mới nào đang chờ tiếp nhận. Bếp đã sẵn sàng khi khách gửi order từ tablet!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {orders.map((order) => (
            <KitchenQueueOrderCard
              key={order.id}
              order={order}
              onAccept={handleAcceptOrder}
            />
          ))}
        </div>
      )}
    </div>
  )
}
export default KitchenQueuePage
