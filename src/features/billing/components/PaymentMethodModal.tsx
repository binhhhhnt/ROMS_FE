import { useState } from 'react'
import { X, Banknote, QrCode, Split, CheckCircle, Printer } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import type { PaymentItemDto } from '@/features/billing/types/bill.types'

interface PaymentMethodModalProps {
  isOpen: boolean
  onClose: () => void
  totalAmount: number
  onConfirm: (payments: PaymentItemDto[], shouldPrint: boolean) => void
  isPending?: boolean
}

type TabType = 'CASH' | 'BANK_TRANSFER' | 'SPLIT'

export function PaymentMethodModal({
  isOpen,
  onClose,
  totalAmount,
  onConfirm,
  isPending = false,
}: PaymentMethodModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('CASH')
  const [cashPart, setCashPart] = useState<number>(Math.round(totalAmount / 2))

  if (!isOpen) return null

  const transferPart = Math.max(0, totalAmount - cashPart)
  const isSplitValid = cashPart >= 0 && transferPart >= 0 && cashPart + transferPart === totalAmount

  const handleConfirm = (shouldPrint: boolean) => {
    if (activeTab === 'CASH') {
      onConfirm([{ paymentMethod: 'CASH', amount: totalAmount }], shouldPrint)
    } else if (activeTab === 'BANK_TRANSFER') {
      onConfirm([{ paymentMethod: 'BANK_TRANSFER', amount: totalAmount }], shouldPrint)
    } else {
      if (!isSplitValid) return
      const payments: PaymentItemDto[] = []
      if (cashPart > 0) {
        payments.push({ paymentMethod: 'CASH', amount: cashPart })
      }
      if (transferPart > 0) {
        payments.push({ paymentMethod: 'BANK_TRANSFER', amount: transferPart })
      }
      onConfirm(payments, shouldPrint)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-surface/50">
          <div>
            <h3 className="text-lg font-bold text-text">Phương thức thanh toán</h3>
            <p className="text-xs text-muted mt-0.5">Chọn một hoặc kết hợp nhiều hình thức thanh toán</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-1.5 text-muted hover:text-text rounded-lg hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Display */}
        <div className="p-5 bg-primary/5 border-b border-border flex items-center justify-between">
          <span className="text-sm font-medium text-muted">Số tiền cần thanh toán:</span>
          <span className="text-2xl font-black text-primary">
            {totalAmount.toLocaleString('vi-VN')} đ
          </span>
        </div>

        {/* Method Selector Tabs */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-2 p-1 bg-surface rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setActiveTab('CASH')}
              className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'CASH'
                  ? 'bg-card text-primary shadow-xs border border-border'
                  : 'text-muted hover:text-text'
              }`}
            >
              <Banknote className="w-4 h-4 text-emerald-500" />
              Tiền mặt
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('BANK_TRANSFER')}
              className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'BANK_TRANSFER'
                  ? 'bg-card text-primary shadow-xs border border-border'
                  : 'text-muted hover:text-text'
              }`}
            >
              <QrCode className="w-4 h-4 text-accent" />
              Chuyển khoản
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('SPLIT')
                setCashPart(Math.round(totalAmount / 2))
              }}
              className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'SPLIT'
                  ? 'bg-card text-primary shadow-xs border border-border'
                  : 'text-muted hover:text-text'
              }`}
            >
              <Split className="w-4 h-4 text-indigo-500" />
              Kết hợp cả 2
            </button>
          </div>

          {/* Details based on tab */}
          {activeTab === 'CASH' && (
            <div className="p-4 rounded-xl bg-surface/50 border border-border space-y-2">
              <div className="flex items-center gap-2 text-sm text-text">
                <Banknote className="w-4 h-4 text-emerald-500" />
                <span>Thanh toán toàn bộ bằng <strong>Tiền mặt</strong></span>
              </div>
              <p className="text-xs text-muted">
                Thu trực tiếp <strong>{totalAmount.toLocaleString('vi-VN')} đ</strong> từ khách hàng.
              </p>
            </div>
          )}

          {activeTab === 'BANK_TRANSFER' && (
            <div className="p-4 rounded-xl bg-surface/50 border border-border space-y-2">
              <div className="flex items-center gap-2 text-sm text-text">
                <QrCode className="w-4 h-4 text-accent" />
                <span>Thanh toán toàn bộ qua <strong>Chuyển khoản</strong></span>
              </div>
              <p className="text-xs text-muted">
                Khách quét mã QR chuyển khoản <strong>{totalAmount.toLocaleString('vi-VN')} đ</strong>.
              </p>
            </div>
          )}

          {activeTab === 'SPLIT' && (
            <div className="p-4 rounded-xl bg-surface/50 border border-border space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text flex items-center justify-between">
                  <span>Tiền mặt thu:</span>
                  <span className="text-emerald-600 font-bold">{cashPart.toLocaleString('vi-VN')} đ</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={totalAmount}
                  step={1000}
                  value={cashPart}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    setCashPart(isNaN(val) ? 0 : Math.min(val, totalAmount))
                  }}
                  className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg text-text focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border">
                <label className="text-xs font-semibold text-text flex items-center justify-between">
                  <span>Chuyển khoản còn lại:</span>
                  <span className="text-accent font-bold">{transferPart.toLocaleString('vi-VN')} đ</span>
                </label>
                <div className="px-3 py-2 text-sm bg-surface border border-border rounded-lg text-muted font-semibold">
                  {transferPart.toLocaleString('vi-VN')} đ
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-end gap-2 p-5 border-t border-border bg-surface/50">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isPending}
          >
            Hủy
          </Button>

          {/* Nút 1: Xác nhận thanh toán (không in) */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleConfirm(false)}
            disabled={isPending || (activeTab === 'SPLIT' && !isSplitValid)}
            className="border-primary/40 text-primary hover:bg-primary/10 font-semibold"
          >
            <CheckCircle className="w-4 h-4 mr-1.5" />
            {isPending ? 'Đang xử lý...' : 'Xác nhận'}
          </Button>

          {/* Nút 2: Xác nhận & In hóa đơn */}
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => handleConfirm(true)}
            disabled={isPending || (activeTab === 'SPLIT' && !isSplitValid)}
            className="bg-primary hover:bg-primary-hover text-white font-semibold"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            {isPending ? 'Đang xử lý...' : 'Xác nhận & In hóa đơn'}
          </Button>
        </div>
      </div>
    </div>
  )
}
