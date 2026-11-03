import { Link } from 'react-router-dom'
import { ShoppingCart, Utensils, ArrowLeft, Plus } from 'lucide-react'
import { useCartStore } from '@/features/ordering/store/cartStore'
import { CartItemList } from '@/features/ordering/components/CartItemList'
import { CartSummary } from '@/features/ordering/components/CartSummary'

export function TabletCartPage() {
  const items = useCartStore((state) => state.items)
  const isEmpty = items.length === 0

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-6 pb-8">
      <Link to="/tablet/menu" className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg text-sm font-semibold text-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-accent">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />Về thực đơn
      </Link>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Gọi món tại bàn · ROMS</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-primary md:text-3xl">Giỏ hàng của bạn</h1>
          <p className="mt-2 text-sm text-muted">Món ngon đã chọn, kiểm tra một chút trước khi gửi bếp nhé.</p>
        </div>
        {!isEmpty && <Link to="/tablet/menu" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-primary transition-colors hover:bg-surface/40">
          <Plus className="h-4 w-4" aria-hidden="true" />Chọn thêm món
        </Link>}
      </header>
      {isEmpty ? <div className="flex flex-col items-center rounded-2xl border border-border bg-card px-6 py-16 text-center">
        <span className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-surface/50"><ShoppingCart className="h-8 w-8 text-accent" aria-hidden="true" /></span>
        <h2 className="text-xl font-bold text-primary">Giỏ hàng đang chờ món ngon</h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">Khám phá thực đơn và chọn món yêu thích cho bàn của bạn.</p>
        <Link to="/tablet/menu" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white hover:bg-primary-hover">
          <Utensils className="h-4 w-4" aria-hidden="true" />Khám phá thực đơn
        </Link>
      </div> : <>
        <CartItemList items={items} />
        <CartSummary />
      </>}
    </section>
  )
}

export default TabletCartPage
