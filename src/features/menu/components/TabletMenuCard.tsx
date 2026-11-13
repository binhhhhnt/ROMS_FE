import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/app/store/authStore'
import { useCartStore } from '@/features/ordering/store/cartStore'
import { Button } from '@/shared/components/ui/button'
import { menuApi } from '../api/menuApi'
import type { MenuItemReadResponse } from '../types/menu.types'
import { formatMenuPrice, getMenuErrorMessage, orderedMenuImages } from '../utils/menu'
import { MenuImage } from './MenuImage'

export function TabletMenuCard({ item }: { item: MenuItemReadResponse }) {
  const [adding, setAdding] = useState(false)
  const addingRef = useRef(false)
  const sellable = item.availability.sellable && item.status === 'AVAILABLE'

  const addOne = async () => {
    if (addingRef.current || !sellable) return
    addingRef.current = true
    setAdding(true)
    const user = useAuthStore.getState().user
    const before = useCartStore.getState().items.find((entry) => entry.menuItemId === item.id)?.quantity ?? 0
    try {
      if (!Number.isSafeInteger(before + 1) || before + 1 > 2147483647) {
        toast.error('Số lượng món đã đạt giới hạn cho phép.')
        return
      }
      const latest = await menuApi.detail(item.id, before + 1)
      const currentUser = useAuthStore.getState().user
      if (!user || currentUser?.id !== user.id || currentUser.role !== user.role || currentUser.tableId !== user.tableId) {
        toast.error('Thông tin tài khoản đã thay đổi. Vui lòng tải lại thực đơn.')
        return
      }
      const current = useCartStore.getState().items.find((entry) => entry.menuItemId === item.id)
      if ((current?.quantity ?? 0) !== before) {
        toast.error('Giỏ hàng vừa thay đổi. Vui lòng thử thêm món lại.')
        return
      }
      if (!latest.availability.sellable || latest.status !== 'AVAILABLE') {
        toast.error('Món hiện chưa thể đặt thêm. Vui lòng chọn món khác hoặc xem chi tiết.')
        return
      }
      if (current && current.price !== latest.price) {
        toast.error('Giá món đã thay đổi. Vui lòng xóa món cũ trong giỏ rồi thêm lại.')
        return
      }
      useCartStore.getState().addItem({
        menuItemId: latest.id, name: latest.name, price: latest.price,
        imageUrl: orderedMenuImages(latest.images)[0]?.imageUrl,
      })
      toast.success(`Đã thêm 1 phần ${latest.name} vào giỏ.`)
    } catch (error) {
      toast.error(getMenuErrorMessage(error))
    } finally {
      addingRef.current = false
      setAdding(false)
    }
  }

  return (
    <article
      className={`group flex min-w-0 flex-col overflow-hidden rounded-2xl border transition-all ${
        sellable
          ? 'border-border bg-card hover:shadow-md'
          : 'border-border/60 bg-card/60 opacity-60 grayscale-[35%] select-none'
      }`}
    >
      <Link
        to={sellable ? `/tablet/menu/${item.id}` : '#'}
        onClick={(e) => {
          if (!sellable) e.preventDefault()
        }}
        className={`relative block focus-visible:outline-2 focus-visible:outline-accent ${
          !sellable ? 'cursor-not-allowed pointer-events-none' : ''
        }`}
        aria-label={sellable ? `Xem chi tiết ${item.name}` : `${item.name} đã hết món`}
        tabIndex={sellable ? 0 : -1}
      >
        <MenuImage src={orderedMenuImages(item.images)[0]?.imageUrl} name={item.name} className="aspect-[16/10] w-full" />
        {item.isFeatured && (
          <span className="absolute left-3 top-3 rounded-md bg-card/95 px-2.5 py-1.5 text-[10px] font-bold tracking-wider text-primary shadow-sm">
            HOT
          </span>
        )}
        {!sellable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
            <span className="rounded-full bg-slate-900/90 px-4 py-1.5 text-xs font-black tracking-wider text-white shadow-md border border-white/20 uppercase">
              HẾT
            </span>
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4 xl:p-5">
        <p className="text-xs text-muted">{item.category.name}</p>
        <h3 className="mt-1.5 text-lg font-bold leading-snug text-primary">
          <Link
            to={sellable ? `/tablet/menu/${item.id}` : '#'}
            onClick={(e) => {
              if (!sellable) e.preventDefault()
            }}
            className={`rounded focus-visible:outline-2 focus-visible:outline-accent ${
              !sellable ? 'cursor-not-allowed pointer-events-none text-muted' : ''
            }`}
            tabIndex={sellable ? 0 : -1}
          >
            {item.name}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{item.description || 'Món ngon được chuẩn bị tại bếp nhà hàng.'}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <strong className={`text-lg font-bold tracking-tight ${sellable ? 'text-primary' : 'text-muted line-through'}`}>
            {formatMenuPrice(item.price)}
          </strong>
          {sellable ? (
            <Button
              variant="secondary"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-xl bg-surface/60 text-primary"
              aria-label={`Thêm một phần ${item.name} vào giỏ`}
              disabled={!sellable}
              isLoading={adding}
              onClick={() => void addOne()}
            >
              {!adding && <Plus className="h-5 w-5" aria-hidden="true" />}
            </Button>
          ) : (
            <span className="inline-flex items-center justify-center h-11 px-3 rounded-xl bg-surface/40 text-xs font-bold text-muted border border-border/50 cursor-not-allowed select-none">
              Hết món
            </span>
          )}
        </div>
        {!sellable && <p className="mt-2 text-xs font-medium text-rose-500">Tạm ngưng phục vụ</p>}
      </div>
    </article>
  )
}
