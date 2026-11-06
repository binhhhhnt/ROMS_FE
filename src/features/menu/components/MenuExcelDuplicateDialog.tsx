import { useEffect, useRef } from 'react'
import { Button } from '@/shared/components/ui/button'
import type { MenuExcelDuplicateConfirmation } from '../api/menuExcelApi'

export function MenuExcelDuplicateDialog({ review, busy, onConfirm, onClose }: {
  review: MenuExcelDuplicateConfirmation
  busy: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    const previousFocus = document.activeElement
    dialog?.showModal()
    return () => {
      dialog?.close()
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus()
    }
  }, [])
  return (
    <dialog ref={ref} aria-labelledby="excel-duplicates-title" aria-describedby="excel-duplicates-description"
      onCancel={event => { event.preventDefault(); if (!busy) onClose() }}
      className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-3xl overflow-hidden rounded-xl border border-border bg-card p-0 text-text shadow-2xl backdrop:bg-primary/60">
      <div className="flex max-h-[90dvh] flex-col">
        <header className="shrink-0 border-b border-border p-5">
          <h2 id="excel-duplicates-title" className="text-xl font-semibold text-primary" aria-live="polite">Có {review.duplicateCount} món trùng</h2>
          <p id="excel-duplicates-description" className="mt-2 text-sm text-muted">Các dòng bên dưới sẽ được bỏ qua, giữ nguyên món đã có. Khi đồng ý, hệ thống sẽ thêm {review.itemsToCreate} món mới và tạo {review.categoriesToCreate} danh mục mới. Chưa có dữ liệu nào được lưu.</p>
          {review.itemsToCreate === 0 && review.categoriesToCreate === 0 && <p className="mt-2 text-sm text-muted">File này không có dữ liệu mới để thêm.</p>}
        </header>
        <div className="min-h-0 overflow-auto">
          <table className="w-full min-w-130 text-left text-sm">
            <caption className="sr-only">Danh sách tất cả món trùng trong sheet Món ăn</caption>
            <thead className="sticky top-0 bg-surface text-primary"><tr><th scope="col" className="px-4 py-3">Dòng Excel</th><th scope="col" className="px-4 py-3">Tên món</th><th scope="col" className="px-4 py-3">Danh mục</th><th scope="col" className="px-4 py-3">Trùng với</th></tr></thead>
            <tbody>{review.duplicates.map(item => <tr key={item.row} className="border-b border-border"><td className="px-4 py-3 tabular-nums">{item.row}</td><td className="px-4 py-3 break-words">{item.name}</td><td className="px-4 py-3 break-words">{item.category}</td><td className="px-4 py-3">{item.source === 'CATALOG' ? 'Món đã có trong menu' : `Dòng ${item.originalRow} trong file`}</td></tr>)}</tbody>
          </table>
        </div>
        <footer className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-border bg-background p-5">
          <Button type="button" autoFocus variant="outline" disabled={busy} onClick={onClose}>Hủy</Button>
          <Button type="button" isLoading={busy} onClick={onConfirm}>Đồng ý, tiếp tục</Button>
        </footer>
      </div>
    </dialog>
  )
}
