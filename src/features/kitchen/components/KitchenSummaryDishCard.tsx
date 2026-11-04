import { useState } from 'react'
import { Flame, Clock, ChevronRight } from 'lucide-react'

export interface ConsolidatedTableItem {
  orderId: number
  itemId: number
  tableId: number
  tableCode: string | null
  quantity: number
  status: 'PENDING' | 'COOKING' | 'READY' | 'COMPLETED' | 'CANCELLED'
  note: string | null
  createdAt: string
}

export interface ConsolidatedDish {
  menuItemId: number
  menuItemName: string
  totalQuantity: number
  pendingQuantity: number
  cookingQuantity: number
  oldestCreatedAt: string
  tableItems: ConsolidatedTableItem[]
}

interface KitchenSummaryDishCardProps {
  dish: ConsolidatedDish
  isSelected: boolean
  onSelect: () => void
  onCookAll: (dish: ConsolidatedDish) => Promise<void>
  onReadyAll: (dish: ConsolidatedDish) => Promise<void>
}

export function KitchenSummaryDishCard({
  dish,
  isSelected,
  onSelect,
  onCookAll,
  onReadyAll,
}: KitchenSummaryDishCardProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  // Calculate elapsed time from the oldest pending/cooking order
  const elapsedMinutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(dish.oldestCreatedAt).getTime()) / 60000)
  )
  const isUrgent = elapsedMinutes >= 15

  const handleCookAllClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsProcessing(true)
    try {
      await onCookAll(dish)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReadyAllClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsProcessing(true)
    try {
      await onReadyAll(dish)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div
      onClick={onSelect}
      className={`rounded-2xl p-4 border transition-all cursor-pointer select-none flex flex-col gap-3 shadow-xs ${
        isSelected
          ? 'bg-primary/5 border-primary ring-2 ring-primary/20 shadow-sm'
          : 'bg-card border-border hover:border-primary/50 hover:bg-surface/50'
      }`}
    >
      {/* Top Row: Name and Total Quantity */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-base text-text leading-snug line-clamp-2">
            {dish.menuItemName}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {dish.pendingQuantity > 0 && (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                {dish.pendingQuantity} chờ nấu
              </span>
            )}
            {dish.cookingQuantity > 0 && (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-status-cooking/10 text-status-cooking border border-status-cooking/20 flex items-center gap-1">
                <Flame className="w-3 h-3" />
                {dish.cookingQuantity} đang nấu
              </span>
            )}
            <span className="text-[11px] text-muted">
              ({dish.tableItems.length} bàn gọi)
            </span>
          </div>
        </div>

        {/* Big Quantity Badge */}
        <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white font-black text-xl shadow-xs">
          x{dish.totalQuantity}
        </div>
      </div>

      {/* Middle Row: Oldest Timer */}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
        <div
          className={`flex items-center gap-1.5 font-bold ${
            isUrgent ? 'text-status-cooking font-extrabold animate-pulse' : 'text-muted'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Bàn chờ lâu nhất: {elapsedMinutes} phút</span>
        </div>

        <div className="flex items-center gap-1 text-xs text-primary font-semibold">
          <span>Xem chi tiết</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Bottom Actions Row: 2 Nút song hành cố định */}
      <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={handleCookAllClick}
          disabled={dish.pendingQuantity === 0 || isProcessing}
          className="flex-1 h-9 px-3 rounded-lg text-xs font-bold bg-status-cooking/10 hover:bg-status-cooking/20 text-status-cooking border border-status-cooking/30 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-status-cooking/10 transition-all flex items-center justify-center gap-1"
          title={dish.pendingQuantity > 0 ? 'Nhận nấu tất cả các suất đang chờ' : 'Không có suất nào đang chờ nấu'}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Nấu tất cả</span>
        </button>

        <button
          type="button"
          onClick={handleReadyAllClick}
          disabled={dish.cookingQuantity === 0 || isProcessing}
          className="flex-1 h-9 px-3 rounded-lg text-xs font-bold bg-status-ready hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-xs cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-status-ready transition-all flex items-center justify-center gap-1"
          title={dish.cookingQuantity > 0 ? `Ra ${dish.cookingQuantity} suất đang nấu ra quầy` : 'Chưa có suất nào đang nấu để ra món'}
        >
          <span>Ra tất cả</span>
        </button>
      </div>
    </div>
  )
}
export default KitchenSummaryDishCard

