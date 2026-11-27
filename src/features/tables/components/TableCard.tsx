import { Users, Play, ArrowRightLeft, Settings2, Power, Eye } from 'lucide-react'
import type { TableItem } from '@/features/tables/types/table.types'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'

interface TableCardProps {
  table: TableItem
  isOwner?: boolean
  readyItemsCount?: number
  onOpenSession: (table: TableItem) => void
  onCloseSession?: (table: TableItem) => void
  onTransferTable: (table: TableItem) => void
  onEditTable?: (table: TableItem) => void
  onToggleStatus?: (table: TableItem) => void
  onViewDetail: (table: TableItem) => void
}

export function TableCard({
  table,
  isOwner = false,
  readyItemsCount = 0,
  onOpenSession,
  onTransferTable,
  onEditTable,
  onToggleStatus,
  onViewDetail,
}: TableCardProps) {
  const isOccupied = table.realtimeStatus === 'OCCUPIED'
  const isEmpty = table.realtimeStatus === 'EMPTY'
  const isOutOfService = !table.isActive || table.realtimeStatus === 'OUT_OF_SERVICE'
  const hasReadyDishes = isOccupied && readyItemsCount > 0

  const statusBadge = () => {
    if (isOutOfService) {
      return (
        <Badge variant="outline" className="text-muted whitespace-nowrap shrink-0">
          <span className="w-2 h-2 rounded-full bg-muted shrink-0" />
          Bảo trì / Tắt
        </Badge>
      )
    }
    if (hasReadyDishes) {
      return (
        <Badge variant="ready" className="whitespace-nowrap shrink-0">
          <span className="w-2 h-2 rounded-full bg-status-ready shrink-0" />
          {readyItemsCount} món cần bưng
        </Badge>
      )
    }
    if (isOccupied) {
      return (
        <Badge variant="cooking" className="whitespace-nowrap shrink-0">
          <span className="w-2 h-2 rounded-full bg-status-cooking shrink-0" />
          Đang phục vụ
        </Badge>
      )
    }
    return (
      <Badge variant="completed" className="whitespace-nowrap shrink-0">
        <span className="w-2 h-2 rounded-full bg-status-completed shrink-0" />
        Bàn trống
      </Badge>
    )
  }

  return (
    <div
      className={`bg-card border border-border rounded-lg p-4 transition-colors flex flex-col justify-between text-left ${
        hasReadyDishes
          ? 'border-t-4 border-t-status-ready'
          : isOccupied
            ? 'border-t-4 border-t-status-cooking'
            : isOutOfService
              ? 'opacity-60'
              : 'hover:border-primary/40'
      }`}
    >
      {/* Top Header */}
      <div>
        <div className="flex flex-wrap items-start justify-between gap-2 mb-2.5">
          <div className="min-w-0 flex-1">
            <span className="text-lg font-bold text-text block leading-tight">
              Bàn {table.tableCode}
            </span>
            <span className="text-xs text-muted mt-0.5 block">
              {table.area ? `${table.area} • ` : ''}
              <span className="inline-flex items-center gap-1">
                <Users className="w-3 h-3 inline" />
                {table.capacity} khách
              </span>
            </span>
          </div>
          {statusBadge()}
        </div>
      </div>

      {/* Actions */}
      <div className="pt-3 mt-2 border-t border-border flex flex-col gap-2">
        {isEmpty && table.isActive && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onOpenSession(table)}
            className="w-full h-9 text-xs font-semibold"
          >
            <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
            Mở bàn đón khách
          </Button>
        )}

        {isOccupied && (
          <div className="flex flex-col gap-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetail(table)}
                className="h-9 text-xs px-2"
                title="Xem đơn hàng & lịch sử bàn"
              >
                <Eye className="w-3.5 h-3.5 mr-1" />
                Chi tiết
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTransferTable(table)}
                className="h-9 text-xs px-2"
                title="Chuyển sang bàn khác"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 mr-1" />
                Chuyển bàn
              </Button>
            </div>
          </div>
        )}

        {/* Owner Operations */}
        {isOwner && (
          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEditTable?.(table)}
              className="h-8 text-xs px-2"
            >
              <Settings2 className="w-3.5 h-3.5 mr-1 shrink-0" />
              Sửa bàn
            </Button>

            <Button
              type="button"
              variant={table.isActive ? 'destructiveOutline' : 'outline'}
              size="sm"
              onClick={() => onToggleStatus?.(table)}
              className="h-8 text-xs px-2"
            >
              <Power className="w-3.5 h-3.5 mr-1 shrink-0" />
              {table.isActive ? 'Tắt bàn' : 'Bật bàn'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
