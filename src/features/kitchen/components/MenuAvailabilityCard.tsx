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
    <div
      className={`bg-card border rounded-2xl overflow-hidden flex flex-col shadow-xs transition-all ${
        isAvailable
          ? 'border-border'
          : isTemporarilyUnavailable
          ? 'border-status-cooking ring-1 ring-status-cooking/30 bg-amber-50/10'
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
          <div className="text-xs text-muted font-medium">Chưa có ảnh</div>
        )}

        {/* Status Badge Overlay */}
        <div className="absolute top-3 right-3">
          {isAvailable ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-status-ready text-white">
              ĐANG BÁN
            </span>
          ) : isTemporarilyUnavailable ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-status-cooking text-white">
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
          <div className="absolute bottom-2.5 left-2.5 bg-white/95 text-text text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-border">
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
          <div className="text-sm font-black text-primary mt-0.5">
            {formatPrice(item.price)}
          </div>
        </div>

        {/* Action Toggle Footer */}
        <div className="pt-2 border-t border-border">
          {isDiscontinued ? (
            <div className="text-center py-2 text-xs font-semibold text-muted">
              Ngừng bán vĩnh viễn (Chỉ Chủ quán)
            </div>
          ) : isAvailable ? (
            <button
              type="button"
              onClick={() => onToggleClick(item)}
              className="w-full h-10 rounded-xl bg-status-cooking/15 hover:bg-status-cooking/25 active:bg-status-cooking/30 text-status-cooking border border-status-cooking/30 text-xs font-bold transition-colors cursor-pointer"
            >
              Tạm ngưng món này
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onToggleClick(item)}
              className="w-full h-10 rounded-xl bg-status-ready hover:bg-emerald-600 active:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              Mở bán lại món
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
export default MenuAvailabilityCard
