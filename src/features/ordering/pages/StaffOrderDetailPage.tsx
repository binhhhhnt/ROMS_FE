import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'

import { orderApi } from '@/features/ordering/api/orderApi'
import { getApiErrorMessage } from '@/shared/lib/axios'
import type {
  OrderStatus,
  OrderItemStatus,
} from '@/features/ordering/types/ordering.types'
import { subscribeToTopic } from '@/shared/lib/stomp'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { CancelItemModal } from '@/features/ordering/components/CancelItemModal'

export function StaffOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const parsedOrderId = Number(orderId)

  // Query order details
  const {
    data: order,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['orders', 'staff', parsedOrderId],
    queryFn: () => orderApi.getOrderById(parsedOrderId),
    enabled: !isNaN(parsedOrderId) && parsedOrderId > 0,
    staleTime: 0,
    refetchOnMount: 'always',
  })

  // Realtime updates via STOMP
  useEffect(() => {
    const unsubKitchen = subscribeToTopic('/topic/kitchen/orders', () => {
      refetch()
    })
    const unsubSession = order?.sessionId
      ? subscribeToTopic(`/topic/session/${order.sessionId}/orders`, () => {
          refetch()
        })
      : undefined

    return () => {
      unsubKitchen()
      unsubSession?.()
    }
  }, [refetch, order?.sessionId])

  const [servingItemId, setServingItemId] = useState<number | null>(null)
  const [isServingAll, setIsServingAll] = useState(false)

  const [cancelTarget, setCancelTarget] = useState<
    | { type: 'ORDER' }
    | { type: 'ITEM'; itemId: number; itemName: string; maxQuantity: number }
    | null
  >(null)
  const [isCancelling, setIsCancelling] = useState(false)

  const handleCancelConfirm = async (reason: string, quantity?: number) => {
    if (!cancelTarget || !order) return
    setIsCancelling(true)
    try {
      if (cancelTarget.type === 'ORDER') {
        await orderApi.cancelOrder(order.id, reason)
        toast.success('Đã hủy đơn hàng thành công, nguyên liệu đã được hoàn lại vào kho!')
      } else {
        await orderApi.cancelOrderItem(order.id, cancelTarget.itemId, reason, quantity)
        toast.success(
          quantity && quantity < cancelTarget.maxQuantity
            ? `Đã hủy ${quantity} phần "${cancelTarget.itemName}" thành công, nguyên liệu đã được hoàn lại!`
            : `Đã hủy món "${cancelTarget.itemName}" thành công, nguyên liệu đã được hoàn lại!`
        )
      }
      await refetch()
    } catch (err) {
      toast.error(getApiErrorMessage(err) || 'Không thể hủy. Vui lòng thử lại.')
    } finally {
      setIsCancelling(false)
      setCancelTarget(null)
    }
  }

  const handleCompleteItem = async (itemId: number, itemName: string) => {
    setServingItemId(itemId)
    try {
      await orderApi.completeOrderItem(parsedOrderId, itemId)
      toast.success(`Đã xác nhận bưng món "${itemName}" ra Bàn ${order?.tableCode || ''}!`)
      await refetch()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setServingItemId(null)
    }
  }

  const handleCompleteAllReady = async () => {
    const readyItems = order?.items.filter((i) => i.status === 'READY') || []
    if (readyItems.length === 0) return
    setIsServingAll(true)
    try {
      for (const item of readyItems) {
        await orderApi.completeOrderItem(parsedOrderId, item.id)
      }
      toast.success(
        `Đã bưng tất cả ${readyItems.length} món sẵn sàng ra Bàn ${order?.tableCode || ''}!`
      )
      await refetch()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsServingAll(false)
    }
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
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

  const getOrderStatusIndicator = (status: OrderStatus) => {
    const map: Record<
      OrderStatus,
      { label: string; dot: string; variant: 'pending' | 'cooking' | 'completed' | 'cancelled' }
    > = {
      PENDING: { label: 'Chờ tiếp nhận', dot: 'bg-status-pending', variant: 'pending' },
      COOKING: { label: 'Đang nấu', dot: 'bg-status-cooking', variant: 'cooking' },
      COMPLETED: { label: 'Đã hoàn thành', dot: 'bg-status-completed', variant: 'completed' },
      CANCELLED: { label: 'Đã hủy', dot: 'bg-status-cancelled', variant: 'cancelled' },
    }
    const cfg = map[status]
    if (!cfg) return <Badge variant="outline">{status}</Badge>
    return (
      <Badge variant={cfg.variant}>
        <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
        {cfg.label}
      </Badge>
    )
  }

  const getItemStatusIndicator = (status: OrderItemStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="pending">
            <span className="w-2 h-2 rounded-full bg-status-pending shrink-0" />
            Chờ nấu
          </Badge>
        )
      case 'COOKING':
        return (
          <Badge variant="cooking">
            <span className="w-2 h-2 rounded-full bg-status-cooking shrink-0" />
            Đang nấu
          </Badge>
        )
      case 'READY':
        return (
          <Badge variant="ready">
            <span className="w-2 h-2 rounded-full bg-status-ready shrink-0" />
            Chờ bưng
          </Badge>
        )
      case 'COMPLETED':
        return <Badge variant="completed">Đã phục vụ</Badge>
      case 'CANCELLED':
        return <Badge variant="cancelled">Đã hủy</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col gap-5">
        <div className="h-6 w-32 bg-card border border-border rounded animate-pulse" />
        <div className="h-32 bg-card border border-border rounded-lg animate-pulse" />
        <div className="h-64 bg-card border border-border rounded-lg animate-pulse" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto my-12 text-center flex flex-col items-center gap-4 bg-card border border-border rounded-lg p-8">
        <AlertCircle className="w-8 h-8 text-status-cancelled" />
        <div>
          <h2 className="text-base font-bold text-text">Không tìm thấy đơn hàng</h2>
          <p className="text-xs text-muted mt-1">
            Mã đơn #{orderId} không tồn tại hoặc đã bị xóa khỏi hệ thống.
          </p>
        </div>
        <Link to="/staff/orders">
          <Button variant="primary" size="md">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Về danh sách Order
          </Button>
        </Link>
      </div>
    )
  }

  const readyItemsCount = order.items.filter((i) => i.status === 'READY').length

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5 pb-12">
      {/* Tầng 1: Top Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/staff/orders" className="inline-block">
          <Button type="button" variant="outline" size="sm" className="h-9 px-3 text-xs font-medium gap-1.5">
            <ArrowLeft className="w-4 h-4 shrink-0" />
            Quay lại danh sách Order
          </Button>
        </Link>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="text-xs h-9 px-3 shrink-0"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 mr-1.5 ${isRefetching ? 'animate-spin' : ''}`}
          />
          Cập nhật lại
        </Button>
      </div>

      {/* Ready Action Banner (Minimalist: trắng + vạch nhấn xanh) */}
      {readyItemsCount > 0 && (
        <div className="bg-card border border-border border-l-4 border-l-status-ready rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm text-text">
              Có {readyItemsCount} món đã nấu xong
            </div>
            <p className="text-xs text-muted mt-0.5">
              Sẵn sàng bưng ra{' '}
              <span className="font-medium text-text">
                {order.tableCode ? `Bàn ${order.tableCode}` : `Bàn #${order.tableId}`}
              </span>
              .
            </p>
          </div>
          {readyItemsCount > 1 && (
            <Button
              variant="primary"
              onClick={handleCompleteAllReady}
              disabled={isServingAll}
              className="h-11 px-4 text-sm font-semibold shrink-0"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Bưng tất cả ({readyItemsCount} món)
            </Button>
          )}
        </div>
      )}

      {/* Cancellation Notice */}
      {order.status === 'CANCELLED' && (
        <div className="bg-card border border-border border-l-4 border-l-status-cancelled rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-status-cancelled shrink-0 mt-0.5" />
          <div className="text-xs min-w-0 flex-1">
            <div className="font-semibold text-sm text-status-cancelled">
              Đơn hàng này đã bị hủy
            </div>
            <p className="text-muted mt-0.5">
              Đơn hàng đã được xác nhận hủy.
              {order.terminationReason && (
                <>
                  {' '}
                  Lý do: <span className="font-medium text-text">&ldquo;{order.terminationReason}&rdquo;</span>
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Tầng 2: Main Order Header Card */}
      <div className="bg-card border border-border rounded-lg">
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold text-text">
                {order.tableCode ? `Bàn ${order.tableCode}` : `Bàn #${order.tableId}`}
              </h1>
              <span className="text-xs font-mono text-muted">
                Đơn #{order.id}
              </span>
              {getOrderStatusIndicator(order.status)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted mt-1">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Đặt lúc {formatTime(order.createdAt)}</span>
            </div>
          </div>

          {order.status === 'PENDING' && (
            <Button
              type="button"
              variant="destructiveOutline"
              size="sm"
              onClick={() => setCancelTarget({ type: 'ORDER' })}
              className="text-xs h-9 px-3 shrink-0 self-start sm:self-auto"
            >
              Hủy đơn hàng
            </Button>
          )}
        </div>

        {/* Order Meta Info Strip */}
        <div className="px-4 py-3 sm:px-5 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
          <div className="min-w-0">
            <span className="text-muted block">Phiên phục vụ</span>
            <span className="font-medium text-text font-mono mt-0.5 block truncate">
              {order.sessionCode || (order.sessionId ? `#${order.sessionId}` : 'Mặc định')}
            </span>
          </div>

          <div className="min-w-0">
            <span className="text-muted block">Nguồn đơn</span>
            <span className="font-medium text-text mt-0.5 block truncate">
              {order.createdByName || 'Khách tại bàn (Tablet)'}
            </span>
          </div>

          <div className="min-w-0 col-span-2 sm:col-span-1">
            <span className="text-muted block">Cập nhật gần nhất</span>
            <span className="font-medium text-text mt-0.5 block truncate">
              {formatTime(order.updatedAt || order.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Tầng 3: Order Items Card */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 sm:px-5 border-b border-border flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-text">
            Danh sách món ({order.items.length})
          </h2>
          <span className="text-xs text-muted shrink-0">
            Trạng thái theo bếp
          </span>
        </div>

        <div className="divide-y divide-border">
          {order.items.map((item) => {
            const returnedQty = item.returnedQuantity ?? item.returned_quantity ?? 0
            const isCancelled = item.status === 'CANCELLED'
            return (
              <div
                key={item.id}
                className={`px-4 py-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCancelled ? 'opacity-60' : ''
                }`}
              >
                {/* Cột trái: Số lượng (anchor) + Tên món + Ghi chú */}
                <div className="min-w-0 flex-1 flex items-start gap-3">
                  <span className="font-mono font-bold text-base text-text shrink-0 w-9 pt-0.5 tabular-nums">
                    {item.quantity}x
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span
                        className={`font-semibold text-sm text-text ${
                          isCancelled ? 'line-through text-muted' : ''
                        }`}
                      >
                        {item.menuItemName}
                      </span>
                      {returnedQty > 0 && (
                        <span className="text-xs text-muted">
                          (Đã dùng: {item.quantity - returnedQty}, trả: {returnedQty})
                        </span>
                      )}
                    </div>

                    {item.note && (
                      <p className="text-xs text-text mt-1">
                        <span className="font-semibold">Ghi chú:</span> {item.note}
                      </p>
                    )}

                    {isCancelled && item.terminationReason && (
                      <p className="text-xs text-status-cancelled mt-1">
                        Lý do hủy: {item.terminationReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Cột phải: Giá + Trạng thái/Thao tác */}
                <div className="shrink-0 flex items-center justify-between sm:justify-end gap-4 pl-12 sm:pl-0">
                  <div className="text-left sm:text-right tabular-nums shrink-0">
                    <div className="font-semibold text-sm text-text font-mono">
                      {formatPrice(item.subtotal || item.unitPrice * item.quantity)}
                    </div>
                    <div className="text-xs text-muted">
                      {formatPrice(item.unitPrice)} / món
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {item.status === 'READY' ? (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => handleCompleteItem(item.id, item.menuItemName)}
                        disabled={servingItemId === item.id}
                        className="h-9 px-3.5 text-xs font-semibold"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Đã bưng ra bàn
                      </Button>
                    ) : (
                      <>
                        {getItemStatusIndicator(item.status)}
                        {item.status === 'PENDING' && (
                          <Button
                            type="button"
                            variant="destructiveOutline"
                            size="sm"
                            onClick={() =>
                              setCancelTarget({
                                type: 'ITEM',
                                itemId: item.id,
                                itemName: item.menuItemName,
                                maxQuantity: item.quantity,
                              })
                            }
                            className="text-xs h-9 px-2.5"
                          >
                            Hủy món
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Order Items Footer Summary */}
        <div className="px-4 py-4 sm:px-5 border-t border-border flex items-center justify-between gap-4">
          <span className="text-xs text-muted">
            Tổng cộng ({order.items.length} món)
          </span>
          <span className="text-lg font-bold font-mono text-text tabular-nums">
            {formatPrice(order.totalAmount)}
          </span>
        </div>
      </div>

      {/* Cancel Order / Item Modal */}
      <CancelItemModal
        isOpen={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelConfirm}
        title={cancelTarget?.type === 'ORDER' ? 'Xác nhận hủy toàn bộ đơn hàng' : 'Xác nhận hủy món ăn'}
        itemName={cancelTarget?.type === 'ITEM' ? cancelTarget.itemName : undefined}
        maxQuantity={cancelTarget?.type === 'ITEM' ? cancelTarget.maxQuantity : undefined}
        isLoading={isCancelling}
      />
    </div>
  )
}
export default StaffOrderDetailPage
