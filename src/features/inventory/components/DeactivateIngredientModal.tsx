import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { toast } from 'sonner'

import { ingredientApi } from '@/features/inventory/api/ingredientApi'
import type { IngredientResponse } from '@/features/inventory/types/ingredient.types'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { Button } from '@/shared/components/ui/button'

interface DeactivateIngredientModalProps {
  isOpen: boolean
  onClose: () => void
  ingredient: IngredientResponse | null
  onSuccess: () => void
}

export function DeactivateIngredientModal({
  isOpen,
  onClose,
  ingredient,
  onSuccess,
}: DeactivateIngredientModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !ingredient) return null

  const handleDeactivate = async () => {
    setIsSubmitting(true)
    try {
      await ingredientApi.deactivateIngredient(ingredient.id)
      toast.success(`Đã ngưng sử dụng nguyên liệu "${ingredient.name}"`)
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-5 text-left">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-status-cancelled/15 text-status-cancelled shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-text">Xác nhận ngưng sử dụng</h3>
              <p className="text-xs text-muted">Mã nguyên liệu: #{ingredient.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted hover:text-text hover:bg-surface/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2 text-sm text-text">
          <p>
            Bạn có chắc chắn muốn ngưng sử dụng nguyên liệu{' '}
            <strong className="text-primary font-semibold">"{ingredient.name}"</strong>?
          </p>
          <div className="p-3 bg-surface/50 border border-surface rounded-lg text-xs text-muted space-y-1">
            <p>&bull; Nguyên liệu bị ngưng sử dụng sẽ không thể gán vào công thức món ăn mới.</p>
            <p>&bull; Nếu nguyên liệu đang nằm trong công thức của món ăn đang hoạt động, hệ thống sẽ từ chối để đảm bảo tính toàn vẹn dữ liệu.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="md"
            onClick={handleDeactivate}
            isLoading={isSubmitting}
          >
            Ngưng sử dụng
          </Button>
        </div>
      </div>
    </div>
  )
}
