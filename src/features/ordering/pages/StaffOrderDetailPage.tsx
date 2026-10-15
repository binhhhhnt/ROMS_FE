import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Clock,
  Utensils,
  RefreshCw,
  BellRing,
  AlertCircle,
  FileText,
  DollarSign,
  User,
  Info,
} from 'lucide-react'

import { orderApi } from '@/features/ordering/api/orderApi'
import type {
  OrderStatus,
  OrderItemStatus,
} from '@/features/ordering/types/ordering.types'
import { subscribeToTopic } from '@/shared/lib/stomp'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'

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
  })

  // Realtime updates via STOMP
  useEffect(() => {
    const unsubSession = subscribeToTopic('/topic/session/1/orders', () => {
      refetch()
    })

    return () => {
      unsubSession()
    }
  }, [refetch])

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

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="pending">Chờ tiếp nhận</Badge>
      case 'COOKING':
        return <Badge variant="cooking">Đang nấu</Badge>
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
        return (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-status-pending/15 text-status-pending">
            Chờ bếp tiếp nhận
          </span>
        )
      case 'COOKING':
        return (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-status-cooking/15 text-status-cooking">
            Đang chế biến
          </span>
        )
      case 'READY':
        return (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-status-ready/20 text-status-ready flex items-center gap-1.5 animate-pulse">
            <BellRing className="w-3.5 h-3.5 text-status-ready" />
            Sẵn sàng bưng món
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-status-completed/15 text-status-completed">
            Đã phục vụ xong
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-status-cancelled/15 text-status-cancelled">
            Đã hủy món
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
        <div className="h-32 bg-card border border-border rounded-xl animate-pulse" />
        <div className="h-64 bg-card border border-border rounded-xl animate-pulse" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto my-12 text-center flex flex-col items-center gap-4 bg-card border border-border rounded-2xl p-8">
        <div className="w-14 h-14 rounded-full bg-red-500/10 text-status-cancelled flex items-center justify-center">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-text">Không tìm thấy đơn hàng</h2>
          <p className="text-xs text-muted mt-1">
            Mã đơn #{orderId} không tồn tại hoặc đã bị xóa khỏi hệ thống.
          </p>
        </div>
        <Link to="/staff/orders">
          <Button variant="primary" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Về danh sách Order
          </Button>
        </Link>
      </div>
    )
  }

  const readyItemsCount = order.items.filter((i) => i.status === 'READY').length

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/staff/orders"
          className="text-xs font-semibold text-muted hover:text-text flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách Order
        </Link>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="text-xs h-8"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 mr-1.5 ${isRefetching ? 'animate-spin' : ''}`}
          />
          {isRefetching ? 'Đang cập nhật...' : 'Cập nhật lại'}
        </Button>
      </div>

      {/* Ready Alert Notice */}
      {readyItemsCount > 0 && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between gap-3 text-status-ready shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-status-ready/20 flex items-center justify-center shrink-0">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="font-bold text-sm">
                Có {readyItemsCount} món ăn đã chế biến xong!
              </div>
              <p className="text-xs text-status-ready/80 mt-0.5">
                Bếp đã hoàn tất chuẩn bị. Vui lòng bưng món đến bàn{' '}
                <strong>{order.tableCode ? `Bàn ${order.tableCode}` : `Bàn #${order.tableId}`}</strong> cho khách.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-xs bg-status-ready text-white px-3 py-1 rounded-full font-bold">
            ƯU TIÊN PHỤC VỤ
          </span>
        </div>
      )}

      {/* Cancellation Notice if Order Cancelled */}
      {order.status === 'CANCELLED' && (
        <div className="bg-red-500/10 border border-status-cancelled/30 rounded-xl p-4 flex items-start gap-3 text-status-cancelled">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-bold text-sm">Đơn hàng này đã bị hủy</div>
            <p className="mt-1">
              Đơn hàng đã được xác nhận hủy bởi khách tại tablet.
              {order.terminationReason && (
                <> Lý do ghi nhận: <strong>&ldquo;{order.terminationReason}&rdquo;</strong></>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Main Order Header Card */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center text-primary font-extrabold text-base border border-border/80">
              {order.tableCode || `T${order.tableId}`}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-text">
                  {order.tableCode ? `Bàn ${order.tableCode}` : `Bàn #${order.tableId}`}
                </h1>
                <span className="text-xs font-bold text-muted bg-surface px-2 py-0.5 rounded">
                  Đơn #{order.id}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted mt-1">
                <Clock className="w-3.5 h-3.5 text-accent" />
                <span>Đặt lúc: {formatTime(order.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {getOrderStatusBadge(order.status)}
          </div>
        </div>

        {/* Order Meta Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1 text-xs">
          <div>
            <span className="text-muted block">Phiên phục vụ (Session):</span>
            <span className="font-semibold text-text mt-0.5 block">
              #{order.sessionId || 'Mặc định'}
            </span>
          </div>

          <div>
            <span className="text-muted block">Người tạo / Nguồn đơn:</span>
            <span className="font-semibold text-text mt-0.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-muted" />
              {order.createdByName || 'Khách tại bàn (Tablet)'}
            </span>
          </div>

          <div>
            <span className="text-muted block">Cập nhật gần nhất:</span>
            <span className="font-semibold text-text mt-0.5 block">
              {formatTime(order.updatedAt || order.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Order Items Table Card */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="bg-surface/40 p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-bold text-text flex items-center gap-2">
            <Utensils className="w-4 h-4 text-accent" />
            Danh sách món ăn ({order.items.length} món)
          </h2>
          <span className="text-xs text-muted">
            Theo dõi trạng thái từ bếp
          </span>
        </div>

        <div className="divide-y divide-border/60">
          {order.items.map((item, idx) => (
            <div
              key={item.id}
              className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                item.status === 'READY'
                  ? 'bg-emerald-500/5'
                  : item.status === 'CANCELLED'
                  ? 'bg-surface/30 opacity-75'
                  : 'hover:bg-surface/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xs font-bold text-muted w-5 pt-0.5">
                  {idx + 1}.
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-text">
                      {item.menuItemName}
                    </span>
                    <span className="text-xs font-extrabold text-accent">
                      &times; {item.quantity}
                    </span>
                  </div>

                  {item.note && (
                    <p className="text-xs text-muted italic mt-1 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-muted shrink-0" />
                      Ghi chú: {item.note}
                    </p>
                  )}

                  {item.status === 'CANCELLED' && item.terminationReason && (
                    <p className="text-xs text-status-cancelled mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      Lý do hủy: {item.terminationReason}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pl-8 sm:pl-0">
                <div className="text-right">
                  <div className="text-xs text-muted">
                    {formatPrice(item.unitPrice)} / món
                  </div>
                  <div className="font-bold text-sm text-text">
                    {formatPrice(item.subtotal || item.unitPrice * item.quantity)}
                  </div>
                </div>

                <div className="min-w-[130px] flex justify-end">
                  {getItemStatusBadge(item.status)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Items Footer Summary */}
        <div className="bg-surface/30 p-5 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Info className="w-4 h-4 text-accent shrink-0" />
            <span>
              Quy tắc hệ thống: Việc hủy món/đơn chỉ được thực hiện trực tiếp từ Tablet của khách khi ở trạng thái Chờ tiếp nhận.
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4">
            <span className="text-xs font-semibold text-muted">
              Tổng tiền đơn hàng:
            </span>
            <span className="text-xl font-extrabold text-primary flex items-center">
              <DollarSign className="w-5 h-5 text-accent mr-0.5" />
              {formatPrice(order.totalAmount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
export default StaffOrderDetailPage
