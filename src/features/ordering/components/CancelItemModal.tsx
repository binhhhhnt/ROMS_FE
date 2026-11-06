import { useState, useEffect } from 'react'
import { AlertTriangle, Minus, Plus } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

interface CancelItemModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string, quantity?: number) => Promise<void>
  title: string
  itemName?: string
  maxQuantity?: number
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
  maxQuantity,
  isLoading = false,
}: CancelItemModalProps) {
  const [selectedReason, setSelectedReason] = useState(COMMON_REASONS[0])
  const [customReason, setCustomReason] = useState('')
  const [cancelQuantity, setCancelQuantity] = useState<number>(1)

  useEffect(() => {
    if (isOpen) {
      setCancelQuantity(maxQuantity && maxQuantity > 0 ? 1 : 1)
    }
  }, [isOpen, maxQuantity])

  if (!isOpen) return null

  const canSelectQuantity = typeof maxQuantity === 'number' && maxQuantity > 1

  const handleConfirm = async () => {
    const finalReason =
      selectedReason === 'Lý do khác' && customReason.trim()
        ? customReason.trim()
        : selectedReason
    const qtyToPass =
      typeof maxQuantity === 'number' && maxQuantity >= 1
        ? canSelectQuantity
          ? cancelQuantity
          : maxQuantity
        : undefined
    await onConfirm(finalReason, qtyToPass)
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
                {typeof maxQuantity === 'number' && maxQuantity >= 1 && (
                  <span className="text-xs font-bold text-muted ml-1.5">
                    (Đã đặt: &times;{maxQuantity})
                  </span>
                )}
              </p>
            )}
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Lưu ý: Bạn chỉ có thể hủy khi món ăn hoặc đơn hàng đang ở trạng thái{' '}
              <strong className="text-status-pending">Chờ tiếp nhận (PENDING)</strong>.
            </p>
          </div>
        </div>

        {/* Quantity Selector (Progressive Disclosure: only shown when maxQuantity > 1) */}
        {canSelectQuantity && (
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-surface/40 border border-border">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text">
                Số lượng muốn hủy:
              </label>
              <button
                type="button"
                onClick={() => setCancelQuantity(maxQuantity)}
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                  cancelQuantity === maxQuantity
                    ? 'bg-status-cancelled text-white'
                    : 'bg-status-cancelled/10 text-status-cancelled hover:bg-status-cancelled/20'
                }`}
              >
                Hủy tất cả ({maxQuantity})
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCancelQuantity((q) => Math.max(1, q - 1))}
                  disabled={cancelQuantity <= 1 || isLoading}
                  className="w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center text-text hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-extrabold text-base text-text">
                  {cancelQuantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCancelQuantity((q) => Math.min(maxQuantity, q + 1))
                  }
                  disabled={cancelQuantity >= maxQuantity || isLoading}
                  className="w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center text-text hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="text-xs text-muted">
                {cancelQuantity < maxQuantity ? (
                  <>
                    Giữ lại nấu:{' '}
                    <strong className="text-status-pending">
                      {maxQuantity - cancelQuantity} phần
                    </strong>
                  </>
                ) : (
                  <strong className="text-status-cancelled">
                    Hủy toàn bộ món này
                  </strong>
                )}
              </span>
            </div>
          </div>
        )}

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
            {canSelectQuantity
              ? `Xác nhận hủy (${cancelQuantity}/${maxQuantity})`
              : 'Xác nhận hủy'}
          </Button>
        </div>
      </div>
    </div>
  )
}
