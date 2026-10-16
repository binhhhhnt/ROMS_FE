import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import type { ExpenseResponse } from '@/features/expenses/types/expense.types'

interface CancelExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => Promise<void>
  expense: ExpenseResponse | null
  isLoading?: boolean
}

const COMMON_CANCEL_REASONS = [
  'Ghi nhầm số tiền hoặc thông tin hóa đơn',
  'Trùng lặp khoản chi đã nhập trước đó',
  'Giao dịch chi phí thực tế bị hủy bỏ',
  'Lý do khác (nhập bên dưới)',
]

export function CancelExpenseModal({
  isOpen,
  onClose,
  onConfirm,
  expense,
  isLoading = false,
}: CancelExpenseModalProps) {
  const [selectedReason, setSelectedReason] = useState(COMMON_CANCEL_REASONS[0])
  const [customReason, setCustomReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !expense) return null

  const handleConfirm = async () => {
    const finalReason =
      selectedReason === 'Lý do khác (nhập bên dưới)'
        ? customReason.trim()
        : selectedReason

    if (!finalReason) {
      setError('Vui lòng cung cấp lý do hủy khoản chi này.')
      return
    }

    if (finalReason.length > 255) {
      setError('Lý do hủy không được vượt quá 255 ký tự.')
      return
    }

    setError(null)
    await onConfirm(finalReason)
    onClose()
  }

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 text-left">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-status-cancelled/15 text-status-cancelled shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-text">Xác nhận hủy khoản chi</h3>
              <p className="text-xs text-muted">Mã khoản chi: #{expense.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-md text-muted hover:text-text hover:bg-muted-bg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Expense Info Card */}
        <div className="bg-muted-bg/60 border border-border rounded-lg p-3 text-xs flex flex-col gap-1.5">
          <div className="flex justify-between">
            <span className="text-muted">Khoản chi:</span>
            <span className="font-semibold text-text">{expense.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Số tiền:</span>
            <span className="font-bold text-status-cancelled">{formatVND(expense.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Ngày ghi nhận:</span>
            <span className="text-text">{expense.expenseDate}</span>
          </div>
        </div>

        <p className="text-xs text-muted leading-relaxed">
          Khoản chi sau khi hủy sẽ chuyển sang trạng thái <strong className="text-status-cancelled">Đã hủy</strong> và không được tính vào tổng chi phí hoạt động của nhà hàng. Hành động này không thể hoàn tác.
        </p>

        {/* Reason selection */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-text">
            Chọn hoặc nhập lý do hủy: <span className="text-status-cancelled">*</span>
          </label>
          <div className="flex flex-col gap-1.5">
            {COMMON_CANCEL_REASONS.map((reason) => (
              <label
                key={reason}
                className="flex items-center gap-2.5 text-xs text-text p-2 rounded-lg border border-border/80 hover:bg-surface/30 cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name="cancel_expense_reason"
                  checked={selectedReason === reason}
                  onChange={() => {
                    setSelectedReason(reason)
                    setError(null)
                  }}
                  className="text-primary focus:ring-accent"
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>

          {selectedReason === 'Lý do khác (nhập bên dưới)' && (
            <textarea
              rows={2}
              value={customReason}
              onChange={(e) => {
                setCustomReason(e.target.value)
                setError(null)
              }}
              placeholder="Nhập lý do cụ thể..."
              className="text-xs p-2.5 border border-border rounded-lg bg-card text-text focus:outline-none focus:border-accent mt-1"
            />
          )}

          {error && <span className="text-xs text-status-cancelled">{error}</span>}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border mt-1">
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
            Xác nhận hủy khoản chi
          </Button>
        </div>
      </div>
    </div>
  )
}
