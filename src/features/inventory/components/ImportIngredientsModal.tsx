import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { Download, FileSpreadsheet, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { ingredientApi } from '@/features/inventory/api/ingredientApi'
import {
  downloadIngredientTemplate, MAX_IMPORT_BYTES, MAX_IMPORT_ROWS,
  readIngredientExcel, toIngredientRequest, validateImportRow,
  type IngredientImportRow,
} from '@/features/inventory/utils/ingredientImport'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { Button } from '@/shared/components/ui/button'

interface Props {
  onClose: () => void
  onSuccess: () => void
}

export function ImportIngredientsModal({ onClose, onSuccess }: Props) {
  const [rows, setRows] = useState<IngredientImportRow[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [isReading, setIsReading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const submitLock = useRef(false)
  const busy = isReading || isSubmitting
  const selectedRows = rows.filter((row) => selected.has(row.rowNumber))
  const invalidCount = selectedRows.filter((row) => validateImportRow(row, selectedRows).length > 0).length

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    dialogRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      if (!busy) onClose()
    }
    if (event.key !== 'Tab') return
    const elements = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), [tabindex="0"]',
    )
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

  const readFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    setRows([])
    setSelected(new Set())
    setFileName('')
    if (!/\.xlsx$/i.test(file.name)) {
      setError('Vui lòng chọn file Excel .xlsx. Với file .xls, hãy lưu lại dưới dạng .xlsx.')
      return
    }
    if (file.size > MAX_IMPORT_BYTES) {
      setError('File quá lớn. Dung lượng tối đa là 5 MB.')
      return
    }
    setIsReading(true)
    try {
      const imported = await readIngredientExcel(await file.arrayBuffer())
      setRows(imported)
      setSelected(new Set(imported.map((row) => row.rowNumber)))
      setFileName(file.name)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không đọc được file. Vui lòng dùng file mẫu và thử lại.')
    } finally {
      setIsReading(false)
    }
  }

  const toggleRow = (rowNumber: number) => {
    setError('')
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(rowNumber)) next.delete(rowNumber)
      else next.add(rowNumber)
      return next
    })
  }

  const confirmImport = async () => {
    if (submitLock.current || busy || !selectedRows.length || invalidCount) return
    submitLock.current = true
    setIsSubmitting(true)
    setError('')
    try {
      const created = await ingredientApi.importIngredients(selectedRows.map(toIngredientRequest))
      toast.success(`Đã thêm ${created.length} nguyên liệu từ Excel`)
      onSuccess()
      onClose()
    } catch (err) {
      setError(`${getApiErrorMessage(err)} Vui lòng kiểm tra danh sách nguyên liệu trước khi xác nhận lại.`)
    } finally {
      submitLock.current = false
      setIsSubmitting(false)
    }
  }

  const downloadTemplate = async () => {
    setIsDownloading(true)
    try {
      await downloadIngredientTemplate()
    } catch {
      toast.error('Không tải được file mẫu. Vui lòng thử lại.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="import-ingredients-title"
        aria-describedby="import-ingredients-description" tabIndex={-1} onKeyDown={handleKeyDown}
        className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-border bg-card text-left shadow-2xl outline-none">
        <div className="flex items-center justify-between gap-3 border-b border-border p-5">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-6 w-6 shrink-0 text-accent" />
            <div>
              <h2 id="import-ingredients-title" className="text-lg font-bold text-primary">Nhập nguyên liệu từ Excel</h2>
              <p id="import-ingredients-description" className="text-sm text-muted">Chọn file → Kiểm tra danh sách → Xác nhận thêm nguyên liệu</p>
            </div>
          </div>
          <button type="button" aria-label="Đóng nhập Excel" disabled={busy} onClick={onClose}
            className="rounded-md p-2 text-muted hover:bg-surface disabled:opacity-50"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto p-5" aria-busy={busy}>
          <div className="rounded-lg border border-surface bg-surface/40 p-3 text-sm text-text">
            <p>Dòng đầu gồm <strong>Tên nguyên liệu</strong>, <strong>Đơn vị tính</strong> và <strong>Mức tồn tối thiểu</strong> (tùy chọn).</p>
            <p className="mt-1 text-xs text-muted">Đọc trang tính đầu tiên, tối đa {MAX_IMPORT_ROWS} dòng và 5 MB. Thay các dòng ví dụ trong file mẫu bằng dữ liệu của bạn. Tồn kho ban đầu là 0; nhập số lượng qua Phiếu nhập hàng hoặc Kiểm kê.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-text">
              Chọn file Excel (.xlsx)
              <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                disabled={busy} onChange={readFile}
                className="max-w-full rounded-lg border border-border p-2 text-xs file:mr-3 file:rounded file:border-0 file:bg-surface file:px-3 file:py-1 file:text-primary disabled:opacity-50" />
            </label>
            <Button variant="outline" size="sm" onClick={downloadTemplate} disabled={busy || isDownloading}>
              <Download className="mr-2 h-4 w-4" />{isDownloading ? 'Đang tạo file mẫu...' : 'Tải file mẫu'}
            </Button>
          </div>
          {isReading && <p role="status" className="text-sm text-muted">Đang đọc file Excel...</p>}
          {error && <p role="alert" className="rounded-lg border border-status-cancelled/30 bg-status-cancelled/10 p-3 text-sm text-status-cancelled">{error}</p>}
          {rows.length > 0 && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <p className="break-all text-muted">{fileName} · Đã chọn <strong className="text-primary">{selectedRows.length}/{rows.length}</strong> nguyên liệu</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => { setSelected(new Set(rows.map((row) => row.rowNumber))); setError('') }}>Chọn tất cả</Button>
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => { setSelected(new Set()); setError('') }}>Bỏ chọn tất cả</Button>
                </div>
              </div>
              <p className="text-xs text-muted">Bỏ tích hoặc xóa các dòng không muốn thêm. Dòng bị lỗi cần được bỏ chọn hoặc sửa trong file rồi tải lại.</p>
              <div className="max-h-80 overflow-auto rounded-lg border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-surface text-primary"><tr>
                    <th className="p-3">Chọn</th><th className="p-3">Dòng Excel</th><th className="p-3">Tên nguyên liệu</th>
                    <th className="p-3">Đơn vị</th><th className="p-3">Tồn tối thiểu</th><th className="p-3">Kiểm tra</th><th className="p-3"><span className="sr-only">Xóa dòng</span></th>
                  </tr></thead>
                  <tbody className="divide-y divide-border">{rows.map((row) => {
                    const checked = selected.has(row.rowNumber)
                    const errors = validateImportRow(row, selectedRows)
                    return (
                      <tr key={row.rowNumber} className={checked ? 'bg-surface/20' : 'text-muted'}>
                        <td className="p-3"><input type="checkbox" checked={checked} disabled={busy}
                          aria-label={`Chọn dòng ${row.rowNumber}: ${row.name || 'chưa có tên'}`}
                          onChange={() => toggleRow(row.rowNumber)} className="h-4 w-4 accent-accent" /></td>
                        <td className="p-3">{row.rowNumber}</td><td className="max-w-64 break-words p-3 font-medium">{row.name || '—'}</td>
                        <td className="p-3">{row.unit || '—'}</td><td className="p-3">{row.minimumStock || 'Không đặt'}</td>
                        <td className="min-w-44 p-3 text-xs">{!checked ? 'Không thêm' : errors.length ?
                          <span className="text-status-cancelled">{errors.join(' ')}</span> : <span className="text-status-ready">Hợp lệ</span>}</td>
                        <td className="p-3"><button type="button" disabled={busy} aria-label={`Xóa dòng ${row.rowNumber}`}
                          className="rounded p-1 text-status-cancelled hover:bg-status-cancelled/10 disabled:opacity-50"
                          onClick={() => { setRows((current) => current.filter((item) => item.rowNumber !== row.rowNumber)); setError('') }}>
                          <Trash2 className="h-4 w-4" /></button></td>
                      </tr>
                    )
                  })}</tbody>
                </table>
              </div>
              {invalidCount > 0 && <p role="status" className="text-sm text-status-cancelled">Có {invalidCount} dòng đang chọn bị lỗi. Bỏ chọn các dòng này trước khi xác nhận.</p>}
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-5">
          <p className="text-xs text-muted" aria-live="polite">{isSubmitting ? `Đang thêm ${selectedRows.length} nguyên liệu, vui lòng chờ...` : 'Chỉ lưu dữ liệu khi bạn bấm xác nhận.'}</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={busy}>Hủy</Button>
            <Button onClick={confirmImport} isLoading={isSubmitting} disabled={busy || !selectedRows.length || invalidCount > 0}>
              Xác nhận thêm {selectedRows.length} nguyên liệu
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
