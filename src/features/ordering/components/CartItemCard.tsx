import { useState } from 'react'
import { Plus, Minus, Trash2, Edit3, Check, Utensils } from 'lucide-react'
import type { CartItem } from '@/features/ordering/types/ordering.types'
import { useCartStore } from '@/features/ordering/store/cartStore'
import { Button } from '@/shared/components/ui/button'

interface CartItemCardProps {
  item: CartItem
}

export function CartItemCard({ item }: CartItemCardProps) {
  const { updateQuantity, updateNote, removeItem } = useCartStore()
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [noteValue, setNoteValue] = useState(item.note || '')

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const handleSaveNote = () => {
    updateNote(item.menuItemId, noteValue.trim())
    setIsEditingNote(false)
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm transition-all hover:border-accent/40 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      {/* Dish Image & Info */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-surface flex items-center justify-center overflow-hidden shrink-0 border border-border">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Utensils className="w-8 h-8 text-primary/40" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-base text-text truncate">
            {item.name}
          </h4>
          <div className="text-sm text-accent font-medium mt-0.5">
            {formatPrice(item.price)}
          </div>

          {/* Note Display or Input */}
          {isEditingNote ? (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
                placeholder="Ghi chú cho bếp (vd: không cay, ít đá...)"
                className="text-xs px-2.5 py-1.5 border border-accent rounded bg-card text-text w-full max-w-xs focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveNote}
                className="p-1.5 rounded bg-primary text-white hover:bg-primary-hover"
                title="Lưu ghi chú"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="mt-1 flex items-center gap-2">
              {item.note ? (
                <p className="text-xs text-muted italic bg-surface/40 px-2 py-0.5 rounded border border-border/50 truncate max-w-xs">
                  Ghi chú: {item.note}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => setIsEditingNote(true)}
                className="text-[11px] text-accent hover:underline flex items-center gap-1 font-medium"
              >
                <Edit3 className="w-3 h-3" />
                {item.note ? 'Sửa' : '+ Ghi chú'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quantity & Action Controls */}
      <div className="flex items-center justify-between w-full sm:w-auto gap-4 sm:gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
        {/* Quantity Stepper (Touch-Friendly) */}
        <div className="flex items-center border border-border rounded-lg bg-surface/30 overflow-hidden shadow-inner">
          <button
            type="button"
            onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
            className="w-9 h-9 flex items-center justify-center text-text hover:bg-surface transition-colors active:scale-95 cursor-pointer"
            aria-label="Giảm số lượng"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-10 text-center font-bold text-sm text-text select-none">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
            className="w-9 h-9 flex items-center justify-center text-text hover:bg-surface transition-colors active:scale-95 cursor-pointer"
            aria-label="Tăng số lượng"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Item Total */}
        <div className="text-right min-w-[90px]">
          <span className="font-bold text-base text-primary">
            {formatPrice(item.price * item.quantity)}
          </span>
        </div>

        {/* Delete Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => removeItem(item.menuItemId)}
          className="text-muted hover:text-status-cancelled hover:bg-status-cancelled/10 w-9 h-9"
          title="Xóa món"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
