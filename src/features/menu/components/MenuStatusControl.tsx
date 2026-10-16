import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { menuApi } from '../api/menuApi'
import { menuStatuses, type MenuItemReadResponse, type MenuStatus } from '../types/menu.types'
import { isMenuStatus, menuControlClass, menuStatusLabels } from '../utils/menu'
import { MenuStatusBadge } from './MenuStatusBadge'
import { MenuConfirmationDialog } from './MenuConfirmationDialog'

export function MenuStatusControl({ item, onChanged }: { item: MenuItemReadResponse; onChanged: () => Promise<void> }) {
  const [target, setTarget] = useState<MenuStatus>(item.status)
  const [confirming, setConfirming] = useState(false)
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-bold text-primary">Trạng thái kinh doanh</h2>
      <div className="mt-3"><MenuStatusBadge status={item.status} /></div>
      <p className="mt-3 text-sm text-muted">Trạng thái phục vụ được quản lý riêng với khả dụng theo nguyên liệu. Mở phục vụ không đảm bảo món đủ tồn kho.</p>
      <div className="mt-5 flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1"><label htmlFor="menu-status" className="mb-2 block text-sm font-semibold">Trạng thái mới</label>
          <select id="menu-status" value={target} className={menuControlClass} onChange={(event) => { if (isMenuStatus(event.target.value)) setTarget(event.target.value) }}>
            {menuStatuses.map((status) => <option key={status} value={status}>{menuStatusLabels[status]}</option>)}
          </select>
        </div>
        <Button disabled={target === item.status} onClick={() => setConfirming(true)}>Đổi trạng thái</Button>
      </div>
      {confirming && <MenuConfirmationDialog title="Xác nhận đổi trạng thái" description={`Chuyển món “${item.name}” sang “${menuStatusLabels[target]}”?`} confirmLabel="Xác nhận" destructive={target === 'DISCONTINUED'}
        onClose={() => setConfirming(false)} onConfirm={async () => {
          await menuApi.updateStatus(item.id, target)
          await onChanged()
          toast.success('Đã cập nhật trạng thái món.')
        }} />}
    </section>
  )
}
