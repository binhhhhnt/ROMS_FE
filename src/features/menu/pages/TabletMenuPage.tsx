import { useState } from 'react'
import { RefreshCw, Search } from 'lucide-react'
import { useAuthStore } from '@/app/store/authStore'
import { Button } from '@/shared/components/ui/button'
import { useMenuItems } from '../hooks/useMenu'
import { useMenuFilters } from '../hooks/useMenuFilters'
import { MenuFilters } from '../components/MenuFilters'
import { MenuFeedback } from '../components/MenuFeedback'
import { MenuPagination } from '../components/MenuPagination'
import { TabletMenuCard } from '../components/TabletMenuCard'
import { getMenuErrorMessage } from '../utils/menu'

export function TabletMenuPage() {
  const user = useAuthStore((state) => state.user)
  const filters = useMenuFilters(true)
  const query = useMenuItems(filters.params, !filters.invalid)
  const [search, setSearch] = useState('')
  const data = query.data
  const visibleItems = data?.content.filter((item) => item.name.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi'))) ?? []
  const tableLabel = user?.tableName || (user?.tableId ? String(user.tableId).padStart(2, '0') : '—')

  return (
    <section className="flex flex-col gap-6 pb-8 md:gap-7">
      <header className="flex items-center justify-between gap-5 border-b border-border pb-6 md:pb-7">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Gọi món tại bàn · ROMS</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-primary md:text-3xl">Hôm nay, bạn muốn ăn gì?</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">Chọn món yêu thích, để bếp lo phần còn lại.</p>
        </div>
        <div className="flex min-w-20 shrink-0 flex-col items-center rounded-2xl bg-surface/50 px-4 py-3 text-primary md:min-w-24 md:px-5">
          <span className="text-[10px] font-medium tracking-wider text-muted">BẠN ĐANG Ở</span>
          <strong className="max-w-40 break-words text-center text-3xl font-semibold leading-tight md:text-4xl">{tableLabel}</strong>
          <span className="text-[10px] tracking-widest text-muted">BÀN</span>
        </div>
      </header>
      <MenuFilters params={filters.params} onChange={filters.change} onReset={filters.reset} tablet />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-primary">Món ngon dành cho bạn</h2>
          {data && <p className="mt-1 text-xs text-muted">{data.totalElements} món trong thực đơn{search.trim() ? ` · ${visibleItems.length} kết quả trên trang này` : ''}</p>}
        </div>
        <div className="flex max-w-full items-center gap-2">
          <label className="flex min-h-11 min-w-0 items-center gap-2 rounded-xl border border-border bg-card px-3 focus-within:ring-2 focus-within:ring-accent">
            <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Tìm món trên trang hiện tại"
              placeholder="Tìm món trên trang này..." className="w-48 min-w-0 bg-transparent py-2 text-sm text-text outline-none placeholder:text-muted" />
          </label>
          <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-xl" disabled={query.isFetching || filters.invalid} onClick={() => void query.refetch()} aria-label="Làm mới thực đơn">
            <RefreshCw className={`h-4 w-4 ${query.isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
          </Button>
        </div>
      </div>
      {filters.invalid ? <MenuFeedback message="Bộ lọc thực đơn không hợp lệ. Vui lòng đặt lại bộ lọc." retry={filters.reset} />
        : query.isPending ? <MenuFeedback message="Đang tải thực đơn..." loading />
        : query.isError ? <MenuFeedback message={getMenuErrorMessage(query.error)} retry={() => void query.refetch()} />
        : <>
          {visibleItems.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
            <h3 className="font-semibold text-primary">Chưa có món phù hợp</h3>
            <p className="mt-2 text-sm text-muted">{search.trim() ? 'Thử tên món khác hoặc xóa từ khóa để xem các món trên trang này.' : 'Vui lòng chọn danh mục khác hoặc làm mới thực đơn.'}</p>
            <Button className="mt-5 min-h-11 rounded-xl" variant="outline" onClick={() => { setSearch(''); filters.reset() }}>Xem tất cả món</Button>
          </div> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-5" aria-busy={query.isFetching}>
            {visibleItems.map((item) => <TabletMenuCard key={item.id} item={item} />)}
          </div>}
          {data && <MenuPagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} busy={query.isFetching} onPage={(page) => filters.change('page', String(page))} />}
        </>}
    </section>
  )
}
