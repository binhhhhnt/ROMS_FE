import { Link } from 'react-router-dom'
import { ArrowRight, Info } from 'lucide-react'
import { useCartStore } from '@/features/ordering/store/cartStore'

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
    <div className="grid gap-6 rounded-2xl border border-border bg-card p-5 md:grid-cols-[1fr_1fr] md:gap-10 md:p-6">
      <div className="flex flex-col gap-4">
        <h3 className="border-b border-border pb-3 text-lg font-semibold text-primary">Tóm tắt đơn gọi món</h3>
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between text-muted">
            <span>Tổng số lượng món</span>
            <span className="font-semibold text-text">{itemCount} phần</span>
          </div>
          <div className="my-1 h-px bg-border" />
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-base font-bold text-text">Tổng cộng</span>
            <span className="text-2xl font-extrabold text-primary">{formatPrice(totalAmount)}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-between gap-4">
        <div className="flex items-start gap-2.5 rounded-xl bg-surface/40 p-3 text-xs leading-relaxed text-text/80">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          <p>Món ăn sau khi gửi sẽ được chuyển trực tiếp vào bếp. Vui lòng kiểm tra kỹ danh sách món trước khi xác nhận.</p>
        </div>
        <Link to="/tablet/checkout" className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-accent">
          Kiểm tra và gửi đơn
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
