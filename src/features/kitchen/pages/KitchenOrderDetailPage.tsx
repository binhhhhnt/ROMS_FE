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
    const unsubSession = subscribeToTopic('/topic/session/1/orders', () => {
      refetch()
    })

    return () => {
      unsubKitchen()
      unsubSession()
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
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-status-pending/20 text-status-pending border border-status-pending/40 animate-pulse">
            Chờ tiếp nhận
          </span>
        )
      case 'COOKING':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-status-cooking/20 text-status-cooking border border-status-cooking/40">
            Đang nấu
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-status-completed/20 text-status-completed border border-status-completed/40">
            Đã hoàn thành
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-status-cancelled/20 text-status-cancelled border border-status-cancelled/40">
            Đã hủy
          </span>
        )
      default:
        return <span className="text-xs text-muted">{status}</span>
    }
  }

  const getItemStatusBadge = (status: OrderItemStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-status-pending/15 text-status-pending border border-status-pending/30">
            Chờ nấu
          </span>
        )
      case 'COOKING':
        return (
          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-status-cooking/20 text-status-cooking border border-status-cooking/40 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 animate-pulse text-amber-500" />
            Đang chế biến
          </span>
        )
      case 'READY':
        return (
          <span className="text-xs font-bold px-3 py-1 rounded-md bg-status-ready/20 text-status-ready border border-status-ready/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-status-ready" />
            Sẵn sàng bưng
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-surface text-muted border border-border">
            Đã phục vụ
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-status-cancelled/15 text-status-cancelled border border-status-cancelled/30">
            Đã hủy
          </span>
        )
      default:
        return <span className="text-xs text-muted">{status}</span>
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <div className="h-6 w-32 bg-surface rounded animate-pulse" />
        <div className="h-32 bg-card border border-border rounded-2xl animate-pulse" />
        <div className="h-64 bg-card border border-border rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto my-12 text-center flex flex-col items-center gap-4 bg-card border border-border rounded-3xl p-8 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-status-cancelled/10 text-status-cancelled flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-text">Không tìm thấy đơn bếp</h2>
          <p className="text-xs text-muted mt-1">
            Mã đơn #{orderId} không tồn tại hoặc đã bị hủy khỏi hàng đợi.
          </p>
        </div>
        <Link to="/kitchen/queue">
          <Button variant="primary" size="sm">
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
          className="text-xs font-bold text-muted hover:text-text flex items-center gap-1.5 transition-colors"
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
          className="text-xs h-8 border-border bg-card text-text hover:bg-surface/50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 mr-1.5 ${isRefetching ? 'animate-spin text-accent' : ''}`}
          />
          {isRefetching ? 'Đang cập nhật...' : 'Làm mới'}
        </Button>
      </div>

      {/* Main Order Header Card */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-surface border border-border flex items-center justify-center text-primary font-black text-xl shadow-inner">
              {order.tableCode || `T${order.tableId}`}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-text">
                  {order.tableCode ? `Bàn ${order.tableCode}` : `Bàn #${order.tableId}`}
                </h1>
                <span className="text-xs font-bold text-muted bg-surface px-2.5 py-0.5 rounded-md border border-border">
                  Đơn #{order.id}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted mt-1">
                <Clock className="w-3.5 h-3.5 text-accent" />
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
                className="h-10 px-4 bg-primary hover:bg-primary-hover active:bg-primary-active text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
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
          <div className="bg-surface/40 border border-border p-3 rounded-xl">
            <div className="text-[11px] font-bold text-muted uppercase">
              Tổng số lượng
            </div>
            <div className="text-xl font-black text-text mt-0.5">
              {totalItemsCount} món
            </div>
          </div>

          <div className="bg-surface/40 border border-border p-3 rounded-xl">
            <div className="text-[11px] font-bold text-status-pending uppercase">
              Chờ nấu
            </div>
            <div className="text-xl font-black text-status-pending mt-0.5">
              {pendingItemsCount}
            </div>
          </div>

          <div className="bg-surface/40 border border-border p-3 rounded-xl">
            <div className="text-[11px] font-bold text-status-cooking uppercase">
              Đang nấu
            </div>
            <div className="text-xl font-black text-status-cooking mt-0.5">
              {cookingItemsCount}
            </div>
          </div>

          <div className="bg-surface/40 border border-border p-3 rounded-xl">
            <div className="text-[11px] font-bold text-status-ready uppercase">
              Sẵn sàng bưng
            </div>
            <div className="text-xl font-black text-status-ready mt-0.5">
              {readyItemsCount}
            </div>
          </div>
        </div>
      </div>

      {/* Items Detailed List Card */}
      <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
        <div className="bg-surface/30 p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-bold text-text flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-accent" />
            Chi tiết các món ăn cần chế biến
          </h2>
          <span className="text-xs text-muted">
            Cập nhật trạng thái từng món
          </span>
        </div>

        <div className="divide-y divide-border/60">
          {order.items.map((item, idx) => (
            <div
              key={item.id}
              className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                item.status === 'READY'
                  ? 'bg-status-ready/5'
                  : item.status === 'COOKING'
                  ? 'bg-status-cooking/5'
                  : 'hover:bg-surface/20'
              }`}
            >
              {/* Item Details */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="text-xs font-bold text-muted w-5 pt-1">
                  {idx + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-base text-text truncate">
                      {item.menuItemName}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-surface text-primary font-black text-xs border border-border">
                      &times; {item.quantity}
                    </span>
                  </div>

                  {item.note && (
                    <p className="text-xs font-semibold text-status-pending mt-1 flex items-center gap-1.5 bg-status-pending/10 px-2.5 py-1 rounded-md border border-status-pending/20 max-w-fit">
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
                    className="h-9 px-3 bg-surface hover:bg-surface/80 text-primary font-bold text-xs rounded-lg border border-border flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {updatingItemId === item.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Flame className="w-3.5 h-3.5 text-amber-500" />
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
                    className="h-9 px-3 bg-status-ready hover:bg-status-ready/90 active:bg-status-ready text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
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
