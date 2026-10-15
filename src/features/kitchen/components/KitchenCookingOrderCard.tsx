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
    <div className={`bg-slate-800 border rounded-2xl shadow-lg overflow-hidden flex flex-col transition-all ${
      isAllReady
        ? 'border-emerald-500/80 ring-2 ring-emerald-500/30'
        : isCookingLong
        ? 'border-amber-500/80 ring-2 ring-amber-500/30'
        : 'border-slate-700 hover:border-sky-500/60'
    }`}>
      {/* Header */}
      <div className="bg-slate-950/80 p-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-sky-400 font-black text-lg shadow-inner">
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
              Bắt đầu: {formatTime(order.createdAt)}
            </div>
          </div>
        </div>

        {/* Elapsed Timer Badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold ${
          isAllReady
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            : isCookingLong
            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
            : 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
        }`}>
          {isAllReady ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>ĐÃ XONG CẢ ĐƠN</span>
            </>
          ) : (
            <>
              <Flame className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              <span>Đã nấu: {elapsedMinutes} phút</span>
            </>
          )}
        </div>
      </div>

      {/* Dishes List */}
      <div className="p-4 flex-1 divide-y divide-slate-700/60 flex flex-col gap-2">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>Tiến độ món ({readyItems.length}/{order.items.length} món xong)</span>
          <span className="text-sky-400">
            Tổng SL: {order.items.reduce((sum, i) => sum + i.quantity, 0)}
          </span>
        </div>

        <div className="space-y-3 pt-2">
          {order.items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${
                item.status === 'READY'
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-base ${
                    item.status === 'READY' ? 'text-emerald-300' : 'text-white'
                  }`}>
                    {item.menuItemName}
                  </span>
                  <span className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/30 text-sky-300 flex items-center justify-center font-black text-xs shrink-0">
                    &times;{item.quantity}
                  </span>
                </div>

                {item.note && (
                  <p className="text-xs font-semibold text-amber-400 mt-1 flex items-center gap-1.5 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    <FileText className="w-3 h-3 shrink-0" />
                    <span>Ghi chú: {item.note}</span>
                  </p>
                )}
              </div>

              {/* Status Action Button */}
              <div className="shrink-0">
                {item.status === 'READY' ? (
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center gap-1">
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
                    className="h-10 px-3.5 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-amber-300 font-bold text-xs rounded-xl border border-slate-600 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {updatingItemId === item.id ? (
                      <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
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
                    className="h-10 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-colors disabled:opacity-60"
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
      <div className="bg-slate-950/80 p-4 border-t border-slate-700 flex items-center justify-between gap-3 mt-auto">
        <Link to={`/kitchen/orders/${order.id}`}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-10 px-3 border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
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
            className="h-10 px-4 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-colors cursor-pointer disabled:opacity-60"
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
