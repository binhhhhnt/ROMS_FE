import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type {
  MenuItemReadItem,
  MenuItemAvailabilityStatus,
} from '@/features/kitchen/types/kitchen.types'
import { Button } from '@/shared/components/ui/button'

interface MenuStatusConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  item: MenuItemReadItem | null
  targetStatus: MenuItemAvailabilityStatus
  isLoading: boolean
}

export function MenuStatusConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  item,
  targetStatus,
  isLoading,
}: MenuStatusConfirmModalProps) {
  if (!isOpen || !item) return null

  const isPausing = targetStatus === 'TEMPORARILY_UNAVAILABLE'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-5 text-left text-white">
        {/* Modal Header */}
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl shrink-0 ${
            isPausing
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
          }`}>
            {isPausing ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <CheckCircle2 className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-white">
              {isPausing
                ? 'Xác nhận Tạm ngưng món'
                : 'Xác nhận Mở bán lại món'}
            </h3>
            <p className="text-sm font-bold text-sky-400 mt-0.5">
              {item.name}
            </p>
            {item.category?.name && (
              <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded mt-1 inline-block">
                Danh mục: {item.category.name}
              </span>
            )}
          </div>
        </div>

        {/* Status Transition Details */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Trạng thái hiện tại:</span>
            <span className={`font-bold px-2 py-0.5 rounded ${
              item.status === 'AVAILABLE'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/20 text-amber-400'
            }`}>
              {item.status === 'AVAILABLE' ? 'Đang phục vụ' : 'Tạm ngưng'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Chuyển sang:</span>
            <span className={`font-black px-2.5 py-0.5 rounded ${
              isPausing
                ? 'bg-amber-500 text-slate-950'
                : 'bg-emerald-500 text-slate-950'
            }`}>
              {isPausing ? 'TẠM NGƯNG PHỤC VỤ' : 'ĐANG PHỤC VỤ'}
            </span>
          </div>

          <p className="text-slate-400 text-[11px] leading-relaxed pt-2 border-t border-slate-800/80">
            {isPausing
              ? 'Lưu ý: Món ăn sẽ tạm thời bị khóa đặt trên tất cả tablet của khách tại bàn. Các đơn hàng đã đặt trước đó vẫn được bảo lưu.'
              : 'Lưu ý: Món ăn sẽ ngay lập tức được mở bán và cho phép khách tại bàn đặt món bình thường.'}
          </p>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={isLoading}
            className="text-xs text-slate-400 hover:text-white hover:bg-slate-800"
          >
            Hủy bỏ
          </Button>

          <Button
            type="button"
            variant={isPausing ? 'destructive' : 'primary'}
            size="md"
            isLoading={isLoading}
            onClick={onConfirm}
            className={`font-bold text-xs h-10 px-5 shadow-md ${
              !isPausing ? 'bg-emerald-600 hover:bg-emerald-500' : ''
            }`}
          >
            {isPausing ? 'Xác nhận Tạm ngưng' : 'Xác nhận Mở bán lại'}
          </Button>
        </div>
      </div>
    </div>
  )
}
