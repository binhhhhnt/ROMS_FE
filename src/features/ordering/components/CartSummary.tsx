import { Link } from 'react-router-dom'
import { ArrowRight, Utensils, Info } from 'lucide-react'
import { useCartStore } from '@/features/ordering/store/cartStore'
import { Button } from '@/shared/components/ui/button'

export function CartSummary() {
  const { getTotalAmount, getTotalItemCount } = useCartStore()

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const totalAmount = getTotalAmount()
  const itemCount = getTotalItemCount()

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col gap-5 sticky top-24">
      <h3 className="font-semibold text-lg text-text border-b border-border pb-3">
        Tóm tắt đơn gọi món
      </h3>

      <div className="flex flex-col gap-3 text-sm">
        <div className="flex items-center justify-between text-muted">
          <span>Tổng số lượng món</span>
          <span className="font-semibold text-text">{itemCount} phần</span>
        </div>

        <div className="flex items-center justify-between text-muted">
          <span>Tạm tính</span>
          <span className="font-semibold text-text">{formatPrice(totalAmount)}</span>
        </div>

        <div className="h-px bg-border my-1" />

        <div className="flex items-baseline justify-between">
          <span className="font-bold text-base text-text">Tổng cộng</span>
          <span className="font-extrabold text-2xl text-primary">
            {formatPrice(totalAmount)}
          </span>
        </div>
      </div>

      {/* Notice box */}
      <div className="p-3 bg-surface/50 rounded-lg border border-surface flex items-start gap-2.5 text-xs text-text/80 leading-relaxed">
        <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <p>
          Món ăn sau khi gửi sẽ được chuyển trực tiếp vào bếp. Vui lòng kiểm tra kỹ danh sách món trước khi xác nhận.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2.5 pt-2">
        <Link to="/tablet/checkout" className="w-full">
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full font-bold shadow-md uppercase tracking-wider"
          >
            Tiến hành gửi đơn
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>

        <Link to="/tablet/menu" className="w-full">
          <Button
            type="button"
            variant="outline"
            size="md"
            className="w-full font-medium"
          >
            <Utensils className="w-4 h-4 mr-2 text-accent" />
            Tiếp tục xem thực đơn
          </Button>
        </Link>
      </div>
    </div>
  )
}
