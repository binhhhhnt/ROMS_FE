import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, ChefHat, Check, AlertCircle, FileText, ChevronRight } from 'lucide-react'
import type { KitchenOrderResponse } from '@/features/kitchen/types/kitchen.types'
import { Button } from '@/shared/components/ui/button'

interface KitchenQueueOrderCardProps {
  order: KitchenOrderResponse
  onAccept: (orderId: number) => Promise<void>
}

export function KitchenQueueOrderCard({
  order,
  onAccept,
}: KitchenQueueOrderCardProps) {
  const [isAccepting, setIsAccepting] = useState(false)

  const handleAccept = async () => {
    setIsAccepting(true)
    try {
      await onAccept(order.id)
    } finally {
      setIsAccepting(false)
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
    <div className={`bg-card border rounded-2xl shadow-xs overflow-hidden flex flex-col transition-all ${
      isLongWait
        ? 'border-status-pending/80 ring-2 ring-status-pending/30'
        : 'border-border hover:border-accent/60 hover:shadow-md'
    }`}>
      {/* Card Header */}
      <div className="bg-surface/40 p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center text-primary font-extrabold text-lg">
            {order.tableCode || `T${order.tableId}`}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-text">
                {order.tableCode ? `Bàn ${order.tableCode}` : `Bàn #${order.tableId}`}
              </span>
              <span className="text-xs font-semibold text-muted bg-surface/80 px-2 py-0.5 rounded">
                #{order.id}
              </span>
            </div>
            <div className="text-xs text-muted mt-0.5">
              Nhận lúc: {formatTime(order.createdAt)}
            </div>
          </div>
        </div>

        {/* Wait Time Badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
          isLongWait
            ? 'bg-status-pending/20 text-status-pending border border-status-pending/40 animate-pulse'
            : 'bg-surface text-muted border border-border'
        }`}>
          <Clock className="w-3.5 h-3.5" />
          <span>{waitMinutes === 0 ? 'Vừa tới' : `${waitMinutes} phút`}</span>
        </div>
      </div>

      {/* Long Wait Alert */}
      {isLongWait && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-xs text-status-pending font-semibold flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Đơn đã chờ trên {waitMinutes} phút — Vui lòng ưu tiên nhận nấu!</span>
        </div>
      )}

      {/* Dishes List */}
      <div className="p-4 flex-1 divide-y divide-border/60 flex flex-col gap-2">
        <div className="text-xs font-bold text-muted uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>Danh sách món ({order.items.length} món)</span>
          <span className="text-accent font-extrabold">
            Tổng SL: {order.items.reduce((sum, i) => sum + i.quantity, 0)}
          </span>
        </div>

        <div className="space-y-2.5 pt-2">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 text-sm p-2.5 rounded-xl bg-surface/20 border border-border/80"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-text text-base">
                    {item.menuItemName}
                  </span>
                </div>

                {item.note && (
                  <p className="text-xs font-semibold text-status-pending mt-1 flex items-center gap-1.5 bg-status-pending/10 px-2 py-0.5 rounded border border-status-pending/20">
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span>Ghi chú: {item.note}</span>
                  </p>
                )}
              </div>

              {/* Big Quantity Pill for Kitchen */}
              <div className="w-10 h-10 rounded-xl bg-surface border border-border text-primary flex items-center justify-center font-black text-lg shrink-0">
                &times;{item.quantity}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="bg-surface/30 p-4 border-t border-border flex items-center gap-3 mt-auto">
        <Link to={`/kitchen/orders/${order.id}`} className="shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-11 px-3 border-border bg-card text-text hover:bg-surface/50"
            title="Xem chi tiết order"
          >
            <span>Chi tiết</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Link>

        {/* Big Accept Button */}
        <button
          type="button"
          onClick={handleAccept}
          disabled={isAccepting}
          className="flex-1 h-11 bg-primary hover:bg-primary-hover active:bg-primary-active text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isAccepting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <ChefHat className="w-5 h-5" />
              <span>Nhận đơn vào nấu</span>
              <Check className="w-4 h-4 ml-1 opacity-80" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
