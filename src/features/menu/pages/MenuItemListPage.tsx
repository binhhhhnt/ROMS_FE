import { Link } from 'react-router-dom'
import { Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { useMenuItems } from '../hooks/useMenu'
import { useMenuFilters } from '../hooks/useMenuFilters'
import { MenuFilters } from '../components/MenuFilters'
import { MenuFeedback } from '../components/MenuFeedback'
import { MenuPagination } from '../components/MenuPagination'
import { MenuStatusBadge } from '../components/MenuStatusBadge'
import { MenuImage } from '../components/MenuImage'
import { formatMenuPrice, getMenuErrorMessage, orderedMenuImages } from '../utils/menu'

export function MenuItemListPage() {
  const filters = useMenuFilters()
  const query = useMenuItems(filters.params, !filters.invalid)
  const data = query.data
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">Quản lý thực đơn</p><h1 className="text-2xl font-bold text-primary">Danh sách món</h1><p className="mt-2 text-sm text-muted">Theo dõi món ăn, danh mục và trạng thái phục vụ.</p></div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" disabled={query.isFetching || filters.invalid} onClick={() => void query.refetch()}><RefreshCw className={`h-4 w-4 ${query.isFetching ? 'animate-spin' : ''}`} />Làm mới</Button>
          <Link className="inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover focus-visible:outline-accent" to="/owner/menu-items/new"><Plus className="h-4 w-4" />Tạo món</Link>
        </div>
      </header>
      <MenuFilters params={filters.params} onChange={filters.change} onReset={filters.reset} />
      {filters.invalid ? <MenuFeedback message="Bộ lọc trong đường dẫn chưa hợp lệ. Vui lòng đặt lại bộ lọc." retry={filters.reset} />
        : query.isPending ? <MenuFeedback message="Đang tải danh sách món..." loading />
        : query.isError ? <MenuFeedback message={getMenuErrorMessage(query.error)} retry={() => void query.refetch()} />
        : <>
          {data?.content.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center"><h2 className="font-semibold text-primary">Không có món phù hợp</h2><p className="mt-2 text-sm text-muted">Thử đổi bộ lọc hoặc tạo món mới.</p><Button variant="outline" className="mt-4" onClick={filters.reset}>Về danh sách đầu tiên</Button></div>
            : <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm" aria-busy={query.isFetching}>
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Danh sách món theo danh mục và trạng thái</caption>
                <thead className="bg-surface/30 text-xs text-muted"><tr><th scope="col" className="px-5 py-4">Món ăn</th><th scope="col" className="px-5 py-4">Danh mục</th><th scope="col" className="px-5 py-4">Giá</th><th scope="col" className="px-5 py-4">Trạng thái</th><th scope="col" className="px-5 py-4">Khả dụng hiện tại</th></tr></thead>
                <tbody className="divide-y divide-border">
                  {data?.content.map((item) => <tr key={item.id} className="hover:bg-surface/20">
                    <th scope="row" className="min-w-56 px-5 py-4"><div className="flex items-center gap-3"><MenuImage src={orderedMenuImages(item.images)[0]?.imageUrl} name={item.name} className="h-14 w-14 shrink-0 rounded-lg" /><div><Link className="font-semibold text-primary hover:underline focus-visible:outline-accent" to={`/owner/menu-items/${item.id}`}>{item.name}</Link>{item.isFeatured && <div className="mt-1"><Badge variant="secondary">Nổi bật</Badge></div>}</div></div></th>
                    <td className="px-5 py-4 text-muted">{item.category.name}</td>
                    <td className="whitespace-nowrap px-5 py-4 font-semibold">{formatMenuPrice(item.price)}</td>
                    <td className="whitespace-nowrap px-5 py-4"><MenuStatusBadge status={item.status} /></td>
                    <td className="min-w-44 px-5 py-4 text-muted">{item.availability.sellable ? 'Có thể đặt món' : 'Hiện chưa thể đặt món'}</td>
                  </tr>)}
                </tbody>
              </table>
            </div>}
          {data && <MenuPagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} busy={query.isFetching} onPage={(page) => filters.change('page', String(page))} />}
        </>}
    </section>
  )
}
