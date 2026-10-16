import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Minus, Plus, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/app/store/authStore'
import { useCartStore } from '@/features/ordering/store/cartStore'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import { menuApi } from '../api/menuApi'
import { useMenuItem } from '../hooks/useMenu'
import { MenuFeedback } from '../components/MenuFeedback'
import { MenuItemGallery } from '../components/MenuItemGallery'
import { formatMenuPrice, getMenuErrorMessage, orderedMenuImages, positiveMenuId } from '../utils/menu'

export function TabletMenuItemDetailPage() {
  const { itemId } = useParams()
  const id = positiveMenuId(itemId)
  return <TabletMenuItemDetail key={itemId} id={id} />
}

function TabletMenuItemDetail({ id }: { id: number | null }) {
  const [quantityText, setQuantityText] = useState('1')
  const [adding, setAdding] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const addingRef = useRef(false)
  const cartQuantity = useCartStore((state) => state.items.find((item) => item.menuItemId === id)?.quantity ?? 0)
  const quantity = Number(quantityText)
  const totalQuantity = cartQuantity + quantity
  const validQuantity = /^\d+$/.test(quantityText) && Number.isInteger(quantity) && quantity > 0
    && Number.isSafeInteger(totalQuantity) && totalQuantity <= 2147483647
  const baseQuery = useMenuItem(id)
  const checkedQuery = useMenuItem(id, validQuantity ? totalQuantity : 1, validQuantity)
  const item = baseQuery.data
  const checked = checkedQuery.data

  const changeQuantity = (value: string) => {
    if (addingRef.current) return
    setQuantityText(value)
    setFeedback(null)
  }

  const addToCart = async () => {
    if (id === null || !validQuantity || addingRef.current) return
    addingRef.current = true
    setAdding(true)
    setFeedback(null)
    const user = useAuthStore.getState().user
    const existing = useCartStore.getState().items.find((entry) => entry.menuItemId === id)
    const beforeQuantity = existing?.quantity ?? 0
    const requested = beforeQuantity + quantity
    try {
      // Fresh REST detail checks both catalog visibility and the combined cart quantity.
      const latest = await menuApi.detail(id, requested)
      const currentUser = useAuthStore.getState().user
      if (!user || currentUser?.id !== user.id || currentUser.role !== user.role || currentUser.tableId !== user.tableId) {
        setFeedback('Thông tin tài khoản đã thay đổi. Vui lòng mở lại món ăn trước khi thêm vào giỏ.')
        return
      }
      const current = useCartStore.getState().items.find((entry) => entry.menuItemId === id)
      if ((current?.quantity ?? 0) !== beforeQuantity) {
        setFeedback('Giỏ hàng vừa thay đổi. Vui lòng kiểm tra số lượng và thêm lại.')
        return
      }
      if (!latest.availability.sellable || latest.status !== 'AVAILABLE') {
        setFeedback('Món hiện chưa đủ điều kiện đặt với số lượng này. Vui lòng chọn lại số lượng hoặc món khác.')
        await checkedQuery.refetch()
        return
      }
      if (current && current.price !== latest.price) {
        setFeedback('Giá món trong giỏ đã thay đổi. Vui lòng xóa món cũ trong giỏ rồi thêm lại để cập nhật giá.')
        return
      }
      useCartStore.getState().addItem({
        menuItemId: latest.id,
        name: latest.name,
        price: latest.price,
        imageUrl: orderedMenuImages(latest.images)[0]?.imageUrl,
      }, quantity)
      toast.success(`Đã thêm ${quantity} phần ${latest.name} vào giỏ.`)
    } catch (error) {
      setFeedback(getMenuErrorMessage(error))
      void baseQuery.refetch()
      void checkedQuery.refetch()
    } finally {
      addingRef.current = false
      setAdding(false)
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-8">
      <div className="flex items-center justify-between gap-4"><Link to="/tablet/menu" className="text-sm font-semibold text-accent hover:underline">← Về thực đơn</Link><Link to="/tablet/cart" className="text-sm font-semibold text-accent hover:underline">Xem giỏ hàng</Link></div>
      {id === null ? <MenuFeedback message="Mã món không hợp lệ." />
        : baseQuery.isPending ? <MenuFeedback message="Đang tải món ăn..." loading />
        : baseQuery.isError ? <MenuFeedback message={getMenuErrorMessage(baseQuery.error)} retry={() => void baseQuery.refetch()} />
        : item && <div className="grid items-start gap-6 md:grid-cols-2 lg:gap-10">
          <MenuItemGallery key={item.id} images={item.images} name={item.name} />
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-center gap-2"><span className="text-sm text-muted">{item.category.name}</span>{item.isFeatured && <Badge variant="secondary">Món nổi bật</Badge>}</div>
            <h1 className="mt-3 break-words text-2xl font-bold text-primary">{item.name}</h1>
            <p className="mt-4 text-2xl font-bold text-primary">{formatMenuPrice(checked?.price ?? item.price)}</p>
            <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted">{item.description || 'Món ăn được phục vụ tại nhà hàng.'}</p>
            <div className="mt-6 border-t border-border pt-5">
              <label htmlFor="tablet-menu-quantity" className="mb-3 block text-sm font-semibold">Số lượng thêm vào giỏ</label>
              <div className="flex items-center gap-3">
                <Button size="icon" variant="outline" aria-label="Giảm số lượng" disabled={adding || !validQuantity || quantity <= 1} onClick={() => changeQuantity(String(quantity - 1))}><Minus className="h-5 w-5" /></Button>
                <div className="w-24"><Input id="tablet-menu-quantity" type="number" min="1" step="1" value={quantityText} disabled={adding} aria-invalid={!validQuantity} aria-describedby="tablet-menu-quantity-feedback" className="text-center" onChange={(event) => changeQuantity(event.target.value)} /></div>
                <Button size="icon" variant="outline" aria-label="Tăng số lượng" disabled={adding || !validQuantity || totalQuantity >= 2147483647} onClick={() => changeQuantity(String(quantity + 1))}><Plus className="h-5 w-5" /></Button>
              </div>
              <div id="tablet-menu-quantity-feedback" aria-live="polite" className="mt-3 text-sm">
                {!validQuantity ? <p className="text-status-cancelled">Vui lòng nhập số lượng nguyên dương trong phạm vi cho phép.</p>
                  : checkedQuery.isFetching ? <p className="text-muted">Đang kiểm tra khả dụng cho {totalQuantity} phần...</p>
                  : checkedQuery.isError ? <p className="text-status-cancelled">{getMenuErrorMessage(checkedQuery.error)} <button className="underline" onClick={() => void checkedQuery.refetch()}>Thử lại</button></p>
                  : checked && <p className={checked.availability.sellable && checked.status === 'AVAILABLE' ? 'text-accent' : 'text-status-cancelled'}>{checked.availability.sellable && checked.status === 'AVAILABLE' ? 'Có thể thêm món với số lượng đã chọn.' : 'Hiện chưa thể đặt món với số lượng này.'}</p>}
              </div>
              {cartQuantity > 0 && <p className="mt-2 text-xs text-muted">Giỏ hiện có {cartQuantity} phần món này. Khả dụng được kiểm tra cho tổng {validQuantity ? totalQuantity : '—'} phần.</p>}
              <p className="mt-4 text-xs leading-relaxed text-muted">Khả dụng có thể thay đổi. Hệ thống sẽ kiểm tra lại toàn bộ giỏ khi gửi đơn đặt món.</p>
              {feedback && <p role="alert" className="mt-4 rounded-lg bg-status-cancelled/5 p-3 text-sm text-status-cancelled">{feedback}</p>}
              <Button size="lg" className="mt-5 w-full" isLoading={adding}
                disabled={!validQuantity || checkedQuery.isFetching || checkedQuery.isError || !checked?.availability.sellable || checked.status !== 'AVAILABLE'} onClick={() => void addToCart()}>
                <ShoppingCart className="h-5 w-5" />Thêm vào giỏ
              </Button>
            </div>
          </div>
        </div>}
    </section>
  )
}
