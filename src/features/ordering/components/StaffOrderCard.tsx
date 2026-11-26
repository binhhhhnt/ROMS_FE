import { Link } from 'react-router-dom'
import { Clock, ChevronRight, AlertCircle } from 'lucide-react'
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
        return <Badge variant="pending">Chờ bếp</Badge>
      case 'COOKING':
        return <Badge variant="cooking">Đang nấu</Badge>
      case 'READY':
        return <Badge variant="ready">Sẵn sàng bưng</Badge>
      case 'COMPLETED':
        return <Badge variant="completed">Đã phục vụ</Badge>
      case 'CANCELLED':
        return <Badge variant="cancelled">Đã hủy</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Count ready items that need immediate serving
  const readyItemsCount = order.items.filter((i) => i.status === 'READY').length

  return (
    <div
      className={`bg-card border border-border rounded-lg overflow-hidden flex flex-col ${
        readyItemsCount > 0 ? 'border-t-4 border-t-status-ready' : ''
      }`}
    >
      {/* Ready Alert Strip */}
      {readyItemsCount > 0 && (
        <div className="bg-card border-b border-border border-l-4 border-l-status-ready px-4 py-2 text-xs text-status-ready font-medium">
          Có {readyItemsCount} món đã xong, cần bưng ra bàn
        </div>
      )}

      {/* Card Header (Hàng cha: bg-surface/60) */}
      <div className="bg-surface/60 px-4 py-3 border-b border-border flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-base text-text">
              {order.tableCode ? `Bàn ${order.tableCode}` : `Bàn #${order.tableId}`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted mt-0.5">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>{getTimeAgo(order.createdAt)}</span>
            <span>&bull;</span>
            <span className="tabular-nums">{formatTime(order.createdAt)}</span>
          </div>
        </div>

        <div className="shrink-0">{getOrderStatusBadge(order.status)}</div>
      </div>

      {/* Cancellation Banner if cancelled */}
      {order.status === 'CANCELLED' && order.terminationReason && (
        <div className="bg-card border-b border-border border-l-4 border-l-status-cancelled px-4 py-2 text-xs text-status-cancelled flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="min-w-0 flex-1">Lý do hủy: {order.terminationReason}</span>
        </div>
      )}

      {/* Items List Preview (Hàng con: nền trắng bg-card, divide-y) */}
      <div className="divide-y divide-border bg-card flex-1">
        {order.items.slice(0, 4).map((item) => (
          <div
            key={item.id}
            className="px-4 py-2.5 flex items-start justify-between gap-2 text-xs"
          >
            <div className="min-w-0 flex-1 flex items-start gap-2.5">
              <span className="font-mono font-bold text-sm text-text shrink-0 w-7 tabular-nums">
                {item.quantity}x
              </span>
              <div className="min-w-0 flex-1">
                <span className="font-medium text-text block truncate">
                  {item.menuItemName}
                </span>
                {item.note && (
                  <p className="text-[11px] text-muted truncate mt-0.5">
                    Ghi chú: {item.note}
                  </p>
                )}
              </div>
            </div>
            <div className="shrink-0">{getItemStatusBadge(item.status)}</div>
          </div>
        ))}

        {order.items.length > 4 && (
          <div className="px-4 py-2 text-center text-xs text-muted">
            +{order.items.length - 4} món ăn khác
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="bg-card px-4 py-3 border-t border-border flex items-center justify-between mt-auto">
        <div className="tabular-nums">
          <div className="text-[11px] text-muted">
            Tổng ({order.items.length} món)
          </div>
          <div className="font-bold font-mono text-sm text-text">
            {formatPrice(order.totalAmount)}
          </div>
        </div>

        <Link to={`/staff/orders/${order.id}`}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-9 px-3 flex items-center gap-1"
          >
            <span>Chi tiết</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
