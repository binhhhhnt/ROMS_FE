import { useState } from 'react'
import { Printer } from 'lucide-react'
import type { KitchenOrderResponse } from '@/features/kitchen/types/kitchen.types'
import type { OrderItemStatus } from '@/features/ordering/types/ordering.types'
import { useKdsSettingsStore } from '@/features/kitchen/store/kdsSettingsStore'
import { Button } from '@/shared/components/ui/button'

interface KitchenCookingOrderCardProps {
  order: KitchenOrderResponse
  onUpdateItemStatus: (
    orderId: number,
    itemId: number,
    targetStatus: OrderItemStatus
  ) => Promise<void>
  onReadyAll?: (orderId: number) => Promise<void>
  onCookAll?: (orderId: number) => Promise<void>
  onPrintOrderTicket?: (order: KitchenOrderResponse) => void
}

export function KitchenCookingOrderCard({
  order,
  onUpdateItemStatus,
  onReadyAll,
  onCookAll,
  onPrintOrderTicket,
}: KitchenCookingOrderCardProps) {
  const [updatingItemIds, setUpdatingItemIds] = useState<Set<number>>(new Set())
  const [isFinishingAll, setIsFinishingAll] = useState(false)
  const overdueMinutes = useKdsSettingsStore((s) => s.overdueMinutes)

  const handleUpdateItem = async (
    itemId: number,
    targetStatus: OrderItemStatus
  ) => {
    setUpdatingItemIds((prev) => new Set(prev).add(itemId))
    try {
      await onUpdateItemStatus(order.id, itemId, targetStatus)
    } finally {
      setUpdatingItemIds((prev) => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  // Calculate elapsed cooking time
  const elapsedMinutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)
  )

  const isCookingLong = elapsedMinutes >= overdueMinutes

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
  const pendingItems = order.items.filter((i) => i.status === 'PENDING')
  const hasPendingItems = pendingItems.length > 0
  const readyItems = order.items.filter((i) => i.status === 'READY')
  const isAllReady = cookingItems.length === 0 && readyItems.length > 0

  // Cook all pending items in this order -> move to COOKING
  const handleCookAllItems = async () => {
    setIsFinishingAll(true)
    try {
      if (onCookAll) {
        await onCookAll(order.id)
      } else {
        for (const item of pendingItems) {
          await onUpdateItemStatus(order.id, item.id, 'COOKING')
        }
      }
    } finally {
      setIsFinishingAll(false)
    }
  }

  // Finish all COOKING items in this order -> move to READY
  const handleFinishAllItems = async () => {
    setIsFinishingAll(true)
    try {
      if (onReadyAll) {
        await onReadyAll(order.id)
      } else {
        const currentlyCooking = order.items.filter((i) => i.status === 'COOKING')
        for (const item of currentlyCooking) {
          await onUpdateItemStatus(order.id, item.id, 'READY')
        }
      }
    } finally {
      setIsFinishingAll(false)
    }
  }

  const isOverdue = !isAllReady && isCookingLong

  return (
    <div
      className={`border rounded-lg overflow-hidden flex flex-col transition-colors ${
        isAllReady
          ? 'bg-card border-border border-t-4 border-t-status-ready'
          : isOverdue
            ? 'bg-red-50 border-red-400 border-t-4 border-t-red-600 shadow-sm'
            : 'bg-card border-border'
      }`}
    >
      {/* Header (Hàng cha) */}
      <div
        className={`px-4 py-3 border-b flex items-center justify-between gap-3 ${
          isOverdue
            ? 'bg-red-100/70 border-red-200'
            : 'bg-surface/60 border-border'
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-base text-text">
              {order.tableCode ? `Bàn ${order.tableCode}` : `Bàn #${order.tableId}`}
            </span>
          </div>
          <div className="text-xs text-muted mt-0.5">
            Bắt đầu lúc {formatTime(order.createdAt)}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onPrintOrderTicket && cookingItems.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPrintOrderTicket(order)}
              className="h-7 px-2 text-xs bg-card"
              title="In lại phiếu order vào bếp"
            >
              <Printer className="w-3.5 h-3.5" />
            </Button>
          )}

          {/* Elapsed Timer Badge */}
          <span
            className={`px-2.5 py-0.5 rounded-md text-xs font-medium border shrink-0 ${
              isAllReady
                ? 'bg-status-ready/15 text-status-ready border-status-ready/35'
                : isOverdue
                  ? 'bg-red-600 text-white border-red-700 font-semibold'
                  : 'bg-card text-muted border-border'
            }`}
          >
            {isAllReady
              ? 'Đã xong toàn bộ'
              : isOverdue
                ? `Quá giờ • ${elapsedMinutes} phút`
                : `Đã nhận ${elapsedMinutes} phút`}
          </span>
        </div>
      </div>

      {/* Dishes List */}
      <div className={`divide-y flex-1 ${isOverdue ? 'divide-red-200 bg-red-50/50' : 'divide-border bg-card'}`}>
        {cookingItems.length === 0 ? (
          <div className="text-center py-8 px-4 text-xs font-medium text-status-ready">
            Tất cả món đã nấu xong ({readyItems.length} món đã chuyển sang quầy chờ bưng)
          </div>
        ) : (
          cookingItems.map((item) => (
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
                {item.status === 'PENDING' ? (
                  <Button
                    type="button"
                    variant="cooking"
                    size="sm"
                    onClick={() => handleUpdateItem(item.id, 'COOKING')}
                    disabled={isFinishingAll || updatingItemIds.has(item.id)}
                    className="h-9 px-3.5 text-xs font-semibold"
                    title="Bắt đầu nấu món này"
                  >
                    Nấu
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ready"
                    size="sm"
                    onClick={() => handleUpdateItem(item.id, 'READY')}
                    disabled={isFinishingAll || updatingItemIds.has(item.id)}
                    className="h-9 px-3.5 text-xs font-semibold"
                    title="Báo món đã nấu xong và chuyển ra quầy"
                  >
                    Ra món
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Card Footer */}
      <div className="bg-card px-4 py-3 border-t border-border mt-auto">
        {cookingItems.length > 0 ? (
          hasPendingItems ? (
            <Button
              type="button"
              variant="cooking"
              onClick={handleCookAllItems}
              disabled={isFinishingAll || updatingItemIds.size > 0}
              className="w-full h-11 text-sm font-semibold"
            >
              Nấu tất cả
            </Button>
          ) : (
            <Button
              type="button"
              variant="ready"
              onClick={handleFinishAllItems}
              disabled={isFinishingAll || updatingItemIds.size > 0}
              className="w-full h-11 text-sm font-semibold"
            >
              Ra tất cả
            </Button>
          )
        ) : (
          <div className="text-center text-xs font-medium text-status-ready py-1">
            Toàn bộ món đã nấu xong &amp; chuyển ra quầy chờ bưng
          </div>
        )}
      </div>
    </div>
  )
}
export default KitchenCookingOrderCard
