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
    <div className={`bg-slate-800 border rounded-2xl shadow-lg overflow-hidden flex flex-col transition-all ${
      isLongWait
        ? 'border-amber-500/80 ring-2 ring-amber-500/30'
        : 'border-slate-700 hover:border-sky-500/60'
    }`}>
      {/* Card Header */}
      <div className="bg-slate-950/70 p-4 border-b border-slate-700/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-sky-400 font-black text-lg">
            {order.tableCode || `T${order.tableId}`}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-white">
                {order.tableCode ? `Bàn ${order.tableCode}` : `Bàn #${order.tableId}`}
              </span>
              <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                #{order.id}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Nhận lúc: {formatTime(order.createdAt)}
            </div>
          </div>
        </div>

        {/* Wait Time Badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold ${
          isLongWait
            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
            : 'bg-slate-800 text-slate-300 border border-slate-700'
        }`}>
          <Clock className="w-3.5 h-3.5" />
          <span>{waitMinutes === 0 ? 'Vừa tới' : `${waitMinutes} phút`}</span>
        </div>
      </div>

      {/* Long Wait Alert */}
      {isLongWait && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-1.5 text-xs text-amber-300 font-semibold flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Đơn đã chờ trên {waitMinutes} phút — Vui lòng ưu tiên nhận nấu!</span>
        </div>
      )}

      {/* Dishes List */}
      <div className="p-4 flex-1 divide-y divide-slate-700/60 flex flex-col gap-2">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>Danh sách món ({order.items.length} món)</span>
          <span className="text-sky-400">
            Tổng SL: {order.items.reduce((sum, i) => sum + i.quantity, 0)}
          </span>
        </div>

        <div className="space-y-3 pt-2">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 text-sm p-2 rounded-lg bg-slate-900/50 border border-slate-800/80"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-base">
                    {item.menuItemName}
                  </span>
                </div>

                {item.note && (
                  <p className="text-xs font-semibold text-amber-400 mt-1 flex items-center gap-1.5 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span>Ghi chú: {item.note}</span>
                  </p>
                )}
              </div>

              {/* Big Quantity Pill for Kitchen */}
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-300 flex items-center justify-center font-black text-lg shrink-0">
                &times;{item.quantity}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="bg-slate-950/80 p-4 border-t border-slate-700 flex items-center gap-3 mt-auto">
        <Link to={`/kitchen/orders/${order.id}`} className="shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-11 px-3 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
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
          className="flex-1 h-11 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
