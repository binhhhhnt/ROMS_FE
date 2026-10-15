import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, PackageX } from 'lucide-react'
import type { InsufficientStockDetails } from '@/features/ordering/types/ordering.types'
import { Button } from '@/shared/components/ui/button'

interface StockConflictAlertProps {
  details: InsufficientStockDetails | null
  message?: string
}

export function StockConflictAlert({
  details,
  message = 'Không thể gửi đơn do nguyên liệu tồn kho không đủ để chế biến.',
}: StockConflictAlertProps) {
  return (
    <div className="bg-red-50 border border-status-cancelled/30 rounded-xl p-5 text-text flex flex-col gap-4 shadow-sm animate-in fade-in duration-300">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-status-cancelled/15 text-status-cancelled shrink-0">
          <PackageX className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-base text-status-cancelled">
            Xung đột tồn kho nguyên liệu (409 Conflict)
          </h4>
          <p className="text-xs text-text/80 mt-1 leading-relaxed">
            {message} Giỏ hàng của bạn đã được giữ nguyên để bạn có thể giảm số lượng hoặc đổi món khác.
          </p>
        </div>
      </div>

      {details?.affectedMenuItems && details.affectedMenuItems.length > 0 && (
        <div className="bg-white/80 rounded-lg p-3.5 border border-status-cancelled/20 flex flex-col gap-2">
          <span className="text-xs font-semibold text-text flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-status-pending" />
            Các món ăn bị ảnh hưởng:
          </span>
          <ul className="text-xs text-text flex flex-col gap-1.5 pl-2">
            {details.affectedMenuItems.map((item) => (
              <li
                key={item.menuItemId}
                className="flex items-center justify-between bg-red-50/50 px-2 py-1 rounded"
              >
                <span className="font-medium text-text">{item.menuItemName}</span>
                <span className="text-status-cancelled font-semibold">
                  (Đã chọn: {item.requestedQuantity} phần)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {details?.insufficientIngredients && details.insufficientIngredients.length > 0 && (
        <div className="text-xs text-muted flex items-center gap-1.5">
          <span>Nguyên liệu thiếu:</span>
          <span className="font-medium text-text">
            {details.insufficientIngredients
              .map((ing) => ing.ingredientName)
              .join(', ')}
          </span>
        </div>
      )}

      <div className="pt-2 flex justify-end">
        <Link to="/tablet/cart">
          <Button
            variant="destructive"
            size="sm"
            className="font-medium shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Quay lại chỉnh sửa giỏ hàng
          </Button>
        </Link>
      </div>
    </div>
  )
}
