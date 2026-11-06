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
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md">
      <Link to={`/tablet/menu/${item.id}`} className="relative block focus-visible:outline-2 focus-visible:outline-accent" aria-label={`Xem chi tiết ${item.name}`}>
        <MenuImage src={orderedMenuImages(item.images)[0]?.imageUrl} name={item.name} className="aspect-[16/10] w-full" />
        {item.isFeatured && <span className="absolute left-3 top-3 rounded-md bg-card/95 px-2.5 py-1.5 text-[10px] font-bold tracking-wider text-primary shadow-sm">BẾP GỢI Ý</span>}
      </Link>
      <div className="flex flex-1 flex-col p-4 xl:p-5">
        <p className="text-xs text-muted">{item.category.name}</p>
        <h3 className="mt-1.5 text-lg font-bold leading-snug text-primary"><Link to={`/tablet/menu/${item.id}`} className="rounded focus-visible:outline-2 focus-visible:outline-accent">{item.name}</Link></h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{item.description || 'Món ngon được chuẩn bị tại bếp nhà hàng.'}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <strong className="text-lg font-bold tracking-tight text-primary">{formatMenuPrice(item.price)}</strong>
          <Button variant="secondary" size="icon" className="h-11 w-11 shrink-0 rounded-xl bg-surface/60 text-primary"
            aria-label={`Thêm một phần ${item.name} vào giỏ`} disabled={!sellable} isLoading={adding} onClick={() => void addOne()}>
            {!adding && <Plus className="h-5 w-5" aria-hidden="true" />}
          </Button>
        </div>
        {!sellable && <p className="mt-2 text-xs text-status-cancelled">Hiện chưa thể đặt món</p>}
      </div>
    </article>
  )
}
