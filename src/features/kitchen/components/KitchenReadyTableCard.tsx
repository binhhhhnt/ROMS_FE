import type { KitchenOrderResponse } from '@/features/kitchen/types/kitchen.types'
import type { OrderItemResponse } from '@/features/ordering/types/ordering.types'

interface KitchenReadyTableCardProps {
  order: KitchenOrderResponse
  readyItems: OrderItemResponse[]
}

export function KitchenReadyTableCard({
  order,
  readyItems,
}: KitchenReadyTableCardProps) {
  const formatTime = (isoString?: string) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <div className="bg-card border border-status-ready/60 rounded-2xl shadow-xs overflow-hidden flex flex-col transition-all">
      {/* Header with Table and Ready Badge */}
      <div className="bg-surface/50 p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-status-ready/15 border border-status-ready/30 flex items-center justify-center text-status-ready font-black text-xl">
            {order.tableCode || `T${order.tableId}`}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-text">
                {order.tableCode ? `Bàn ${order.tableCode}` : `Bàn #${order.tableId}`}
              </span>
              <span className="text-xs font-semibold text-muted bg-surface px-2 py-0.5 rounded border border-border">
                #{order.id}
              </span>
            </div>
            <div className="text-xs text-muted mt-0.5">
              Ra quầy lúc {formatTime(order.updatedAt || order.createdAt)}
            </div>
          </div>
        </div>

        {/* Ready Badge */}
        <div className="px-3 py-1.5 rounded-lg bg-status-ready text-white text-xs font-bold">
          {readyItems.length} MÓN ĐANG CHỜ
        </div>
      </div>

      {/* Ready Items List */}
      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="space-y-2 pt-1">
          {readyItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface/30 border border-border"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-text text-base block leading-snug">
                    {item.menuItemName}
                  </span>
                  <span className="w-8 h-8 rounded-lg bg-surface border border-border text-primary flex items-center justify-center font-black text-sm shrink-0">
                    x{item.quantity}
                  </span>
                </div>

                {item.note && (
                  <p className="text-xs font-semibold text-amber-800 mt-1 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                    Ghi chú: {item.note}
                  </p>
                )}
              </div>

              {/* Status Badge: Read-only for Kitchen */}
              <div className="shrink-0">
                <span className="px-3 py-1.5 rounded-lg bg-status-ready/15 text-status-ready border border-status-ready/30 text-xs font-bold">
                  Chờ phục vụ bưng ra
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-surface/40 p-4 border-t border-border flex items-center justify-between gap-3 mt-auto">
        <span className="text-xs text-muted">
          Tổng: <strong>{readyItems.reduce((s, i) => s + i.quantity, 0)}</strong> suất tại quầy
        </span>
        <span className="text-xs text-muted font-medium">
          Đang đợi nhân viên phục vụ
        </span>
      </div>
    </div>
  )
}
export default KitchenReadyTableCard
