import { useState } from 'react'
import { UtensilsCrossed, Clock, CheckCircle2 } from 'lucide-react'
import type { OrderItemStatus } from '@/features/ordering/types/ordering.types'
import type { ConsolidatedDish, ConsolidatedTableItem } from './KitchenSummaryDishCard'

interface KitchenSummaryTableBreakdownProps {
  dish: ConsolidatedDish | null
  onUpdateItemStatus: (
    orderId: number,
    itemId: number,
    targetStatus: OrderItemStatus
  ) => Promise<void>
}

export function KitchenSummaryTableBreakdown({
  dish,
  onUpdateItemStatus,
}: KitchenSummaryTableBreakdownProps) {
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null)

  if (!dish) {
    return (
      <div className="h-full bg-card border border-dashed border-border rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center text-muted mb-4 shadow-xs">
          <UtensilsCrossed className="w-8 h-8 opacity-60" />
        </div>
        <h3 className="font-bold text-base text-text mb-1">
          Chưa chọn món ăn
        </h3>
        <p className="text-xs text-muted max-w-sm leading-relaxed">
          Vui lòng bấm chọn một món ăn ở danh sách bên trái để theo dõi chi tiết danh sách từng bàn đang gọi món này.
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
    <div className="bg-card border border-border rounded-2xl flex flex-col shadow-xs overflow-hidden h-full">
      {/* Header */}
      <div className="p-4 sm:p-5 bg-surface/50 border-b border-border flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Chi tiết theo bàn
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface border border-border text-muted">
              {dish.tableItems.length} bàn
            </span>
          </div>
          <h2 className="text-xl font-black text-text mt-1">
            {dish.menuItemName}
          </h2>
        </div>

        <div className="text-right shrink-0">
          <div className="text-[10px] text-muted font-bold uppercase tracking-wider">
            Tổng số lượng
          </div>
          <div className="text-2xl font-black text-primary font-mono">
            {dish.totalQuantity} <span className="text-xs font-bold text-muted">suất</span>
          </div>
        </div>
      </div>

      {/* Table Items List */}
      <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3">
        {dish.tableItems.map((item: ConsolidatedTableItem) => {
          const minutesAgo = calculateMinutesAgo(item.createdAt)
          const isUrgent = minutesAgo >= 15

          return (
            <div
              key={`${item.orderId}-${item.itemId}`}
              className="p-4 rounded-xl border border-border bg-surface/30 hover:bg-surface/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
            >
              {/* Left Column: Table Badge, Time, and Notes */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center font-black text-sm text-primary shadow-xs">
                    {item.tableCode || `T${item.tableId}`}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-text">
                        {item.tableCode ? `Bàn ${item.tableCode}` : `Bàn #${item.tableId}`}
                      </span>
                      <span className="text-xs font-semibold text-muted bg-surface px-2 py-0.5 rounded border border-border/50">
                        Đơn #{item.orderId}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {formatTime(item.createdAt)}
                      </span>
                      <span>•</span>
                      <span className={isUrgent ? 'text-status-cooking font-bold' : ''}>
                        {minutesAgo} phút trước
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Note */}
                {item.note && (
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mt-2 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20 max-w-lg">
                    Ghi chú: {item.note}
                  </p>
                )}
              </div>

              {/* Right Column: Quantity & Action Button */}
              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
                <div className="text-right">
                  <div className="text-base font-black text-text font-mono">
                    x{item.quantity} <span className="text-xs font-medium text-muted">suất</span>
                  </div>
                </div>

                {/* 1 Button Duy Nhất Chuyển Đổi Trạng Thái: Chờ nấu -> Nấu -> Ra món */}
                <div className="shrink-0">
                  {item.status === 'PENDING' ? (
                    <button
                      type="button"
                      onClick={async () => {
                        setUpdatingItemId(item.itemId)
                        try {
                          await onUpdateItemStatus(item.orderId, item.itemId, 'COOKING')
                        } finally {
                          setUpdatingItemId(null)
                        }
                      }}
                      disabled={updatingItemId === item.itemId}
                      className="h-10 px-4 bg-status-cooking/10 hover:bg-status-cooking/20 active:bg-status-cooking/30 text-status-cooking font-bold text-xs rounded-xl border border-status-cooking/30 cursor-pointer disabled:opacity-60 transition-colors shadow-xs"
                      title="Nhận nấu cho bàn này"
                    >
                      {updatingItemId === item.itemId ? 'Đang lưu...' : 'Nấu'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        setUpdatingItemId(item.itemId)
                        try {
                          await onUpdateItemStatus(item.orderId, item.itemId, 'READY')
                        } finally {
                          setUpdatingItemId(null)
                        }
                      }}
                      disabled={updatingItemId === item.itemId}
                      className="h-10 px-4 bg-status-ready hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer disabled:opacity-60 transition-colors flex items-center gap-1"
                      title="Ra món cho bàn này"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{updatingItemId === item.itemId ? 'Đang lưu...' : 'Ra món'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
export default KitchenSummaryTableBreakdown
