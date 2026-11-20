import { UtensilsCrossed, Clock } from 'lucide-react'
import type { OrderItemStatus } from '@/features/ordering/types/ordering.types'
import { Button } from '@/shared/components/ui/button'
import type { ConsolidatedDish, ConsolidatedTableItem } from './KitchenSummaryDishCard'

interface KitchenSummaryTableBreakdownProps {
  dish: ConsolidatedDish | null
  updatingItemIds: Set<number>
  isDishBatchProcessing: boolean
  onUpdateItemStatus: (
    orderId: number,
    itemId: number,
    targetStatus: OrderItemStatus
  ) => Promise<void>
}

export function KitchenSummaryTableBreakdown({
  dish,
  updatingItemIds,
  isDishBatchProcessing,
  onUpdateItemStatus,
}: KitchenSummaryTableBreakdownProps) {

  if (!dish) {
    return (
      <div className="h-full bg-card border border-dashed border-border rounded-lg p-12 flex flex-col items-center justify-center text-center">
        <UtensilsCrossed className="w-8 h-8 text-muted/60 mb-3" />
        <h3 className="font-semibold text-sm text-text mb-1">
          Chưa chọn món ăn
        </h3>
        <p className="text-xs text-muted max-w-sm leading-relaxed">
          Chọn một món ăn ở danh sách bên trái để xem chi tiết từng bàn đang gọi món này.
        </p>
      </div>
    )
  }

  const formatTime = (isoString?: string) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const calculateMinutesAgo = (isoString?: string) => {
    if (!isoString) return 0
    return Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 60000))
  }

  return (
    <div className="bg-card border border-border rounded-lg flex flex-col overflow-hidden h-full">
      {/* Header (Hàng cha: bg-surface/60) */}
      <div className="px-4 py-3 sm:px-5 bg-surface/60 border-b border-border flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="font-semibold text-primary">Chi tiết theo bàn</span>
            <span>•</span>
            <span>{dish.tableItems.length} bàn</span>
          </div>
          <h2 className="text-lg font-bold text-text mt-0.5 truncate">
            {dish.menuItemName}
          </h2>
        </div>

        <div className="text-right shrink-0 tabular-nums">
          <div className="text-xs text-muted">Tổng</div>
          <div className="text-xl font-bold text-primary font-mono">
            {dish.totalQuantity} <span className="text-xs font-medium text-muted">suất</span>
          </div>
        </div>
      </div>

      {/* Table Items List (Hàng con: nền trắng, divide-y) */}
      <div className="divide-y divide-border bg-card flex-1 overflow-y-auto">
        {dish.tableItems.map((item: ConsolidatedTableItem) => {
          const minutesAgo = calculateMinutesAgo(item.createdAt)
          const isUrgent = minutesAgo >= 15

          return (
            <div
              key={`${item.orderId}-${item.itemId}`}
              className="px-4 py-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              {/* Left: Quantity Anchor + Table + Time + Notes */}
              <div className="min-w-0 flex-1 flex items-start gap-3">
                <span className="font-mono font-bold text-base text-text shrink-0 w-9 pt-0.5 tabular-nums">
                  {item.quantity}x
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm text-text">
                      {item.tableCode ? `Bàn ${item.tableCode}` : `Bàn #${item.tableId}`}
                    </span>
                    <span className="text-xs font-mono text-muted">
                      Đơn #{item.orderId}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
                    <span className="inline-flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 shrink-0" />
                      {formatTime(item.createdAt)}
                    </span>
                    <span>•</span>
                    <span className={isUrgent ? 'text-status-cancelled font-semibold' : ''}>
                      {minutesAgo} phút trước
                    </span>
                  </div>

                  {item.note && (
                    <p className="text-xs text-text mt-1">
                      <span className="font-semibold">Ghi chú:</span> {item.note}
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Action Button */}
              <div className="shrink-0 flex items-center justify-end pl-12 sm:pl-0">
                {item.status === 'PENDING' ? (
                  <Button
                    type="button"
                    variant="cooking"
                    size="sm"
                    onClick={() => onUpdateItemStatus(item.orderId, item.itemId, 'COOKING')}
                    disabled={isDishBatchProcessing || updatingItemIds.has(item.itemId)}
                    className="h-9 px-3.5 text-xs font-semibold"
                    title="Nhận nấu cho bàn này"
                  >
                    Nấu
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ready"
                    size="sm"
                    onClick={() => onUpdateItemStatus(item.orderId, item.itemId, 'READY')}
                    disabled={isDishBatchProcessing || updatingItemIds.has(item.itemId)}
                    className="h-9 px-3.5 text-xs font-semibold"
                    title="Ra món cho bàn này"
                  >
                    Ra món
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
export default KitchenSummaryTableBreakdown
