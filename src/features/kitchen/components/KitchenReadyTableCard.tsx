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
    <div className="bg-slate-800 border-2 border-emerald-500/60 rounded-2xl shadow-xl overflow-hidden flex flex-col transition-all hover:border-emerald-400">
      {/* Header with Table Badge */}
      <div className="bg-emerald-500/15 p-4 border-b border-emerald-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-xl shadow-inner">
            {order.tableCode || `T${order.tableId}`}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-white">
                {order.tableCode ? `Bàn ${order.tableCode}` : `Bàn #${order.tableId}`}
              </span>
              <span className="text-xs font-bold text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
                Đơn #{order.id}
              </span>
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              Xong lúc: {formatTime(order.updatedAt || order.createdAt)}
            </div>
          </div>
        </div>

        {/* Ready Badge with Bounce Bell */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-black shadow-sm">
          <BellRing className="w-4 h-4 animate-bounce" />
          <span>{readyItems.length} MÓN CẦN BƯNG</span>
        </div>
      </div>

      {/* Ready Items List */}
      <div className="p-4 flex-1 divide-y divide-slate-700/60 flex flex-col gap-2">
        <div className="space-y-3">
          {readyItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/70 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-base truncate">
                    {item.menuItemName}
                  </span>
                  <span className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center font-black text-xs shrink-0">
                    &times;{item.quantity}
                  </span>
                </div>

                {item.note && (
                  <p className="text-xs font-semibold text-amber-400 mt-1 flex items-center gap-1.5 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
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
                  className="h-10 px-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-colors disabled:opacity-60"
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
      <div className="bg-slate-950/80 p-4 border-t border-slate-700 flex items-center justify-between gap-3 mt-auto">
        <span className="text-xs text-slate-400">
          Tổng cộng: <strong>{readyItems.reduce((s, i) => s + i.quantity, 0)}</strong> suất ăn
        </span>

        {readyItems.length > 1 && (
          <button
            type="button"
            onClick={handleCompleteAll}
            disabled={isCompletingAll}
            className="h-10 px-4 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-colors cursor-pointer disabled:opacity-60"
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
