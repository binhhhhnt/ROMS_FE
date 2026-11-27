import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type {
  MenuItemReadItem,
  MenuItemAvailabilityStatus,
} from '@/features/kitchen/types/kitchen.types'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-lg p-5 max-w-md w-full shadow-md flex flex-col gap-4 text-left text-text">
        {/* Modal Header */}
        <div className="flex items-start gap-3">
          {isPausing ? (
            <AlertTriangle className="w-5 h-5 text-status-pending shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-status-ready shrink-0 mt-0.5" />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-base text-text">
              {isPausing
                ? 'Xác nhận Tạm ngưng món'
                : 'Xác nhận Mở bán lại món'}
            </h3>
            <p className="text-sm font-semibold text-primary mt-0.5">
              {item.name}
            </p>
            {item.category?.name && (
              <span className="text-xs text-muted mt-0.5 block">
                Danh mục: {item.category.name}
              </span>
            )}
          </div>
        </div>

        {/* Status Transition Details */}
        <div className="bg-surface/40 p-3.5 rounded-lg border border-border flex flex-col gap-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted">Trạng thái hiện tại:</span>
            {item.status === 'AVAILABLE' ? (
              <Badge variant="ready">Đang phục vụ</Badge>
            ) : (
              <Badge variant="pending">Tạm ngưng</Badge>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted">Chuyển sang:</span>
            {isPausing ? (
              <Badge variant="pending">Tạm ngưng phục vụ</Badge>
            ) : (
              <Badge variant="ready">Đang phục vụ</Badge>
            )}
          </div>

          <p className="text-muted text-xs leading-relaxed pt-2 border-t border-border">
            {isPausing
              ? 'Món ăn sẽ tạm khóa. Các đơn đã đặt trước đó vẫn được giữ nguyên.'
              : 'Món ăn sẽ được mở bán lại và cho phép khách đặt bình thường.'}
          </p>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="h-9 px-3.5 text-xs"
          >
            Hủy bỏ
          </Button>

          <Button
            type="button"
            variant={isPausing ? 'destructive' : 'ready'}
            size="sm"
            isLoading={isLoading}
            onClick={onConfirm}
            className="h-9 px-4 text-xs font-semibold"
          >
            {isPausing ? 'Xác nhận Tạm ngưng' : 'Xác nhận Mở bán lại'}
          </Button>
        </div>
      </div>
    </div>
  )
}
