import { useState } from 'react'
import { X, Percent, AlertCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { toast } from 'sonner'
import { settingsApi } from '@/features/settings/api/settingsApi'

interface TaxCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function TaxCategoryModal({ isOpen, onClose, onSuccess }: TaxCategoryModalProps) {
  const [rateStr, setRateStr] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setRateStr(val)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmed = rateStr.trim()
    if (!trimmed) {
      setError('Vui lòng nhập thuế suất')
      return
    }

    const num = parseFloat(trimmed)
    if (isNaN(num)) {
      setError('Thuế suất phải là số hợp lệ')
      return
    }

    if (num < 0) {
      setError('Thuế suất không được nhỏ hơn 0%')
      return
    }

    if (num > 100) {
      setError('Thuế suất không được vượt quá 100%')
      return
    }

    // Format to 2 decimal places
    const formattedRate = Math.round(num * 100) / 100

    try {
      setIsSubmitting(true)
      await settingsApi.createTaxCategory({ rate: formattedRate })
      toast.success(`Đã thêm mức thuế suất ${formattedRate}% thành công!`)
      setRateStr('')
      setError(null)
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { error?: { code?: string; message?: string } } } }
      const errCode = apiError.response?.data?.error?.code
      if (errCode === 'DUPLICATE_TAX_RATE') {
        setError(`Mức thuế suất ${formattedRate}% đã tồn tại trong hệ thống`)
      } else {
        setError('Có lỗi xảy ra khi tạo thuế suất. Vui lòng thử lại.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-xl border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
              <Percent className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-text text-base">Thêm mức thuế suất VAT</h3>
              <p className="text-xs text-text-secondary">Định mức thuế áp dụng cho thực đơn</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text p-1 rounded-lg hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Thuế suất (%) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="Ví dụ: 8 hoặc 10.0"
                value={rateStr}
                onChange={handleRateChange}
                disabled={isSubmitting}
                className="pr-10"
                autoFocus
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary font-medium">
                %
              </span>
            </div>
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-red-500 mt-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <p className="text-xs text-text-secondary mt-1.5">
              Mức thuế suất hợp lệ: từ 0% đến 100%, tối đa 2 chữ số thập phân (ví dụ: 0, 5, 8, 10).
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary-hover text-white"
            >
              {isSubmitting ? 'Đang lưu...' : 'Thêm mức thuế'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

