import { useRef, useState } from 'react'
import axios from 'axios'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { categoryApi } from '../api/categoryApi'
import { menuApi } from '../api/menuApi'
import { useRefreshMenu } from '../hooks/useMenu'
import { getMenuErrorMessage } from '../utils/menu'
import { MenuConfirmationDialog } from './MenuConfirmationDialog'

function deletionError(error: unknown) {
  if (axios.isAxiosError(error) && error.response?.status === 409) {
    const code = error.response.data?.error?.code
    if (code === 'CATEGORY_IN_USE') return 'Danh mục còn chứa món ăn. Hãy chuyển hoặc xóa các món trước, hoặc chọn Tạm ngưng phục vụ.'
    if (code === 'MENU_ITEM_IN_USE') return 'Món đã có trong đơn hàng nên không thể xóa. Bạn có thể chọn Ngừng kinh doanh để giữ lịch sử đơn hàng.'
  }
  return getMenuErrorMessage(error)
}

export function CatalogDeleteButton({ kind, id, name, label = 'Xóa', disabled = false, onDeleted, onBusyChange }: {
  kind: 'category' | 'dish'; id: number; name: string; label?: string; disabled?: boolean
  onDeleted?: () => void; onBusyChange?: (busy: boolean) => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const refresh = useRefreshMenu()
  const noun = kind === 'category' ? 'danh mục' : 'món ăn'

  return (
    <>
      <Button ref={trigger} type="button" variant="outline" disabled={disabled || busy} aria-label={`Xóa ${noun} ${name}`}
        className="border-status-cancelled/30 text-status-cancelled hover:bg-status-cancelled/5"
        onClick={() => setConfirming(true)}><Trash2 className="h-4 w-4" aria-hidden="true" />{label}</Button>
      {confirming && <MenuConfirmationDialog title={`Xóa ${noun}?`}
        description={`Bạn muốn xóa ${noun} “${name}”? ${kind === 'category' ? 'Danh mục chỉ có thể xóa khi không còn món ăn.' : 'Món đã có trong đơn hàng sẽ được giữ lại để bảo toàn lịch sử.'}`}
        confirmLabel={`Xóa ${noun}`} destructive getErrorMessage={deletionError}
        onClose={() => { setConfirming(false); trigger.current?.focus() }}
        onConfirm={async () => {
          setBusy(true)
          onBusyChange?.(true)
          try {
            if (kind === 'category') await categoryApi.remove(id)
            else await menuApi.remove(id)
            await refresh()
            toast.success(`Đã xóa ${noun}.`)
            onDeleted?.()
          } finally {
            setBusy(false)
            onBusyChange?.(false)
          }
        }} />}
    </>
  )
}
