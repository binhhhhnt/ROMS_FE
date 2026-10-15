import { Link } from 'react-router-dom'
import { RefreshCw, ShoppingCart } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { useCartStore } from '@/features/ordering/store/cartStore'
import { useMenuItems } from '../hooks/useMenu'
import { useMenuFilters } from '../hooks/useMenuFilters'
import { MenuFilters } from '../components/MenuFilters'
import { MenuFeedback } from '../components/MenuFeedback'
import { MenuPagination } from '../components/MenuPagination'
import { MenuImage } from '../components/MenuImage'
import { formatMenuPrice, getMenuErrorMessage, orderedMenuImages } from '../utils/menu'

export function TabletMenuPage() {
  const filters = useMenuFilters(true)
  const query = useMenuItems(filters.params, !filters.invalid)
  const cartCount = useCartStore((state) => state.items.reduce((count, item) => count + item.quantity, 0))
  const data = query.data
  return (
    <section className="flex flex-col gap-6 pb-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">Món ngon tại bàn</p><h1 className="text-2xl font-bold text-primary">Thực đơn hôm nay</h1><p className="mt-2 text-sm text-muted">Chọn món yêu thích và xem chi tiết để thêm vào giỏ.</p></div>
        <div className="flex items-center gap-3"><Button variant="outline" disabled={query.isFetching || filters.invalid} onClick={() => void query.refetch()} aria-label="Làm mới thực đơn"><RefreshCw className={`h-4 w-4 ${query.isFetching ? 'animate-spin' : ''}`} /></Button><Link to="/tablet/cart" className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover"><ShoppingCart className="h-5 w-5" />Giỏ hàng ({cartCount})</Link></div>
      </header>
      <MenuFilters params={filters.params} onChange={filters.change} onReset={filters.reset} tablet />
      {filters.invalid ? <MenuFeedback message="Bộ lọc thực đơn không hợp lệ. Vui lòng đặt lại bộ lọc." retry={filters.reset} />
        : query.isPending ? <MenuFeedback message="Đang tải thực đơn..." loading />
        : query.isError ? <MenuFeedback message={getMenuErrorMessage(query.error)} retry={() => void query.refetch()} />
        : <>
          {data?.content.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center"><h2 className="font-semibold text-primary">Chưa có món phù hợp</h2><p className="mt-2 text-sm text-muted">Vui lòng chọn danh mục khác hoặc làm mới thực đơn.</p><Button className="mt-4" variant="outline" onClick={filters.reset}>Xem tất cả món</Button></div>
            : <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy={query.isFetching}>
              {data?.content.map((item) => <article key={item.id} className="flex overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <Link to={`/tablet/menu/${item.id}`} className="flex w-full flex-col focus-visible:outline-2 focus-visible:outline-accent">
                  <MenuImage src={orderedMenuImages(item.images)[0]?.imageUrl} name={item.name} className="aspect-[4/3] w-full" />
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <div className="flex flex-wrap items-center gap-2"><span className="text-xs text-muted">{item.category.name}</span>{item.isFeatured && <Badge variant="secondary">Món nổi bật</Badge>}</div>
                    <h2 className="text-lg font-bold text-primary">{item.name}</h2>
                    <p className="line-clamp-2 text-sm text-muted">{item.description || 'Xem chi tiết món ăn'}</p>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2"><strong className="text-lg text-primary">{formatMenuPrice(item.price)}</strong><span className={`text-xs font-semibold ${item.availability.sellable ? 'text-accent' : 'text-status-cancelled'}`}>{item.availability.sellable ? 'Xem và chọn món →' : 'Hiện chưa thể đặt món'}</span></div>
                  </div>
                </Link>
              </article>)}
            </div>}
          {data && <MenuPagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} busy={query.isFetching} onPage={(page) => filters.change('page', String(page))} />}
        </>}
    </section>
  )
}
