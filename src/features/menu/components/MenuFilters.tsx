import { Button } from '@/shared/components/ui/button'
import { useMenuCategoryOptions } from '../hooks/useMenu'
import { menuStatuses, type MenuListParams } from '../types/menu.types'
import { menuControlClass, menuStatusLabels } from '../utils/menu'

export function MenuFilters({ params, onChange, onReset, tablet = false }: {
  params: MenuListParams; onChange: (field: string, value: string) => void; onReset: () => void; tablet?: boolean
}) {
  const categories = useMenuCategoryOptions()
  const options = categories.data?.filter((category) => !tablet || category.isActive) ?? []
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-40 flex-1"><label htmlFor="menu-category-filter" className="mb-2 block text-sm font-semibold">Danh mục</label>
          <select id="menu-category-filter" className={menuControlClass} value={params.categoryId ?? ''} onChange={(event) => onChange('categoryId', event.target.value)} disabled={categories.isPending || categories.isError}>
            <option value="">Tất cả danh mục</option>
            {params.categoryId && !options.some((category) => category.id === params.categoryId) && <option value={params.categoryId}>Danh mục #{params.categoryId}</option>}
            {options.map((category) => <option key={category.id} value={category.id}>{category.name}{category.isActive ? '' : ' (ngừng hoạt động)'}</option>)}
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
