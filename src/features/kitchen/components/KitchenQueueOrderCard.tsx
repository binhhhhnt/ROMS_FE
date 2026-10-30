import { useState } from 'react'
import type { KitchenOrderResponse } from '@/features/kitchen/types/kitchen.types'
import type { OrderItemResponse } from '@/features/ordering/types/ordering.types'

interface KitchenQueueOrderCardProps {
  order: KitchenOrderResponse
  pendingItems: OrderItemResponse[]
  onAcceptItem: (orderId: number, itemId: number) => Promise<void>
  onAcceptAll: (orderId: number, items: OrderItemResponse[]) => Promise<void>
}

export function KitchenQueueOrderCard({
  order,
  pendingItems,
  onAcceptItem,
  onAcceptAll,
}: KitchenQueueOrderCardProps) {
  const [acceptingItemId, setAcceptingItemId] = useState<number | null>(null)
  const [isAcceptingAll, setIsAcceptingAll] = useState(false)

  const handleAcceptItem = async (itemId: number) => {
    setAcceptingItemId(itemId)
    try {
      await onAcceptItem(order.id, itemId)
    } finally {
      setAcceptingItemId(null)
    }
  }

  const handleAcceptAll = async () => {
    setIsAcceptingAll(true)
    try {
      await onAcceptAll(order.id, pendingItems)
    } finally {
      setIsAcceptingAll(false)
    }
  }

  // Calculate waiting time in minutes
  const waitMinutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)
  )

  const isLongWait = waitMinutes >= 10

  const formatTime = (isoString?: string) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date)
  }

  return (
    <div
      className={`bg-card border rounded-2xl shadow-xs overflow-hidden flex flex-col transition-all ${
        isLongWait
          ? 'border-status-pending ring-1 ring-status-pending/40'
          : 'border-border'
      }`}
    >
      {/* Card Header: Big Table & Wait Time */}
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
              Gửi lúc {formatTime(order.createdAt)}
            </div>
          </div>
        </div>

        {/* Wait Time Badge */}
        <div
          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
            isLongWait
              ? 'bg-status-pending/20 text-status-pending border border-status-pending/40'
              : 'bg-surface text-muted border border-border'
          }`}
        >
          {waitMinutes === 0 ? 'Vừa tới' : `Chờ ${waitMinutes} phút`}
        </div>
      </div>

      {/* Dishes List */}
      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="text-xs font-bold text-muted uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>{pendingItems.length} món đang chờ</span>
          <span className="text-primary font-bold">
            Tổng {pendingItems.reduce((sum, i) => sum + i.quantity, 0)} suất
          </span>
        </div>

        <div className="space-y-2.5 pt-1">
          {pendingItems.map((item) => (
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

              {/* Action Button: Nấu món này */}
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => handleAcceptItem(item.id)}
                  disabled={acceptingItemId === item.id || isAcceptingAll}
                  className="h-9 px-3.5 bg-primary hover:bg-primary-hover active:bg-primary text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors disabled:opacity-60"
                >
                  {acceptingItemId === item.id ? 'Đang lưu...' : 'Nấu món'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card Action Footer: Accept All Pending Dishes in this order */}
      <div className="bg-surface/40 p-4 border-t border-border mt-auto">
        <button
          type="button"
          onClick={handleAcceptAll}
          disabled={isAcceptingAll || acceptingItemId !== null}
          className="w-full h-11 bg-primary hover:bg-primary-hover active:bg-primary text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
        >
          {isAcceptingAll ? (
            <span>Đang lưu...</span>
          ) : (
            <span>Nhận tất cả món vào nấu ({pendingItems.length})</span>
          )}
        </button>
      </div>
    </div>
  )
}
export default KitchenQueueOrderCard
