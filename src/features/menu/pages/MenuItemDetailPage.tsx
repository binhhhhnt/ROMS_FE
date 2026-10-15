import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { menuApi } from '../api/menuApi'
import { useMenuItem, useRefreshMenu } from '../hooks/useMenu'
import { MenuItemForm } from '../components/MenuItemForm'
import { MenuImageManager } from '../components/MenuImageManager'
import { MenuStatusControl } from '../components/MenuStatusControl'
import { MenuFeedback } from '../components/MenuFeedback'
import { getMenuErrorMessage, positiveMenuId } from '../utils/menu'
import type { MenuItemWriteRequest } from '../types/menu.types'

export function MenuItemDetailPage() {
  const { itemId } = useParams()
  const id = positiveMenuId(itemId)
  const query = useMenuItem(id)
  const refresh = useRefreshMenu()
  const save = async (values: MenuItemWriteRequest) => {
    if (id === null) return
    await menuApi.update(id, values)
    await refresh()
    toast.success('Đã lưu thông tin món.')
  }
  const item = query.data
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Link to="/owner/menu-items" className="text-sm font-medium text-accent hover:underline">← Danh sách món</Link>
      <header><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">Quản lý thực đơn</p><h1 className="text-2xl font-bold text-primary">Chi tiết và chỉnh sửa món</h1></header>
      {id === null ? <MenuFeedback message="Mã món không hợp lệ." />
        : query.isPending ? <MenuFeedback message="Đang tải thông tin món..." loading />
        : query.isError ? <MenuFeedback message={getMenuErrorMessage(query.error)} retry={() => void query.refetch()} />
        : item && <>
          <MenuItemForm key={item.id} item={item} onSave={save} />
          <MenuStatusControl key={`${item.id}-${item.status}`} item={item} onChanged={refresh} />
          <MenuImageManager key={item.id} menuItemId={item.id} images={item.images} onChanged={refresh} />
        </>}
    </section>
  )
}
