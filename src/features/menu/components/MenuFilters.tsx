import { Button } from '@/shared/components/ui/button'
import { useMenuCategoryOptions } from '../hooks/useMenu'
import { menuStatuses, type MenuListParams } from '../types/menu.types'
import { menuControlClass, menuStatusLabels } from '../utils/menu'

export function MenuFilters({ params, onChange, onReset, tablet = false }: {
  params: MenuListParams; onChange: (field: string, value: string) => void; onReset: () => void; tablet?: boolean
}) {
  const categories = useMenuCategoryOptions()
  const options = categories.data?.filter((category) => !tablet || category.isActive) ?? []
  if (tablet) return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 flex-wrap gap-2" role="group" aria-label="Danh mục món ăn">
          <button type="button" onClick={() => onChange('categoryId', '')} aria-pressed={!params.categoryId}
            className={`min-h-11 rounded-full border px-5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${!params.categoryId ? 'border-primary bg-primary text-white' : 'border-border bg-card text-muted hover:border-accent hover:text-primary'}`}>Tất cả</button>
          {options.map((category) => <button key={category.id} type="button" onClick={() => onChange('categoryId', String(category.id))}
            aria-pressed={params.categoryId === category.id}
            className={`min-h-11 rounded-full border px-5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${params.categoryId === category.id ? 'border-primary bg-primary text-white' : 'border-border bg-card text-muted hover:border-accent hover:text-primary'}`}>{category.name}</button>)}
          {params.categoryId && !options.some((category) => category.id === params.categoryId) && <button type="button" aria-pressed="true" className="min-h-11 rounded-full border border-primary bg-primary px-5 text-sm text-white">Danh mục #{params.categoryId}</button>}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="menu-sort" className="sr-only">Sắp xếp món ăn</label>
          <select id="menu-sort" className={`${menuControlClass} min-h-11 min-w-40 rounded-xl`} value={params.sort} onChange={(event) => onChange('sort', event.target.value)}>
            <option value="id,asc">Thứ tự thêm: cũ → mới</option>
            <option value="name,asc">Tên A → Z</option><option value="name,desc">Tên Z → A</option>
            <option value="price,asc">Giá tăng dần</option><option value="price,desc">Giá giảm dần</option>
          </select>
          {(params.categoryId || params.sort !== 'id,asc') && <Button variant="ghost" className="min-h-11 whitespace-nowrap text-muted" onClick={onReset}>Đặt lại</Button>}
        </div>
      </div>
      {categories.isPending && <p role="status" className="text-sm text-muted">Đang tải danh mục...</p>}
      {categories.isError && <p role="alert" className="text-sm text-status-cancelled">Không thể tải danh mục. <button className="min-h-11 underline" onClick={() => void categories.refetch()}>Thử lại</button></p>}
    </div>
  )
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-40 flex-1"><label htmlFor="menu-category-filter" className="mb-2 block text-sm font-semibold">Danh mục</label>
          <select id="menu-category-filter" className={menuControlClass} value={params.categoryId ?? ''} onChange={(event) => onChange('categoryId', event.target.value)} disabled={categories.isPending || categories.isError}>
            <option value="">Tất cả danh mục</option>
            {params.categoryId && !options.some((category) => category.id === params.categoryId) && <option value={params.categoryId}>Danh mục #{params.categoryId}</option>}
            {options.map((category) => <option key={category.id} value={category.id}>{category.name}{category.isActive ? '' : ' (tạm ngưng phục vụ)'}</option>)}
          </select>
        </div>
        {!tablet && <div className="min-w-48 flex-1"><label htmlFor="menu-status-filter" className="mb-2 block text-sm font-semibold">Trạng thái</label>
          <select id="menu-status-filter" className={menuControlClass} value={params.status ?? ''} onChange={(event) => onChange('status', event.target.value)}>
            <option value="">Tất cả trạng thái</option>
            {menuStatuses.map((status) => <option key={status} value={status}>{menuStatusLabels[status]}</option>)}
          </select>
        </div>}
        <div className="min-w-40 flex-1"><label htmlFor="menu-sort" className="mb-2 block text-sm font-semibold">Sắp xếp</label>
          <select id="menu-sort" className={menuControlClass} value={params.sort} onChange={(event) => onChange('sort', event.target.value)}>
            <option value="id,asc">Thứ tự thêm: cũ → mới</option>
            <option value="name,asc">Tên A → Z</option><option value="name,desc">Tên Z → A</option>
            <option value="price,asc">Giá tăng dần</option><option value="price,desc">Giá giảm dần</option>
          </select>
        </div>
        <Button variant="outline" onClick={onReset}>Đặt lại</Button>
      </div>
      {categories.isPending && <p role="status" className="mt-3 text-sm text-muted">Đang tải danh mục...</p>}
      {categories.isError && <p role="alert" className="mt-3 text-sm text-status-cancelled">Không thể tải bộ lọc danh mục. <button className="underline" onClick={() => void categories.refetch()}>Thử lại</button></p>}
    </div>
  )
}
