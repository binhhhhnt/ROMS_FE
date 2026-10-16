import { useState } from 'react'
import {
  BellRing,
  CheckCircle2,
  FileText,
  CheckCheck,
} from 'lucide-react'
import type { KitchenOrderResponse } from '@/features/kitchen/types/kitchen.types'
import type { OrderItemResponse } from '@/features/ordering/types/ordering.types'

interface KitchenReadyTableCardProps {
  order: KitchenOrderResponse
  readyItems: OrderItemResponse[]
  onCompleteItem: (orderId: number, itemId: number) => Promise<void>
}

export function KitchenReadyTableCard({
  order,
  readyItems,
  onCompleteItem,
}: KitchenReadyTableCardProps) {
  const [completingItemId, setCompletingItemId] = useState<number | null>(null)
  const [isCompletingAll, setIsCompletingAll] = useState(false)

  const handleCompleteAll = async () => {
    setIsCompletingAll(true)
    try {
      for (const item of readyItems) {
        await onCompleteItem(order.id, item.id)
      }
    } finally {
      setIsCompletingAll(false)
    }
  }

  const formatTime = (isoString?: string) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <div className="bg-card border-2 border-status-ready/40 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all hover:border-status-ready">
      {/* Header with Table Badge */}
      <div className="bg-emerald-50/60 p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-status-ready/15 border border-status-ready/30 flex items-center justify-center text-status-ready font-black text-xl shadow-xs">
            {order.tableCode || `T${order.tableId}`}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-text">
                {order.tableCode ? `Bàn ${order.tableCode}` : `Bàn #${order.tableId}`}
              </span>
              <span className="text-xs font-bold text-muted bg-surface px-2 py-0.5 rounded border border-border">
                Đơn #{order.id}
              </span>
            </div>
            <div className="text-xs text-muted mt-0.5">
              Xong lúc: {formatTime(order.updatedAt || order.createdAt)}
            </div>
          </div>
        </div>

        {/* Ready Badge with Bounce Bell */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-status-ready text-white text-xs font-black shadow-xs">
          <BellRing className="w-4 h-4 animate-bounce" />
          <span>{readyItems.length} MÓN CẦN BƯNG</span>
        </div>
      </div>

      {/* Ready Items List */}
      <div className="p-4 flex-1 divide-y divide-border flex flex-col gap-2">
        <div className="space-y-3">
          {readyItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-background border border-border hover:border-status-ready/40 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-text text-base truncate">
                    {item.menuItemName}
                  </span>
                  <span className="w-7 h-7 rounded-lg bg-surface border border-border text-primary flex items-center justify-center font-black text-xs shrink-0">
                    &times;{item.quantity}
                  </span>
                </div>

                {item.note && (
                  <p className="text-xs font-semibold text-amber-700 mt-1 flex items-center gap-1.5 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span>Ghi chú: {item.note}</span>
                  </p>
                )}
              </div>

              {/* Mark Completed Single Item */}
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    setCompletingItemId(item.id)
                    try {
                      await onCompleteItem(order.id, item.id)
                    } finally {
                      setCompletingItemId(null)
                    }
                  }}
                  disabled={completingItemId === item.id}
                  className="h-10 px-3.5 bg-status-ready hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors disabled:opacity-60"
                  title="Xác nhận đã bưng món này ra bàn"
                >
                  {completingItemId === item.id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Đã bưng</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Action: Complete All for Table */}
      <div className="bg-surface/30 p-4 border-t border-border flex items-center justify-between gap-3 mt-auto">
        <span className="text-xs text-muted">
          Tổng cộng: <strong>{readyItems.reduce((s, i) => s + i.quantity, 0)}</strong> suất ăn
        </span>

        {readyItems.length > 1 && (
          <button
            type="button"
            onClick={handleCompleteAll}
            disabled={isCompletingAll}
            className="h-10 px-4 bg-primary hover:bg-primary-hover active:bg-primary text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
          >
            {isCompletingAll ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCheck className="w-4 h-4" />
                <span>Bưng tất cả cho bàn ({readyItems.length})</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
