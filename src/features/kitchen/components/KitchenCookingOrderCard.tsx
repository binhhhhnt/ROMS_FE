import { useState } from 'react'
import type { KitchenOrderResponse } from '@/features/kitchen/types/kitchen.types'
import type { OrderItemStatus } from '@/features/ordering/types/ordering.types'

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

  // Finish all remaining cooking items in this order -> move to READY
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
    <div
      className={`bg-card border rounded-2xl shadow-xs overflow-hidden flex flex-col transition-all ${
        isAllReady
          ? 'border-status-ready/60 bg-status-ready/5'
          : isCookingLong
          ? 'border-status-cooking ring-1 ring-status-cooking/40'
          : 'border-border'
      }`}
    >
      {/* Header: Table, Order ID, and Elapsed Time */}
      <div className="bg-surface/50 p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center text-primary font-black text-xl">
            {order.tableCode || `T${order.tableId}`}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-text">
                {order.tableCode ? `Bàn ${order.tableCode}` : `Bàn #${order.tableId}`}
              </span>
              <span className="text-xs font-semibold text-muted bg-surface px-2 py-0.5 rounded">
                #{order.id}
              </span>
            </div>
            <div className="text-xs text-muted mt-0.5">
              Bắt đầu lúc {formatTime(order.createdAt)}
            </div>
          </div>
        </div>

        {/* Elapsed Timer Badge */}
        <div
          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
            isAllReady
              ? 'bg-status-ready/20 text-status-ready border border-status-ready/30'
              : isCookingLong
              ? 'bg-status-cooking/20 text-status-cooking border border-status-cooking/40'
              : 'bg-surface text-muted border border-border'
          }`}
        >
          {isAllReady ? 'Đã xong toàn bộ' : `Đã nấu ${elapsedMinutes} phút`}
        </div>
      </div>

      {/* Dishes List */}
      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="text-xs font-bold text-muted uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>
            Tiến độ: {readyItems.length}/{order.items.length} món xong
          </span>
          <span className="text-primary font-bold">
            Tổng {order.items.reduce((sum, i) => sum + i.quantity, 0)} suất
          </span>
        </div>

        <div className="space-y-2.5 pt-1">
          {order.items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${
                item.status === 'READY'
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : 'bg-surface/30 border-border'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold text-base block leading-snug ${
                      item.status === 'READY' ? 'text-status-ready' : 'text-text'
                    }`}
                  >
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

              {/* Status Action Button / Badge */}
              <div className="shrink-0">
                {item.status === 'READY' ? (
                  <span className="px-3 py-1.5 rounded-lg bg-status-ready/15 text-status-ready border border-status-ready/30 text-xs font-bold">
                    Đã ra quầy (Chờ bưng)
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
                    className="h-10 px-3.5 bg-surface hover:bg-surface-hover active:bg-surface text-status-cooking font-bold text-xs rounded-xl border border-border cursor-pointer disabled:opacity-60"
                  >
                    {updatingItemId === item.id ? 'Đang lưu...' : 'Nấu món'}
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
                    className="h-10 px-4 bg-status-ready hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors disabled:opacity-60"
                  >
                    {updatingItemId === item.id ? 'Đang lưu...' : 'Xong món (Ra quầy)'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card Footer: Touch Action */}
      <div className="bg-surface/40 p-4 border-t border-border mt-auto">
        {cookingItems.length > 0 ? (
          <button
            type="button"
            onClick={handleFinishAllItems}
            disabled={isFinishingAll}
            className="w-full h-11 bg-primary hover:bg-primary-hover active:bg-primary text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
          >
            {isFinishingAll ? (
              <span>Đang lưu...</span>
            ) : (
              <span>Xong tất cả món ({cookingItems.length})</span>
            )}
          </button>
        ) : (
          <div className="text-center text-xs font-bold text-status-ready py-1">
            Toàn bộ món đã nấu xong & chuyển ra quầy chờ bưng
          </div>
        )}
      </div>
    </div>
  )
}
export default KitchenCookingOrderCard
