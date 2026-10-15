import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

interface CancelItemModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => Promise<void>
  title: string
  itemName?: string
  isLoading?: boolean
}

const COMMON_REASONS = [
  'Khách đổi ý, muốn chọn món khác',
  'Thời gian chờ đợi quá lâu',
  'Bấm nhầm số lượng món',
  'Lý do khác',
]

export function CancelItemModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  isLoading = false,
}: CancelItemModalProps) {
  const [selectedReason, setSelectedReason] = useState(COMMON_REASONS[0])
  const [customReason, setCustomReason] = useState('')

  if (!isOpen) return null

  const handleConfirm = async () => {
    const finalReason =
      selectedReason === 'Lý do khác' && customReason.trim()
        ? customReason.trim()
        : selectedReason
    await onConfirm(finalReason)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-5 text-left">
        {/* Header */}
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-full bg-status-cancelled/15 text-status-cancelled shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-text">{title}</h3>
            {itemName && (
              <p className="text-sm font-semibold text-accent mt-0.5">
                {itemName}
              </p>
            )}
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Lưu ý: Bạn chỉ có thể hủy khi món ăn hoặc đơn hàng đang ở trạng thái <strong className="text-status-pending">Chờ tiếp nhận (PENDING)</strong>.
            </p>
          </div>
        </div>

        {/* Reason Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-text">
            Chọn lý do hủy:
          </label>
          <div className="flex flex-col gap-1.5">
            {COMMON_REASONS.map((reason) => (
              <label
                key={reason}
                className="flex items-center gap-2.5 text-xs text-text p-2 rounded-lg border border-border/80 hover:bg-surface/30 cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name="cancel_reason"
                  checked={selectedReason === reason}
                  onChange={() => setSelectedReason(reason)}
                  className="text-primary focus:ring-accent"
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>

          {selectedReason === 'Lý do khác' && (
            <textarea
              rows={2}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Nhập lý do cụ thể..."
              className="text-xs p-2.5 border border-border rounded-lg bg-card text-text focus:outline-none focus:border-accent mt-1"
            />
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={isLoading}
          >
            Đóng
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="md"
            isLoading={isLoading}
            onClick={handleConfirm}
            className="font-bold shadow-sm"
          >
            Xác nhận hủy
          </Button>
        </div>
      </div>
    </div>
  )
}
