import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import type { PromotionResponse } from '@/features/promotions/types/promotion.types'

interface PromotionDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  promotion: PromotionResponse | null
  isLoading?: boolean
}

export function PromotionDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  promotion,
  isLoading = false,
}: PromotionDeleteModalProps) {
  if (!isOpen || !promotion) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-error/10 text-error">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text">Xóa Khuyến Mãi</h3>
              <p className="text-xs text-text-secondary">Thao tác này sẽ ẩn mã khuyến mãi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-secondary hover:text-text hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 bg-surface/70 rounded-lg border border-border/60 text-sm space-y-1.5">
          <div className="flex justify-between">
            <span className="text-text-secondary text-xs">Mã khuyến mãi:</span>
            <span className="font-mono font-bold text-primary">{promotion.code}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary text-xs">Tên chương trình:</span>
            <span className="font-medium text-text">{promotion.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary text-xs">Số lượt đã dùng:</span>
            <span className="font-medium text-text">{promotion.usedCount} lượt</span>
          </div>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed">
          Mã khuyến mãi sẽ không còn xuất hiện khi thu ngân tính tiền. Lịch sử các hóa đơn đã áp
          dụng mã này trong quá khứ vẫn được bảo toàn nguyên vẹn.
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Hủy bỏ
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-error hover:bg-error/90 text-white"
          >
            {isLoading ? 'Đang xóa...' : 'Xác nhận xóa'}
          </Button>
        </div>
      </div>
    </div>
  )
}

