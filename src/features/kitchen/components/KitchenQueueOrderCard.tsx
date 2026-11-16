import { useState } from 'react'
import type { KitchenOrderResponse } from '@/features/kitchen/types/kitchen.types'
import type { OrderItemResponse } from '@/features/ordering/types/ordering.types'
import { Button } from '@/shared/components/ui/button'

interface KitchenQueueOrderCardProps {
  order: KitchenOrderResponse
  pendingItems: OrderItemResponse[]
  onAcceptItem: (orderId: number, itemId: number) => Promise<void>
  onAcceptAll: (orderId: number) => Promise<void>
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
      await onAcceptAll(order.id)
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
      className={`bg-card border border-border rounded-lg overflow-hidden flex flex-col ${
        isLongWait ? 'border-t-4 border-t-status-pending' : ''
      }`}
    >
      {/* Card Header (Hàng cha: bg-surface/60 tách biệt với danh sách món) */}
      <div className="bg-surface/60 px-4 py-3 border-b border-border flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-base text-text">
              {order.tableCode ? `Bàn ${order.tableCode}` : `Bàn #${order.tableId}`}
            </span>
            <span className="text-xs font-mono text-muted">
              #{order.id}
            </span>
          </div>
          <div className="text-xs text-muted mt-0.5">
            Gửi lúc {formatTime(order.createdAt)}
          </div>
        </div>

        {/* Wait Time Badge */}
        <span
          className={`px-2.5 py-0.5 rounded-md text-xs font-medium border shrink-0 ${
            isLongWait
              ? 'bg-status-pending/15 text-amber-700 dark:text-amber-400 border-status-pending/35'
              : 'bg-card text-muted border-border'
          }`}
        >
          {waitMinutes === 0 ? 'Vừa tới' : `Chờ ${waitMinutes} phút`}
        </span>
      </div>

      {/* Sub-header */}
      <div className="px-4 py-2 border-b border-border bg-card flex items-center justify-between text-xs text-muted">
        <span>{pendingItems.length} món đang chờ</span>
        <span className="font-semibold text-text tabular-nums">
          Tổng {pendingItems.reduce((sum, i) => sum + i.quantity, 0)} suất
        </span>
      </div>

      {/* Dishes List (Hàng con: nền trắng, divide-y, không lồng card) */}
      <div className="divide-y divide-border bg-card flex-1">
        {pendingItems.map((item) => (
          <div
            key={item.id}
            className="px-4 py-3 flex items-center justify-between gap-3"
          >
            <div className="min-w-0 flex-1 flex items-start gap-3">
              <span className="font-mono font-bold text-base text-text shrink-0 w-9 pt-0.5 tabular-nums">
                {item.quantity}x
              </span>
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-sm text-text block leading-snug">
                  {item.menuItemName}
                </span>
                {item.note && (
                  <p className="text-xs text-text mt-1">
                    <span className="font-semibold">Ghi chú:</span> {item.note}
                  </p>
                )}
              </div>
            </div>

            <div className="shrink-0">
              <Button
                type="button"
                variant="cooking"
                size="sm"
                onClick={() => handleAcceptItem(item.id)}
                disabled={acceptingItemId === item.id || isAcceptingAll}
                className="h-9 px-3.5 text-xs font-semibold"
              >
                Nấu
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Card Action Footer: Nấu tất cả */}
      <div className="bg-card px-4 py-3 border-t border-border mt-auto">
        <Button
          type="button"
          variant="cooking"
          onClick={handleAcceptAll}
          disabled={isAcceptingAll || acceptingItemId !== null}
          className="w-full h-11 text-sm font-semibold"
        >
          Nấu tất cả ({pendingItems.length} món)
        </Button>
      </div>
    </div>
  )
}
export default KitchenQueueOrderCard
