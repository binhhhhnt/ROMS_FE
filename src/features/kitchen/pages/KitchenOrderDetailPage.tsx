import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Clock,
  ChefHat,
  RefreshCw,
  FileText,
  AlertCircle,
  CheckCircle2,
  Flame,
  Check,
} from 'lucide-react'

import { kitchenApi } from '@/features/kitchen/api/kitchenApi'
import type {
  OrderItemStatus,
  OrderStatus,
} from '@/features/ordering/types/ordering.types'
import { subscribeToTopic } from '@/shared/lib/stomp'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { Button } from '@/shared/components/ui/button'

export function KitchenOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const parsedOrderId = Number(orderId)

  const [isAccepting, setIsAccepting] = useState(false)
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null)

  // Query order details from Kitchen API
  const {
    data: order,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['kitchen', 'orders', parsedOrderId],
    queryFn: () => kitchenApi.getKitchenOrderById(parsedOrderId),
    enabled: !isNaN(parsedOrderId) && parsedOrderId > 0,
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

  // Accept whole order into COOKING
  const handleAcceptOrder = async () => {
    setIsAccepting(true)
    try {
      await kitchenApi.acceptOrder(parsedOrderId)
      toast.success(`Đã nhận toàn bộ đơn #${parsedOrderId} vào chế biến!`)
      await refetch()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsAccepting(false)
    }
  }

  // Update single item status
  const handleUpdateItemStatus = async (
    itemId: number,
    targetStatus: OrderItemStatus
  ) => {
    setUpdatingItemId(itemId)
    try {
      await kitchenApi.updateOrderItemStatus(parsedOrderId, itemId, targetStatus)
      toast.success(
        targetStatus === 'READY'
          ? 'Đã báo món sẵn sàng phục vụ!'
          : 'Đã cập nhật trạng thái món!'
      )
      await refetch()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setUpdatingItemId(null)
    }
  }

  const formatTime = (isoString?: string) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date)
  }

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
            Chờ tiếp nhận
          </span>
        )
      case 'COOKING':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-sky-500/20 text-sky-400 border border-sky-500/40">
            Đang nấu
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            Đã hoàn thành
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-red-500/20 text-red-400 border border-red-500/40">
            Đã hủy
          </span>
        )
      default:
        return <span className="text-xs text-slate-400">{status}</span>
    }
  }

  const getItemStatusBadge = (status: OrderItemStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Chờ nấu
          </span>
        )
      case 'COOKING':
        return (
          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            Đang chế biến
          </span>
        )
      case 'READY':
        return (
          <span className="text-xs font-extrabold px-3 py-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Sẵn sàng bưng
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
            Đã phục vụ
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-red-500/15 text-red-400 border border-red-500/30">
            Đã hủy
          </span>
        )
      default:
        return <span className="text-xs text-slate-400">{status}</span>
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <div className="h-6 w-32 bg-slate-800 rounded animate-pulse" />
        <div className="h-32 bg-slate-800 border border-slate-700 rounded-2xl animate-pulse" />
        <div className="h-64 bg-slate-800 border border-slate-700 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto my-12 text-center flex flex-col items-center gap-4 bg-slate-950 border border-slate-800 rounded-3xl p-8">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Không tìm thấy đơn bếp</h2>
          <p className="text-xs text-slate-400 mt-1">
            Mã đơn #{orderId} không tồn tại hoặc đã bị hủy khỏi hàng đợi.
          </p>
        </div>
        <Link to="/kitchen/queue">
          <Button variant="primary" size="sm" className="bg-sky-600 hover:bg-sky-500">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Về Hàng đợi KDS
          </Button>
        </Link>
      </div>
    )
  }

  // Calculate items progress
  const totalItemsCount = order.items.reduce((sum, i) => sum + i.quantity, 0)
  const readyItemsCount = order.items.filter((i) => i.status === 'READY').length
  const cookingItemsCount = order.items.filter((i) => i.status === 'COOKING').length
  const pendingItemsCount = order.items.filter((i) => i.status === 'PENDING').length

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-12">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/kitchen/queue"
          className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Về Hàng đợi KDS
        </Link>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="text-xs h-8 border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 mr-1.5 ${isRefetching ? 'animate-spin text-sky-400' : ''}`}
          />
          {isRefetching ? 'Đang cập nhật...' : 'Làm mới'}
        </Button>
      </div>

      {/* Main Order Header Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-sky-400 font-black text-xl shadow-inner">
              {order.tableCode || `T${order.tableId}`}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {order.tableCode ? `Bàn ${order.tableCode}` : `Bàn #${order.tableId}`}
                </h1>
                <span className="text-xs font-bold text-slate-400 bg-slate-900 px-2.5 py-0.5 rounded-md border border-slate-800">
                  Đơn #{order.id}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>Nhận lúc: {formatTime(order.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {getOrderStatusBadge(order.status)}

            {/* Accept Order button if still PENDING */}
            {order.status === 'PENDING' && (
              <button
                type="button"
                onClick={handleAcceptOrder}
                disabled={isAccepting}
                className="h-10 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition-colors cursor-pointer disabled:opacity-60"
              >
                {isAccepting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ChefHat className="w-4 h-4" />
                    <span>Nhận đơn vào nấu</span>
                    <Check className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Progress Counters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
            <div className="text-[11px] font-bold text-slate-400 uppercase">
              Tổng số lượng
            </div>
            <div className="text-xl font-black text-white mt-0.5">
              {totalItemsCount} món
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
            <div className="text-[11px] font-bold text-amber-400 uppercase">
              Chờ nấu
            </div>
            <div className="text-xl font-black text-amber-400 mt-0.5">
              {pendingItemsCount}
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
            <div className="text-[11px] font-bold text-sky-400 uppercase">
              Đang nấu
            </div>
            <div className="text-xl font-black text-sky-400 mt-0.5">
              {cookingItemsCount}
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
            <div className="text-[11px] font-bold text-emerald-400 uppercase">
              Sẵn sàng bưng
            </div>
            <div className="text-xl font-black text-emerald-400 mt-0.5">
              {readyItemsCount}
            </div>
          </div>
        </div>
      </div>

      {/* Items Detailed List Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-slate-900/80 p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-sky-400" />
            Chi tiết các món ăn cần chế biến
          </h2>
          <span className="text-xs text-slate-400">
            Cập nhật trạng thái từng món
          </span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {order.items.map((item, idx) => (
            <div
              key={item.id}
              className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                item.status === 'READY'
                  ? 'bg-emerald-500/5'
                  : item.status === 'COOKING'
                  ? 'bg-sky-500/5'
                  : 'hover:bg-slate-900/40'
              }`}
            >
              {/* Item Details */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="text-xs font-bold text-slate-500 w-5 pt-1">
                  {idx + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-base text-white truncate">
                      {item.menuItemName}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 font-black text-xs border border-sky-500/30">
                      &times; {item.quantity}
                    </span>
                  </div>

                  {item.note && (
                    <p className="text-xs font-semibold text-amber-400 mt-1 flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 max-w-fit">
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span>Ghi chú của khách: &ldquo;{item.note}&rdquo;</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Status Badge & Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-8 sm:pl-0">
                <div>{getItemStatusBadge(item.status)}</div>

                {/* Quick Kitchen Action: PENDING -> COOKING */}
                {item.status === 'PENDING' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateItemStatus(item.id, 'COOKING')}
                    disabled={updatingItemId === item.id}
                    className="h-9 px-3 bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-xs rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {updatingItemId === item.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        <span>Bắt đầu nấu</span>
                      </>
                    )}
                  </button>
                )}

                {/* Quick Kitchen Action: COOKING -> READY */}
                {item.status === 'COOKING' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateItemStatus(item.id, 'READY')}
                    disabled={updatingItemId === item.id}
                    className="h-9 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {updatingItemId === item.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Báo nấu xong (READY)</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
export default KitchenOrderDetailPage
