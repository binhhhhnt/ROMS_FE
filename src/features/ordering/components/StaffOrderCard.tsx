import { Link } from 'react-router-dom'
import { Clock, ChevronRight, AlertCircle, BellRing } from 'lucide-react'
import type {
  OrderResponse,
  OrderItemStatus,
  OrderStatus,
} from '@/features/ordering/types/ordering.types'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'

interface StaffOrderCardProps {
  order: OrderResponse
}

export function StaffOrderCard({ order }: StaffOrderCardProps) {
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

  const getTimeAgo = (isoString?: string) => {
    if (!isoString) return ''
    const diffMs = Date.now() - new Date(isoString).getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Vừa đặt'
    if (diffMins < 60) return `${diffMins} phút trước`
    const diffHours = Math.floor(diffMins / 60)
    return `${diffHours} giờ trước`
  }

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="pending">Chờ tiếp nhận</Badge>
      case 'COOKING':
        return <Badge variant="cooking">Đang nấu</Badge>
      case 'COMPLETED':
        return <Badge variant="completed">Hoàn thành</Badge>
      case 'CANCELLED':
        return <Badge variant="cancelled">Đã hủy</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getItemStatusBadge = (status: OrderItemStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-status-pending/15 text-status-pending">
            Chờ bếp
          </span>
        )
      case 'COOKING':
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-status-cooking/15 text-status-cooking">
            Đang nấu
          </span>
        )
      case 'READY':
        return (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-status-ready/20 text-status-ready flex items-center gap-1 animate-pulse">
            <BellRing className="w-3 h-3 text-status-ready" />
            Sẵn sàng bưng
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-status-completed/15 text-status-completed">
            Đã phục vụ
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-status-cancelled/15 text-status-cancelled">
            Đã hủy
          </span>
        )
      default:
        return <span className="text-[11px] text-muted">{status}</span>
    }
  }

  // Count ready items that need immediate serving
  const readyItemsCount = order.items.filter((i) => i.status === 'READY').length

  return (
    <div className={`bg-card border rounded-xl shadow-xs overflow-hidden flex flex-col transition-all hover:shadow-md ${
      readyItemsCount > 0 ? 'border-status-ready/60 ring-1 ring-status-ready/30' : 'border-border hover:border-accent/40'
    }`}>
      {/* Ready Alert Header if any dishes are ready to serve */}
      {readyItemsCount > 0 && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 flex items-center justify-between text-xs text-status-ready font-semibold">
          <div className="flex items-center gap-1.5">
            <BellRing className="w-4 h-4 animate-bounce" />
            <span>Có {readyItemsCount} món đã xong, cần bưng ra bàn!</span>
          </div>
          <span className="text-[10px] bg-status-ready text-white px-1.5 py-0.2 rounded-full font-bold">
            BƯNG NGAY
          </span>
        </div>
      )}

      {/* Card Header */}
      <div className="bg-surface/40 p-4 border-b border-border flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-primary font-extrabold text-sm border border-border/80">
            {order.tableCode || `T${order.tableId}`}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-text">
                {order.tableCode ? `Bàn ${order.tableCode}` : `Bàn #${order.tableId}`}
              </span>
              <span className="text-xs font-semibold text-muted bg-surface/80 px-1.5 py-0.5 rounded">
                #{order.id}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted mt-1">
              <span className="flex items-center gap-1 font-medium text-text">
                <Clock className="w-3.5 h-3.5 text-accent" />
                {getTimeAgo(order.createdAt)}
              </span>
              <span>&bull;</span>
              <span>{formatTime(order.createdAt)}</span>
            </div>
          </div>
        </div>

        <div>{getOrderStatusBadge(order.status)}</div>
      </div>

      {/* Cancellation Banner if cancelled */}
      {order.status === 'CANCELLED' && order.terminationReason && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-xs text-status-cancelled flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Lý do hủy đơn: {order.terminationReason}</span>
        </div>
      )}

      {/* Items List Preview */}
      <div className="p-4 flex-1 divide-y divide-border/60">
        <div className="flex flex-col gap-2.5 pb-2">
          {order.items.slice(0, 4).map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-2 text-xs">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-text truncate">
                    {item.menuItemName}
                  </span>
                  <span className="font-bold text-accent shrink-0">
                    &times;{item.quantity}
                  </span>
                </div>
                {item.note && (
                  <p className="text-[11px] text-muted italic truncate">
                    &ldquo;{item.note}&rdquo;
                  </p>
                )}
              </div>
              <div className="shrink-0">{getItemStatusBadge(item.status)}</div>
            </div>
          ))}

          {order.items.length > 4 && (
            <div className="text-center pt-1 text-xs text-muted font-medium">
              +{order.items.length - 4} món ăn khác...
            </div>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="bg-surface/20 p-3.5 border-t border-border flex items-center justify-between mt-auto">
        <div>
          <div className="text-[11px] text-muted">
            Tổng cộng ({order.items.length} món)
          </div>
          <div className="font-extrabold text-sm text-primary">
            {formatPrice(order.totalAmount)}
          </div>
        </div>

        <Link to={`/staff/orders/${order.id}`}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-8 font-semibold hover:border-accent hover:text-accent flex items-center gap-1"
          >
            <span>Chi tiết</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
