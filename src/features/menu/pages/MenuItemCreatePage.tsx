import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { menuApi } from '../api/menuApi'
import { MenuItemForm } from '../components/MenuItemForm'
import { MenuImageManager } from '../components/MenuImageManager'
import { MenuFeedback } from '../components/MenuFeedback'
import { useMenuItem, useRefreshMenu } from '../hooks/useMenu'
import { getMenuErrorMessage, positiveMenuId } from '../utils/menu'
import type { MenuItemWriteRequest } from '../types/menu.types'

export function MenuItemCreatePage() {
  const [search, setSearch] = useSearchParams()
  const createdValue = search.get('createdId')
  const createdId = positiveMenuId(createdValue)
  const query = useMenuItem(createdId)
  const refresh = useRefreshMenu()
  const create = async (values: MenuItemWriteRequest) => {
    const created = await menuApi.create(values)
    // Store the committed ID in the URL before image uploads, including after reload.
    setSearch({ createdId: String(created.id) }, { replace: true })
    toast.success('Đã tạo món. Bạn có thể tải ảnh ở bước tiếp theo.')
    await refresh()
  }
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <Link to="/owner/menu-items" className="text-sm font-medium text-accent hover:underline">← Danh sách món</Link>
      <header><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">Quản lý thực đơn</p><h1 className="text-2xl font-bold text-primary">Tạo món</h1><p className="mt-2 text-sm text-muted">Bước 1: lưu thông tin món. Bước 2: tải ảnh cho món đã tạo.</p></header>
      {createdValue !== null ? (
        createdId === null ? <MenuFeedback message="Mã món vừa tạo trong đường dẫn không hợp lệ." />
          : query.isPending ? <MenuFeedback message="Đang tải món đã tạo..." loading />
          : query.isError ? <MenuFeedback message={getMenuErrorMessage(query.error)} retry={() => void query.refetch()} />
          : query.data && <>
            <div role="status" className="rounded-xl border border-border bg-surface/40 p-5"><h2 className="font-bold text-primary">Đã lưu món “{query.data.name}”</h2><p className="mt-2 text-sm text-muted">Thông tin món đã được lưu. Lỗi tải ảnh không tạo lại món.</p><div className="mt-4 flex flex-wrap gap-4"><Link to={`/owner/menu-items/${createdId}`} className="text-sm font-semibold text-accent hover:underline">Xem và chỉnh sửa món</Link><Link to="/owner/menu-items/new" className="text-sm font-semibold text-accent hover:underline">Tạo món khác</Link></div></div>
            <MenuImageManager key={createdId} menuItemId={createdId} images={query.data.images} onChanged={refresh} />
          </>
      ) : <MenuItemForm onSave={create} />}
    </section>
  )
}
