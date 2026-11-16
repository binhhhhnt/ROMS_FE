import { useState } from 'react'
import { Clock, ChevronRight } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'

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
      className={`rounded-lg p-4 border transition-colors cursor-pointer select-none flex flex-col gap-3 ${
        isSelected
          ? 'bg-surface/60 border-primary'
          : 'bg-card border-border hover:border-primary/50'
      }`}
    >
      {/* Top Row: Quantity Anchor + Name */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base text-text leading-snug line-clamp-2">
            {dish.menuItemName}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {dish.pendingQuantity > 0 && (
              <Badge variant="pending">
                <span className="w-1.5 h-1.5 rounded-full bg-status-pending shrink-0" />
                {dish.pendingQuantity} chờ nấu
              </Badge>
            )}
            {dish.cookingQuantity > 0 && (
              <Badge variant="cooking">
                <span className="w-1.5 h-1.5 rounded-full bg-status-cooking shrink-0" />
                {dish.cookingQuantity} đang nấu
              </Badge>
            )}
            <span className="text-xs text-muted">
              ({dish.tableItems.length} bàn)
            </span>
          </div>
        </div>

        <span className="font-mono font-bold text-xl text-primary shrink-0 tabular-nums">
          {dish.totalQuantity}x
        </span>
      </div>

      {/* Middle Row: Oldest Timer */}
      <div className="flex items-center justify-between text-xs pt-2.5 border-t border-border">
        <div
          className={`flex items-center gap-1.5 font-medium ${
            isUrgent ? 'text-status-cancelled font-semibold' : 'text-muted'
          }`}
        >
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Chờ lâu nhất: {elapsedMinutes} phút</span>
        </div>

        <div className="flex items-center gap-0.5 text-xs text-primary font-medium shrink-0">
          <span>Chi tiết</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Bottom Actions Row */}
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <Button
          type="button"
          variant="cooking"
          size="sm"
          onClick={handleCookAllClick}
          disabled={dish.pendingQuantity === 0 || isProcessing}
          className="flex-1 h-9 px-3 text-xs font-semibold"
          title={dish.pendingQuantity > 0 ? 'Nhận nấu tất cả các suất đang chờ' : 'Không có suất nào đang chờ nấu'}
        >
          Nấu tất cả
        </Button>

        <Button
          type="button"
          variant="ready"
          size="sm"
          onClick={handleReadyAllClick}
          disabled={dish.cookingQuantity === 0 || isProcessing}
          className="flex-1 h-9 px-3 text-xs font-semibold"
          title={dish.cookingQuantity > 0 ? `Ra ${dish.cookingQuantity} suất đang nấu ra quầy` : 'Chưa có suất nào đang nấu để ra món'}
        >
          Ra tất cả
        </Button>
      </div>
    </div>
  )
}
export default KitchenSummaryDishCard

