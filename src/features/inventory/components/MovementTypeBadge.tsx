import { ArrowDownLeft, ArrowUpRight, Scale, RotateCcw } from 'lucide-react'
import type { StockMovementType } from '@/features/inventory/types/stockMovement.types'
import { Badge } from '@/shared/components/ui/badge'

interface MovementTypeBadgeProps {
  type: StockMovementType
}

export function MovementTypeBadge({ type }: MovementTypeBadgeProps) {
  switch (type) {
    case 'PURCHASE':
      return (
        <Badge
          variant="outline"
          className="border-status-ready text-status-ready bg-status-ready/10 flex items-center gap-1 font-medium"
        >
          <ArrowDownLeft className="w-3.5 h-3.5" />
          <span>Nhập mua hàng</span>
        </Badge>
      )
    case 'ORDER_CONSUMPTION':
      return (
        <Badge
          variant="outline"
          className="border-status-cooking text-status-cooking bg-status-cooking/10 flex items-center gap-1 font-medium"
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>Xuất chế biến</span>
        </Badge>
      )
    case 'INVENTORY_ADJUSTMENT':
      return (
        <Badge
          variant="outline"
          className="border-status-pending text-status-pending bg-status-pending/10 flex items-center gap-1 font-medium"
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Điều chỉnh kiểm kê</span>
        </Badge>
      )
    case 'ORDER_RETURN':
      return (
        <Badge
          variant="outline"
          className="border-accent text-accent bg-accent/10 flex items-center gap-1 font-medium"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Hoàn trả kiểm đồ</span>
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="border-border text-muted">
          {type}
        </Badge>
      )
  }
}
