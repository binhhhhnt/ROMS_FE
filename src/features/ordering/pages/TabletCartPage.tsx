import { Link } from 'react-router-dom'
import { ShoppingCart, Utensils, ArrowLeft } from 'lucide-react'
import { useCartStore } from '@/features/ordering/store/cartStore'
import { CartItemList } from '@/features/ordering/components/CartItemList'
import { CartSummary } from '@/features/ordering/components/CartSummary'
import { Button } from '@/shared/components/ui/button'

export function TabletCartPage() {
  const { items } = useCartStore()

  const isEmpty = items.length === 0

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/tablet/menu">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-text">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-text">
              Giỏ hàng của bàn
            </h2>
            <p className="text-xs text-muted">
              Kiểm tra các món ăn trước khi chuyển bếp chế biến
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isEmpty ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center flex flex-col items-center justify-center my-6 shadow-sm">
          <div className="w-20 h-20 rounded-full bg-surface/60 flex items-center justify-center text-accent mb-4">
            <ShoppingCart className="w-10 h-10 text-accent/80" />
          </div>
          <h3 className="text-lg font-bold text-text mb-1">
            Giỏ hàng của bạn đang trống
          </h3>
          <p className="text-sm text-muted max-w-sm mb-6">
            Bàn của bạn chưa chọn món nào. Hãy khám phá thực đơn để thưởng thức các món ăn ngon miệng!
          </p>
          <div className="flex items-center gap-3">
            <Link to="/tablet/menu">
              <Button variant="primary" size="lg" className="font-semibold shadow-md">
                <Utensils className="w-4 h-4 mr-2" />
                Xem thực đơn ngay
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Items List */}
          <div className="lg:col-span-7 xl:col-span-8">
            <CartItemList items={items} />
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5 xl:col-span-4">
            <CartSummary />
          </div>
        </div>
      )}
    </div>
  )
}
export default TabletCartPage
