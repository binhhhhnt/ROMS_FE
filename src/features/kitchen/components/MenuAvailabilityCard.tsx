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
    <div className={`bg-slate-800 border rounded-2xl overflow-hidden flex flex-col shadow-md transition-all hover:shadow-xl ${
      isAvailable
        ? 'border-slate-700 hover:border-emerald-500/50'
        : isTemporarilyUnavailable
        ? 'border-amber-500/60 ring-1 ring-amber-500/20'
        : 'border-slate-700/60 opacity-60'
    }`}>
      {/* Top Image or Icon Placeholder */}
      <div className="relative h-40 bg-slate-900 overflow-hidden flex items-center justify-center">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-600 gap-2">
            <UtensilsCrossed className="w-10 h-10" />
            <span className="text-[11px] font-medium">Chưa có ảnh</span>
          </div>
        )}

        {/* Status Badge Overlay */}
        <div className="absolute top-3 right-3">
          {isAvailable ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500 text-slate-950 shadow-md">
              ĐANG BÁN
            </span>
          ) : isTemporarilyUnavailable ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 shadow-md">
              TẠM NGƯNG
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-slate-700 text-slate-300 border border-slate-600">
              NGỪNG BÁN
            </span>
          )}
        </div>

        {/* Category Pill */}
        {item.category && (
          <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-xs text-slate-300 text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-slate-700/80">
            {item.category.name}
          </div>
        )}
      </div>

      {/* Info Body */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-base text-white line-clamp-1">
            {item.name}
          </h3>
          <div className="text-sm font-black text-sky-400 mt-1">
            {formatPrice(item.price)}
          </div>
          {item.description && (
            <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        {/* Action Toggle Footer */}
        <div className="pt-3 border-t border-slate-700/70 mt-2">
          {isDiscontinued ? (
            <div className="text-center py-2 text-xs font-semibold text-slate-500 flex items-center justify-center gap-1.5">
              <AlertOctagon className="w-4 h-4" />
              <span>Ngừng bán vĩnh viễn (Chỉ Chủ quán)</span>
            </div>
          ) : isAvailable ? (
            <button
              type="button"
              onClick={() => onToggleClick(item)}
              className="w-full h-10 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 active:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Power className="w-4 h-4" />
              <span>Tạm ngưng món này</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onToggleClick(item)}
              className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
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
