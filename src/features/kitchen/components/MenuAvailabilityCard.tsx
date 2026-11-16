import { UtensilsCrossed } from 'lucide-react'
import type { MenuItemReadItem } from '@/features/kitchen/types/kitchen.types'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'

interface MenuAvailabilityCardProps {
  item: MenuItemReadItem
  onToggleClick: (item: MenuItemReadItem) => void
}

export function MenuAvailabilityCard({
  item,
  onToggleClick,
}: MenuAvailabilityCardProps) {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const primaryImage =
    item.images.find((img) => img.isPrimary)?.imageUrl ||
    item.images[0]?.imageUrl

  const isAvailable = item.status === 'AVAILABLE'
  const isTemporarilyUnavailable = item.status === 'TEMPORARILY_UNAVAILABLE'
  const isDiscontinued = item.status === 'DISCONTINUED'

  return (
    <div
      className={`bg-card border rounded-2xl overflow-hidden flex flex-col shadow-xs transition-all ${
        isAvailable
          ? 'border-border'
          : isTemporarilyUnavailable
            ? 'border-status-pending ring-1 ring-status-pending/30'
            : 'border-border/60 opacity-60'
      }`}
    >
      {/* Top Image */}
      <div className="relative h-36 bg-surface/60 overflow-hidden flex items-center justify-center">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-muted">
            <UtensilsCrossed className="w-7 h-7 opacity-40" />
            <span className="text-xs font-medium">Chưa có ảnh</span>
          </div>
        )}

        {/* Status Badge Overlay */}
        <div className="absolute top-3 right-3">
          {isAvailable ? (
            <Badge variant="ready" className="bg-card/95 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-status-ready shrink-0" />
              Đang bán
            </Badge>
          ) : isTemporarilyUnavailable ? (
            <Badge variant="pending" className="bg-card/95 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-status-pending shrink-0" />
              Tạm ngưng
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-card/95 text-muted rounded-full">
              Ngừng bán
            </Badge>
          )}
        </div>

        {/* Category Pill */}
        {item.category && (
          <div className="absolute bottom-2.5 left-2.5 bg-card/95 text-text text-[11px] font-semibold px-2.5 py-0.5 rounded-md border border-border">
            {item.category.name}
          </div>
        )}
      </div>

      {/* Info Body */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <h3 className="font-bold text-base text-text line-clamp-1">
            {item.name}
          </h3>
          <div className="flex items-center justify-between gap-2 mt-1">
            <span className="text-sm font-bold tabular-nums text-primary">
              {formatPrice(item.price)}
            </span>
            {item.availability?.reason?.includes('BOM') ? (
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                Chưa có BOM
              </span>
            ) : item.availability?.maxPossibleQuantity != null ? (
              item.availability.maxPossibleQuantity === 0 ? (
                <span className="text-xs font-medium text-status-cancelled">
                  Hết kho (0)
                </span>
              ) : (
                <span className="text-xs font-medium text-status-completed tabular-nums">
                  Kho: {item.availability.maxPossibleQuantity} suất
                </span>
              )
            ) : null}
          </div>
        </div>

        {/* Action Toggle Footer */}
        <div className="pt-2 border-t border-border">
          {isDiscontinued ? (
            <div className="text-center py-2 text-xs text-muted">
              Ngừng bán vĩnh viễn
            </div>
          ) : isAvailable ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onToggleClick(item)}
              className="w-full h-10 rounded-xl text-xs font-semibold bg-status-pending/15 hover:bg-status-pending/25 text-amber-800 dark:text-amber-300 border-status-pending/40"
            >
              Tạm ngưng món này
            </Button>
          ) : (
            <Button
              type="button"
              variant="ready"
              size="sm"
              onClick={() => onToggleClick(item)}
              className="w-full h-10 rounded-xl text-xs font-semibold"
            >
              Mở bán lại món
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
export default MenuAvailabilityCard
