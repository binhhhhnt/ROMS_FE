import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Minus, Plus, ShoppingBag, Trash2, UtensilsCrossed, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { qrApi } from '../api/qrApi'
import { useQrCartStore } from '../store/qrCartStore'
import { MenuImage } from '@/features/menu/components/MenuImage'
import { Button } from '@/shared/components/ui/button'
import { getApiErrorMessage } from '@/shared/lib/axios'

const formatPrice = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

export function QrCartPage() {
  const { qrToken = '' } = useParams<{ qrToken: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { items: cartItems, updateQuantity, removeItem, clearCart } = useQrCartStore()

  const totalQty = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  )

  const totalAmount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0),
    [cartItems]
  )

  const handleSubmitOrder = async () => {
    if (cartItems.length === 0 || isSubmitting) return
    setIsSubmitting(true)
    try {
      await qrApi.submitQrOrder(qrToken, {
        items: cartItems.map((c) => ({
          menuItemId: c.menuItem.id,
          quantity: c.quantity,
          note: c.note,
        })),
      })
      clearCart()
      await queryClient.invalidateQueries({ queryKey: ['qrOrders', qrToken] })
      navigate(`/qr/${qrToken}/orders`)
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
        <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center text-accent">
          <ShoppingBag className="w-7 h-7" />
        </div>
        <h2 className="font-bold text-base text-text">Giỏ hàng đang trống</h2>
        <p className="text-sm text-muted">
          Hãy chọn món từ thực đơn để thêm vào giỏ và gửi cho nhân viên.
        </p>
        <Link to={`/qr/${qrToken}/menu`}>
          <Button className="rounded-xl mt-1">
            <UtensilsCrossed className="w-4 h-4 mr-1.5" />
            Xem thực đơn
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-3 md:p-5 space-y-4 max-w-3xl w-full mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-base md:text-lg font-bold text-text">
          Giỏ gọi món ({totalQty} món)
        </h1>
        <button
          type="button"
          onClick={clearCart}
          className="text-xs font-semibold text-red-600 hover:underline"
        >
          Xóa tất cả
        </button>
      </div>

      <div className="space-y-2.5">
        {cartItems.map((line) => (
          <div
            key={`${line.menuItem.id}-${line.note || ''}`}
            className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border shadow-2xs"
          >
            <MenuImage
              src={line.menuItem.images?.[0]?.imageUrl}
              name={line.menuItem.name}
              className="w-16 h-16 rounded-xl shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-text truncate">
                {line.menuItem.name}
              </p>
              {line.note && (
                <p className="text-xs text-muted truncate mt-0.5">Ghi chú: {line.note}</p>
              )}
              <p className="text-sm font-bold text-primary mt-1">
                {formatPrice(line.menuItem.price * line.quantity)}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() =>
                  updateQuantity(line.menuItem.id, line.note, line.quantity - 1)
                }
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center bg-background"
                aria-label="Giảm số lượng"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center text-xs font-bold">{line.quantity}</span>
              <button
                type="button"
                onClick={() =>
                  updateQuantity(line.menuItem.id, line.note, line.quantity + 1)
                }
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center bg-background"
                aria-label="Tăng số lượng"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => removeItem(line.menuItem.id, line.note)}
                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                aria-label="Xóa món"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Tạm tính ({totalQty} món)</span>
          <span className="text-lg font-bold text-primary">
            {formatPrice(totalAmount)}
          </span>
        </div>
        <Button
          className="w-full h-11 rounded-xl font-semibold"
          disabled={isSubmitting || cartItems.length === 0}
          onClick={() => void handleSubmitOrder()}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              Đang gửi yêu cầu...
            </>
          ) : (
            'Gửi yêu cầu gọi món'
          )}
        </Button>
      </div>
    </div>
  )
}
