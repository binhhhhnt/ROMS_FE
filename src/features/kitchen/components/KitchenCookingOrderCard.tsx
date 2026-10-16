import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Flame,
  CheckCircle2,
  FileText,
  ChevronRight,
  CheckCheck,
} from 'lucide-react'
import type { KitchenOrderResponse } from '@/features/kitchen/types/kitchen.types'
import type { OrderItemStatus } from '@/features/ordering/types/ordering.types'
import { Button } from '@/shared/components/ui/button'

interface KitchenCookingOrderCardProps {
  order: KitchenOrderResponse
  onUpdateItemStatus: (
    orderId: number,
    itemId: number,
    targetStatus: OrderItemStatus
  ) => Promise<void>
}

export function KitchenCookingOrderCard({
  order,
  onUpdateItemStatus,
}: KitchenCookingOrderCardProps) {
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null)
  const [isFinishingAll, setIsFinishingAll] = useState(false)

  // Calculate elapsed cooking time
  const elapsedMinutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)
  )

  const isCookingLong = elapsedMinutes >= 15

  const formatTime = (isoString?: string) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  // Count items by status
  const cookingItems = order.items.filter(
    (i) => i.status === 'COOKING' || i.status === 'PENDING'
  )
  const readyItems = order.items.filter((i) => i.status === 'READY')
  const isAllReady = cookingItems.length === 0 && readyItems.length > 0

  // Finish all remaining cooking items in this order
  const handleFinishAllItems = async () => {
    setIsFinishingAll(true)
    try {
      for (const item of cookingItems) {
        await onUpdateItemStatus(order.id, item.id, 'READY')
      }
    } finally {
      setIsFinishingAll(false)
    }
  }

  return (
    <div className={`bg-card border rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all ${
      isAllReady
        ? 'border-emerald-500 ring-2 ring-emerald-500/20'
        : isCookingLong
        ? 'border-amber-500 ring-2 ring-amber-500/20'
        : 'border-border hover:border-primary/40'
    }`}>
      {/* Header */}
      <div className="bg-surface/40 p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center text-primary font-black text-lg shadow-xs">
            {order.tableCode || `T${order.tableId}`}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-text">
                {order.tableCode ? `Bàn ${order.tableCode}` : `Bàn #${order.tableId}`}
              </span>
              <span className="text-xs font-bold text-muted bg-surface px-2 py-0.5 rounded">
                #{order.id}
              </span>
            </div>
            <div className="text-xs text-muted mt-0.5">
              Bắt đầu: {formatTime(order.createdAt)}
            </div>
          </div>
        </div>

        {/* Elapsed Timer Badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold ${
          isAllReady
            ? 'bg-status-ready/15 text-status-ready border border-status-ready/30'
            : isCookingLong
            ? 'bg-status-cancelled/15 text-status-cancelled border border-status-cancelled/30 animate-pulse'
            : 'bg-status-cooking/15 text-status-cooking border border-status-cooking/30'
        }`}>
          {isAllReady ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-status-ready" />
              <span>ĐÃ XONG CẢ ĐƠN</span>
            </>
          ) : (
            <>
              <Flame className="w-3.5 h-3.5 animate-pulse text-status-cooking" />
              <span>Đã nấu: {elapsedMinutes} phút</span>
            </>
          )}
        </div>
      </div>

      {/* Dishes List */}
      <div className="p-4 flex-1 divide-y divide-border flex flex-col gap-2">
        <div className="text-xs font-bold text-muted uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>Tiến độ món ({readyItems.length}/{order.items.length} món xong)</span>
          <span className="text-accent font-semibold">
            Tổng SL: {order.items.reduce((sum, i) => sum + i.quantity, 0)}
          </span>
        </div>

        <div className="space-y-3 pt-2">
          {order.items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${
                item.status === 'READY'
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : 'bg-background border-border'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-base ${
                    item.status === 'READY' ? 'text-status-ready' : 'text-text'
                  }`}>
                    {item.menuItemName}
                  </span>
                  <span className="w-7 h-7 rounded-lg bg-surface border border-border text-primary flex items-center justify-center font-black text-xs shrink-0">
                    &times;{item.quantity}
                  </span>
                </div>

                {item.note && (
                  <p className="text-xs font-semibold text-amber-700 mt-1 flex items-center gap-1.5 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <FileText className="w-3 h-3 shrink-0" />
                    <span>Ghi chú: {item.note}</span>
                  </p>
                )}
              </div>

              {/* Status Action Button */}
              <div className="shrink-0">
                {item.status === 'READY' ? (
                  <span className="px-3 py-1.5 rounded-lg bg-status-ready/15 text-status-ready border border-status-ready/30 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đã xong</span>
                  </span>
                ) : item.status === 'PENDING' ? (
                  <button
                    type="button"
                    onClick={async () => {
                      setUpdatingItemId(item.id)
                      try {
                        await onUpdateItemStatus(order.id, item.id, 'COOKING')
                      } finally {
                        setUpdatingItemId(null)
                      }
                    }}
                    disabled={updatingItemId === item.id}
                    className="h-10 px-3.5 bg-surface hover:bg-surface-hover active:bg-surface text-status-cooking font-bold text-xs rounded-xl border border-border flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {updatingItemId === item.id ? (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Flame className="w-4 h-4" />
                        <span>Bắt đầu</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      setUpdatingItemId(item.id)
                      try {
                        await onUpdateItemStatus(order.id, item.id, 'READY')
                      } finally {
                        setUpdatingItemId(null)
                      }
                    }}
                    disabled={updatingItemId === item.id}
                    className="h-10 px-4 bg-status-ready hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors disabled:opacity-60"
                  >
                    {updatingItemId === item.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Xong món</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card Footer */}
      <div className="bg-surface/30 p-4 border-t border-border flex items-center justify-between gap-3 mt-auto">
        <Link to={`/kitchen/orders/${order.id}`}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-10 px-3 border-border bg-card text-text hover:bg-surface"
          >
            <span>Chi tiết</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Link>

        {/* Finish All Button if multiple items are cooking */}
        {cookingItems.length > 0 && (
          <button
            type="button"
            onClick={handleFinishAllItems}
            disabled={isFinishingAll}
            className="h-10 px-4 bg-accent hover:bg-accent-hover active:bg-accent text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
          >
            {isFinishingAll ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCheck className="w-4 h-4" />
                <span>Xong tất cả ({cookingItems.length})</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
