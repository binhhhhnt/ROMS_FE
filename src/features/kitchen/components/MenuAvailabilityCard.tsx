import { UtensilsCrossed, Power, AlertOctagon } from 'lucide-react'
import type { MenuItemReadItem } from '@/features/kitchen/types/kitchen.types'

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
    <div className={`bg-card border rounded-2xl overflow-hidden flex flex-col shadow-xs transition-all hover:shadow-md ${
      isAvailable
        ? 'border-border hover:border-primary/40'
        : isTemporarilyUnavailable
        ? 'border-status-cooking ring-1 ring-status-cooking/20'
        : 'border-border/60 opacity-60'
    }`}>
      {/* Top Image or Icon Placeholder */}
      <div className="relative h-40 bg-surface/50 overflow-hidden flex items-center justify-center">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted gap-2">
            <UtensilsCrossed className="w-10 h-10" />
            <span className="text-[11px] font-medium">Chưa có ảnh</span>
          </div>
        )}

        {/* Status Badge Overlay */}
        <div className="absolute top-3 right-3">
          {isAvailable ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-status-ready text-white shadow-xs">
              ĐANG BÁN
            </span>
          ) : isTemporarilyUnavailable ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-status-cooking text-white shadow-xs">
              TẠM NGƯNG
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-muted text-white">
              NGỪNG BÁN
            </span>
          )}
        </div>

        {/* Category Pill */}
        {item.category && (
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs text-text text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-border shadow-xs">
            {item.category.name}
          </div>
        )}
      </div>

      {/* Info Body */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-base text-text line-clamp-1">
            {item.name}
          </h3>
          <div className="text-sm font-black text-primary mt-1">
            {formatPrice(item.price)}
          </div>
          {item.description && (
            <p className="text-xs text-muted line-clamp-2 mt-1.5 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        {/* Action Toggle Footer */}
        <div className="pt-3 border-t border-border mt-2">
          {isDiscontinued ? (
            <div className="text-center py-2 text-xs font-semibold text-muted flex items-center justify-center gap-1.5">
              <AlertOctagon className="w-4 h-4" />
              <span>Ngừng bán vĩnh viễn (Chỉ Chủ quán)</span>
            </div>
          ) : isAvailable ? (
            <button
              type="button"
              onClick={() => onToggleClick(item)}
              className="w-full h-10 rounded-xl bg-status-cooking/15 hover:bg-status-cooking/25 active:bg-status-cooking/30 text-status-cooking border border-status-cooking/30 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Power className="w-4 h-4" />
              <span>Tạm ngưng món này</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onToggleClick(item)}
              className="w-full h-10 rounded-xl bg-status-ready hover:bg-emerald-600 active:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Power className="w-4 h-4" />
              <span>Mở bán lại món</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
