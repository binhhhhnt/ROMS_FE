import { useEffect, useRef, type ChangeEvent, type KeyboardEvent } from 'react'
import { Download, FileSpreadsheet, X } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

interface Props {
  isImporting: boolean
  isDownloading: boolean
  error: string
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>
  onDownload: () => Promise<void>
  onClose: () => void
}

export function ImportPurchaseModal({ isImporting, isDownloading, error, onFileChange, onDownload, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const busy = isImporting || isDownloading

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [])

  useEffect(() => {
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) {
        event.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    if (!busy && !dialogRef.current?.contains(document.activeElement)) dialogRef.current?.focus()
    return () => document.removeEventListener('keydown', handleEscape)
  }, [busy, onClose])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return
    const elements = dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)')
    if (!elements?.length) return
    const first = elements[0]
    const last = elements[elements.length - 1]
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="import-purchase-title"
        aria-describedby="import-purchase-description" tabIndex={-1} onKeyDown={handleKeyDown}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-card text-left shadow-2xl outline-none">
        <div className="flex items-center justify-between gap-3 border-b border-border p-5">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-6 w-6 shrink-0 text-accent" />
            <div>
              <h2 id="import-purchase-title" className="text-lg font-bold text-primary">Nhập danh sách nguyên liệu từ Excel</h2>
              <p id="import-purchase-description" className="text-sm text-muted">Tải file mẫu hoặc chọn file để đưa dữ liệu vào phiếu nhập.</p>
            </div>
          </div>
          <button type="button" aria-label="Đóng nhập Excel" disabled={busy} onClick={onClose}
            className="rounded-md p-2 text-muted hover:bg-surface disabled:opacity-50"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex flex-col gap-4 overflow-y-auto p-5" aria-busy={busy}>
          <div className="rounded-lg border border-surface bg-surface/40 p-3 text-sm text-text">
            <p>Dòng đầu gồm <strong>Tên nguyên liệu</strong>, <strong>Đơn vị tính</strong>, <strong>Số lượng nhập</strong> và <strong>Đơn giá</strong>.</p>
            <p className="mt-1 text-xs text-muted">Đọc trang tính đầu tiên, tối đa 500 dòng và 5 MB. Thay các dòng ví dụ trong file mẫu bằng dữ liệu của bạn.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex min-w-0 flex-col gap-1 text-sm font-medium text-text">
              Chọn file Excel (.xlsx)
              <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                disabled={busy} onChange={onFileChange}
                className="max-w-full rounded-lg border border-border p-2 text-xs file:mr-3 file:rounded file:border-0 file:bg-surface file:px-3 file:py-1 file:text-primary disabled:opacity-50" />
            </label>
            <Button type="button" variant="outline" size="sm" onClick={onDownload} disabled={busy}>
              <Download className="mr-2 h-4 w-4" />{isDownloading ? 'Đang tạo file mẫu...' : 'Tải file mẫu'}
            </Button>
          </div>
          {isImporting && <p role="status" className="text-sm text-muted">Đang đọc file và đối chiếu danh mục kho...</p>}
          {error && <p role="alert" className="rounded-lg border border-status-cancelled/30 bg-status-cancelled/10 p-3 text-sm text-status-cancelled">{error}</p>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-5">
          <p className="text-xs text-muted">Sau khi chọn file, kiểm tra và sửa các dòng trong bảng. Chỉ nhập kho khi bấm xác nhận.</p>
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>Đóng</Button>
        </div>
      </div>
    </div>
  )
}
