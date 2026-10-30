import { Users, MapPin, Play, ArrowRightLeft, CheckCircle, Settings2, Power, Eye, BellRing } from 'lucide-react'
import type { TableItem } from '@/features/tables/types/table.types'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'

interface TableCardProps {
  table: TableItem
  isOwner?: boolean
  readyItemsCount?: number
  onOpenSession: (table: TableItem) => void
  onCloseSession: (table: TableItem) => void
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
  onCloseSession,
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
      return <Badge variant="secondary">Bảo trì / Tắt</Badge>
    }
    if (hasReadyDishes) {
      return (
        <Badge variant="ready" className="bg-status-ready text-white animate-pulse flex items-center gap-1">
          <BellRing className="w-3 h-3" />
          {readyItemsCount} món cần bưng
        </Badge>
      )
    }
    if (isOccupied) {
      return (
        <Badge variant="cooking" className="animate-pulse">
          Đang phục vụ #{table.activeSessionId}
        </Badge>
      )
    }
    return <Badge variant="completed">Bàn trống</Badge>
  }

  return (
    <div
      className={`bg-card border rounded-2xl p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between text-left ${
        hasReadyDishes
          ? 'border-status-ready ring-2 ring-status-ready/30 bg-emerald-50/10'
          : isOccupied
          ? 'border-status-cooking/40 bg-status-cooking/5'
          : isOutOfService
          ? 'border-border/60 opacity-60 bg-surface/20'
          : 'border-border hover:border-primary/40'
      }`}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-text tracking-tight uppercase">
              Bàn {table.tableCode}
            </span>
            {table.area && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted bg-surface px-2 py-0.5 rounded-md border border-border">
                <MapPin className="w-3 h-3 text-accent" />
                {table.area}
              </span>
            )}
          </div>
          {statusBadge()}
        </div>

        {/* Capacity */}
        <div className="flex items-center gap-1.5 text-xs text-muted mb-4">
          <Users className="w-3.5 h-3.5" />
          <span>Sức chứa: <strong>{table.capacity} khách</strong></span>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-3 border-t border-border flex flex-col gap-2">
        {isEmpty && table.isActive && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onOpenSession(table)}
            className="w-full text-xs font-semibold shadow-xs"
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
                className="text-xs px-2"
                title="Xem đơn hàng & lịch sử bàn"
              >
                <Eye className="w-3.5 h-3.5 mr-1" />
                Chi tiết
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTransferTable(table)}
                className="text-xs px-2 text-accent"
                title="Chuyển sang bàn khác"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 mr-1" />
                Chuyển bàn
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onCloseSession(table)}
              className="w-full text-xs text-status-cancelled hover:bg-status-cancelled/10 border-status-cancelled/30"
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
              Đóng phiên phục vụ
            </Button>
          </div>
        )}

        {/* Owner Operations */}
        {isOwner && (
          <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
            <button
              type="button"
              onClick={() => onEditTable?.(table)}
              className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-text transition-colors p-1"
            >
              <Settings2 className="w-3 h-3 text-accent" />
              Sửa bàn
            </button>

            <button
              type="button"
              onClick={() => onToggleStatus?.(table)}
              className={`inline-flex items-center gap-1 text-[11px] transition-colors p-1 ${
                table.isActive
                  ? 'text-status-cancelled hover:opacity-80'
                  : 'text-status-completed hover:opacity-80'
              }`}
            >
              <Power className="w-3 h-3" />
              {table.isActive ? 'Tắt bàn' : 'Bật bàn'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
