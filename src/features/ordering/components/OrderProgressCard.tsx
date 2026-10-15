import { Clock, Utensils, XCircle, AlertCircle } from 'lucide-react'
import type {
  OrderResponse,
  OrderItemResponse,
  OrderStatus,
  OrderItemStatus,
} from '@/features/ordering/types/ordering.types'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'

interface OrderProgressCardProps {
  order: OrderResponse
  onCancelItem: (orderId: number, item: OrderItemResponse) => void
  onCancelOrder: (order: OrderResponse) => void
}

export function OrderProgressCard({
  order,
  onCancelItem,
  onCancelOrder,
}: OrderProgressCardProps) {
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
      day: '2-digit',
      month: '2-digit',
    }).format(date)
  }

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="pending">Chờ tiếp nhận</Badge>
      case 'COOKING':
        return <Badge variant="cooking">Đang chế biến</Badge>
      case 'COMPLETED':
        return <Badge variant="completed">Đã hoàn thành</Badge>
      case 'CANCELLED':
        return <Badge variant="cancelled">Đã hủy</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getItemStatusBadge = (status: OrderItemStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="pending" className="text-[11px]">Chờ tiếp nhận</Badge>
      case 'COOKING':
        return <Badge variant="cooking" className="text-[11px]">Đang nấu</Badge>
      case 'READY':
        return <Badge variant="ready" className="text-[11px] animate-pulse">Sẵn sàng phục vụ</Badge>
      case 'COMPLETED':
        return <Badge variant="completed" className="text-[11px]">Đã bưng món</Badge>
      case 'CANCELLED':
        return <Badge variant="cancelled" className="text-[11px]">Đã hủy</Badge>
      default:
        return <Badge variant="outline" className="text-[11px]">{status}</Badge>
    }
  }

  const isOrderPending = order.status === 'PENDING'

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col transition-all hover:border-accent/40">
      {/* Order Header */}
      <div className="bg-surface/30 p-4 sm:p-5 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-primary font-bold">
            <Utensils className="w-5 h-5 text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-text">
                Đơn #{order.id}
              </span>
              <span className="text-xs text-muted">
                ({order.tableCode || `Bàn ${order.tableId}`})
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted mt-0.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(order.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getOrderStatusBadge(order.status)}

          {/* Cancel Entire Order (Only when Order is PENDING) */}
          {isOrderPending && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onCancelOrder(order)}
              className="text-xs text-status-cancelled hover:bg-status-cancelled/10 border-status-cancelled/30 h-8"
            >
              <XCircle className="w-3.5 h-3.5 mr-1" />
              Hủy cả đơn
            </Button>
          )}
        </div>
      </div>

      {/* Cancellation Reason if order cancelled */}
      {order.status === 'CANCELLED' && order.terminationReason && (
        <div className="bg-red-50/70 border-b border-status-cancelled/20 px-4 py-2 text-xs text-status-cancelled flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Lý do hủy đơn: {order.terminationReason}</span>
        </div>
      )}

      {/* Order Items List */}
      <div className="divide-y divide-border/60 p-2 sm:p-4">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface/20 rounded-lg transition-colors"
          >
            {/* Item Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-text">
                  {item.menuItemName}
                </span>
                <span className="text-xs font-bold text-accent">
                  &times; {item.quantity}
                </span>
              </div>

              {item.note && (
                <p className="text-xs text-muted italic mt-0.5">
                  Ghi chú: {item.note}
                </p>
              )}

              {item.status === 'CANCELLED' && item.terminationReason && (
                <p className="text-[11px] text-status-cancelled mt-0.5">
                  Lý do hủy: {item.terminationReason}
                </p>
              )}
            </div>

            {/* Status & Cancel Action */}
            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
              <div className="text-right sm:mr-2">
                <span className="font-bold text-sm text-text">
                  {formatPrice(item.subtotal || item.unitPrice * item.quantity)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {getItemStatusBadge(item.status)}

                {/* Cancel single item button: ONLY when item is PENDING */}
                {item.status === 'PENDING' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onCancelItem(order.id, item)}
                    className="h-7 px-2 text-xs text-muted hover:text-status-cancelled hover:bg-status-cancelled/10"
                    title="Hủy món này"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Hủy
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Footer */}
      <div className="bg-surface/10 p-4 border-t border-border flex items-center justify-between mt-auto">
        <span className="text-xs text-muted">
          Tổng cộng ({order.items.length} món)
        </span>
        <span className="font-extrabold text-base text-primary">
          {formatPrice(order.totalAmount)}
        </span>
      </div>
    </div>
  )
}
