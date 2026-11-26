import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Clock,
  CheckCircle2,
  ChefHat,
  UtensilsCrossed,
  Loader2,
} from 'lucide-react'
import { qrApi } from '../api/qrApi'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/utils/cn'

const formatPrice = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

const formatOrderTime = (iso?: string) => {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const ORDER_STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Chờ bếp', cls: 'bg-amber-100 text-amber-800' },
  COOKING: { label: 'Đang xử lý', cls: 'bg-sky-100 text-sky-800' },
  COMPLETED: { label: 'Hoàn thành', cls: 'bg-emerald-100 text-emerald-800' },
  CANCELLED: { label: 'Đã hủy', cls: 'bg-red-100 text-red-700' },
}

const ITEM_STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Chờ bếp', cls: 'bg-amber-100 text-amber-800' },
  COOKING: { label: 'Đang chế biến', cls: 'bg-sky-100 text-sky-800' },
  READY: { label: 'Sẵn sàng', cls: 'bg-emerald-100 text-emerald-800' },
  COMPLETED: { label: 'Hoàn thành', cls: 'bg-slate-100 text-slate-700' },
  CANCELLED: { label: 'Đã hủy', cls: 'bg-red-100 text-red-700' },
}

export function QrOrderTrackingPage() {
  const { qrToken = '' } = useParams<{ qrToken: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['qrOrders', qrToken],
    queryFn: () => qrApi.getSessionOrders(qrToken),
    enabled: Boolean(qrToken),
    refetchInterval: 10000,
  })

  const pendingRequests = useMemo(() => data?.pendingRequests || [], [data])
  const confirmedOrders = useMemo(() => data?.confirmedOrders || [], [data])

  const sessionSummary = useMemo(() => {
    const pendingTotal = pendingRequests.reduce(
      (sum, req) =>
        sum + req.items.reduce((s, item) => s + item.unitPrice * item.quantity, 0),
      0
    )
    const activeConfirmedOrders = confirmedOrders.filter(
      (order) => order.status !== 'CANCELLED'
    )
    const confirmedTotal = activeConfirmedOrders.reduce(
      (sum, order) => sum + (order.totalAmount ?? 0),
      0
    )
    return {
      totalAmount: pendingTotal + confirmedTotal,
      activeCount: pendingRequests.length + activeConfirmedOrders.length,
    }
  }, [pendingRequests, confirmedOrders])

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 gap-2 text-muted">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
        <span className="text-sm">Đang tải danh sách đơn bàn...</span>
      </div>
    )
  }

  const hasNothing = pendingRequests.length === 0 && confirmedOrders.length === 0

  if (hasNothing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
        <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center text-accent">
          <UtensilsCrossed className="w-7 h-7" />
        </div>
        <h2 className="font-bold text-base text-text">Chưa có món nào được gọi</h2>
        <p className="text-sm text-muted">
          Hãy chọn món từ thực đơn và gửi yêu cầu để nhân viên xác nhận xuống bếp.
        </p>
        <Link to={`/qr/${qrToken}/menu`}>
          <Button className="rounded-xl mt-1">Xem thực đơn</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-3 md:p-5 space-y-5">
      {/* Overall Session Summary */}
      <section className="bg-card border border-border rounded-2xl px-4 py-3 shadow-2xs flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-text">
          Tổng tạm tính:
        </span>
        <span className="text-base md:text-lg font-bold text-primary">
          {formatPrice(sessionSummary.totalAmount)}
        </span>
      </section>

      {/* Pending Confirmation QR Requests */}
      {pendingRequests.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center gap-2 px-1">
            <Clock className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-text">
              Đang chờ nhân viên xác nhận ({pendingRequests.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {pendingRequests.map((req) => {
              const reqTotal = req.items.reduce(
                (sum, item) => sum + item.unitPrice * item.quantity,
                0
              )
              const timeStr = formatOrderTime(req.createdAt)

              return (
                <div
                  key={req.id}
                  className="bg-card border border-amber-200 rounded-2xl p-3.5 md:p-4 flex flex-col justify-between gap-2.5 shadow-2xs"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-amber-700">
                          Yêu cầu #{req.id}
                        </span>
                        {timeStr && (
                          <span className="inline-flex items-center gap-1 text-muted">
                            <Clock className="w-3 h-3" />
                            {timeStr}
                          </span>
                        )}
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold shrink-0">
                        Chờ xác nhận
                      </span>
                    </div>

                    <div className="space-y-2 border-t border-border/60 pt-2.5">
                      {req.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between text-sm gap-2"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-text">
                              {item.quantity}x {item.menuItemName}
                            </p>
                            {item.note && (
                              <p className="text-xs text-muted">Ghi chú: {item.note}</p>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-primary shrink-0 pt-0.5">
                            {formatPrice(item.unitPrice * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/60 pt-2.5 text-sm">
                    <span className="text-muted font-medium">Tổng yêu cầu</span>
                    <span className="font-bold text-primary">
                      {formatPrice(reqTotal)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Confirmed Kitchen Orders */}
      {confirmedOrders.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center gap-2 px-1">
            <ChefHat className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-text">
              Đơn đã xác nhận ({confirmedOrders.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {confirmedOrders.map((order) => {
              const orderStatusMeta = ORDER_STATUS_LABEL[order.status] || {
                label: order.status,
                cls: 'bg-slate-100 text-slate-700',
              }
              const timeStr = formatOrderTime(order.createdAt)
              const isOrderCancelled = order.status === 'CANCELLED'

              return (
                <div
                  key={order.id}
                  className={cn(
                    'bg-card border border-border rounded-2xl p-3.5 md:p-4 flex flex-col justify-between gap-2.5 shadow-2xs',
                    isOrderCancelled && 'opacity-70'
                  )}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-primary">Đơn #{order.id}</span>
                        {timeStr && (
                          <span className="inline-flex items-center gap-1 text-muted">
                            <Clock className="w-3 h-3" />
                            {timeStr}
                          </span>
                        )}
                      </div>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold shrink-0',
                          orderStatusMeta.cls
                        )}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {orderStatusMeta.label}
                      </span>
                    </div>

                    <div className="space-y-2.5 border-t border-border/60 pt-2.5">
                      {order.items.map((item) => {
                        const statusMeta = ITEM_STATUS_LABEL[item.status] || {
                          label: item.status,
                          cls: 'bg-slate-100 text-slate-700',
                        }
                        const isItemCancelled = item.status === 'CANCELLED'
                        const itemPrice =
                          item.subtotal ?? item.unitPrice * item.quantity

                        return (
                          <div
                            key={item.id}
                            className="flex items-start justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p
                                className={cn(
                                  'text-sm font-medium text-text',
                                  isItemCancelled && 'line-through text-muted'
                                )}
                              >
                                {item.quantity}x {item.menuItemName}
                              </p>
                              {item.note && (
                                <p className="text-xs text-muted">Ghi chú: {item.note}</p>
                              )}
                            </div>

                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span
                                className={cn(
                                  'text-xs font-semibold text-primary',
                                  isItemCancelled && 'line-through text-muted'
                                )}
                              >
                                {formatPrice(itemPrice)}
                              </span>
                              <span
                                className={cn(
                                  'text-[11px] font-semibold px-2 py-0.5 rounded-full',
                                  statusMeta.cls
                                )}
                              >
                                {statusMeta.label}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/60 pt-2.5 text-sm">
                    <span className="text-muted font-medium">Tổng đơn</span>
                    <span
                      className={cn(
                        'font-bold text-primary',
                        isOrderCancelled && 'line-through text-muted'
                      )}
                    >
                      {formatPrice(order.totalAmount ?? 0)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
