import { Trash2 } from 'lucide-react'
import type { CartItem } from '@/features/ordering/types/ordering.types'
import { CartItemCard } from '@/features/ordering/components/CartItemCard'
import { Button } from '@/shared/components/ui/button'
import { useCartStore } from '@/features/ordering/store/cartStore'

interface CartItemListProps {
  items: CartItem[]
}

export function CartItemList({ items }: CartItemListProps) {
  const { clearCart, getTotalItemCount } = useCartStore()

  return (
    <div className="flex flex-col gap-4">
      {/* List Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <h3 className="font-semibold text-lg text-text">
          Món ăn đã chọn ({getTotalItemCount()})
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearCart}
          className="text-xs text-muted hover:text-status-cancelled hover:bg-status-cancelled/10 h-8"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          Xóa giỏ hàng
        </Button>
      </div>

      {/* Items */}
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <CartItemCard key={item.menuItemId} item={item} />
        ))}
      </div>
    </div>
  )
}
