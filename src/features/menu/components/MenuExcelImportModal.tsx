import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { Download, FileSpreadsheet, X, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { menuApi } from '../api/menuApi'
import { useMenuCategoryOptions } from '../hooks/useMenu'
import {
  readMenuExcel,
  validateMenuImportRow,
  MAX_IMPORT_BYTES,
  type MenuImportRow,
} from '../utils/menuImport'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function MenuExcelImportModal({ isOpen, onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<MenuImportRow[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [isReading, setIsReading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const submitLock = useRef(false)

  // Query existing categories to validate that categories exist in the system
  const { data: categories = [] } = useMenuCategoryOptions()
  const validCategories = categories.map((c) => c.name)

  const busy = isReading || isSubmitting
  const selectedRows = rows.filter((row) => selected.has(row.rowNumber))
  const invalidCount = selectedRows.filter(
    (row) => validateMenuImportRow(row, selectedRows, validCategories).length > 0
  ).length

  useEffect(() => {
    if (!isOpen) return
    const previousFocus = document.activeElement as HTMLElement | null
    dialogRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      if (!busy) onClose()
    }
    if (event.key !== 'Tab') return
    const elements = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), [tabindex="0"]'
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

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    event.target.value = ''
    if (!selectedFile) return

    setError('')
    setRows([])
    setSelected(new Set())
    setFileName('')
    setFile(null)

    if (!/\.xlsx$/i.test(selectedFile.name)) {
      setError('Vui lòng chọn file Excel .xlsx. Với file .xls, hãy lưu lại dưới dạng .xlsx.')
      return
    }
    if (selectedFile.size > MAX_IMPORT_BYTES) {
      setError('File quá lớn. Dung lượng tối đa là 10 MB.')
      return
    }

    setIsReading(true)
    try {
      const buffer = await selectedFile.arrayBuffer()
      const imported = await readMenuExcel(buffer)
      setRows(imported)
      setSelected(new Set(imported.map((row) => row.rowNumber)))
      setFileName(selectedFile.name)
      setFile(selectedFile)
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

  const toggleAll = () => {
    if (selected.size === rows.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(rows.map((r) => r.rowNumber)))
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloading(true)
      const blob = await menuApi.downloadTemplate()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'menu_items_template.xlsx'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Đã tải file mẫu Excel thực đơn!')
    } catch (err) {
      toast.error('Lỗi khi tải file mẫu: ' + getApiErrorMessage(err))
    } finally {
      setIsDownloading(false)
    }
  }

  const confirmImport = async () => {
    if (submitLock.current || busy || !selectedRows.length || invalidCount || !file) return
    submitLock.current = true
    setIsSubmitting(true)
    setError('')
    try {
      const result = await menuApi.importExcel(file)
      if (result.errorCount === 0) {
        toast.success(`Đã nhập thành công ${result.insertedCount + result.updatedCount} món ăn!`)
      } else {
        toast.warning(
          `Hoàn tất nhập: ${result.insertedCount + result.updatedCount} món thành công, ${result.errorCount} lỗi.`
        )
      }
      onSuccess()
      onClose()
    } catch (err) {
      setError(`${getApiErrorMessage(err)} Vui lòng kiểm tra lại danh sách trước khi xác nhận.`)
    } finally {
      submitLock.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-menu-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-border bg-card text-left shadow-2xl outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5 bg-surface/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 id="import-menu-title" className="text-lg font-bold text-primary">
                Nhập thực đơn từ Excel
              </h2>
              <p className="text-xs text-muted">
                Chọn file → Kiểm tra danh sách món → Xác nhận thêm vào thực đơn
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Đóng"
            disabled={busy}
            onClick={onClose}
            className="rounded-lg p-2 text-muted hover:bg-surface disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-col gap-4 overflow-y-auto p-5" aria-busy={busy}>
          {/* File Picker & Template Download */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface/20 p-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-text">Chọn file Excel dữ liệu thực đơn</span>
              <span className="text-xs text-muted">
                Hỗ trợ định dạng .xlsx. Cột danh mục phải khớp với danh mục đã tạo trong hệ thống.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                disabled={isDownloading || busy}
                className="gap-1.5 text-xs font-semibold"
              >
                <Download className="h-3.5 w-3.5 text-accent" />
                {isDownloading ? 'Đang tải...' : 'Tải file mẫu'}
              </Button>

              <label className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-primary-hover">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                {fileName ? 'Đổi file khác' : 'Chọn file Excel'}
                <input
                  type="file"
                  accept=".xlsx"
                  className="sr-only"
                  onChange={handleFileChange}
                  disabled={busy}
                />
              </label>
            </div>
          </div>

          {/* Status Message / Error Banner */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-status-cancelled/10 border border-status-cancelled/30 p-3.5 text-sm text-status-cancelled">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading Indicator */}
          {isReading && (
            <div className="flex items-center justify-center py-12 text-sm text-muted">
              Đang phân tích file Excel thực đơn...
            </div>
          )}

          {/* Empty State */}
          {!isReading && rows.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center text-muted">
              <FileSpreadsheet className="h-10 w-10 text-muted/50 mb-2" />
              <p className="text-sm font-medium">Chưa có file nào được chọn</p>
              <p className="text-xs text-muted mt-1 max-w-sm">
                Vui lòng tải file mẫu về, điền danh sách món ăn theo các danh mục có sẵn và tải lên tại đây.
              </p>
            </div>
          )}

          {/* Preview Table */}
          {!isReading && rows.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>
                  Đã tải <strong>{rows.length}</strong> dòng từ file <strong>{fileName}</strong>
                </span>
                <span className="font-medium">
                  {selectedRows.length} món được chọn ·{' '}
                  <span className={invalidCount > 0 ? 'text-status-cancelled font-bold' : 'text-status-ready'}>
                    {invalidCount > 0 ? `${invalidCount} dòng có lỗi cần sửa` : 'Tất cả hợp lệ'}
                  </span>
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border bg-card">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-surface/50 font-semibold text-text">
                    <tr>
                      <th className="w-10 px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selected.size === rows.length && rows.length > 0}
                          onChange={toggleAll}
                          className="h-4 w-4 rounded accent-primary cursor-pointer"
                          aria-label="Chọn tất cả các dòng"
                        />
                      </th>
                      <th className="w-12 px-3 py-3 text-muted">Dòng</th>
                      <th className="px-3 py-3">Tên món (*)</th>
                      <th className="px-3 py-3">Danh mục (*)</th>
                      <th className="px-3 py-3">Giá niêm yết</th>
                      <th className="px-3 py-3">VAT</th>
                      <th className="px-3 py-3">Bán trực tiếp</th>
                      <th className="px-3 py-3">Kiểm tra hợp lệ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((row) => {
                      const rowErrors = validateMenuImportRow(row, selectedRows, validCategories)
                      const isRowSelected = selected.has(row.rowNumber)
                      const hasError = rowErrors.length > 0

                      return (
                        <tr
                          key={row.rowNumber}
                          className={`transition-colors ${
                            !isRowSelected
                              ? 'opacity-40 bg-surface/10'
                              : hasError
                              ? 'bg-status-cancelled/5'
                              : 'hover:bg-surface/20'
                          }`}
                        >
                          <td className="px-3 py-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={isRowSelected}
                              onChange={() => toggleRow(row.rowNumber)}
                              className="h-4 w-4 rounded accent-primary cursor-pointer"
                              aria-label={`Chọn dòng ${row.rowNumber}`}
                            />
                          </td>
                          <td className="px-3 py-2.5 font-mono text-muted">{row.rowNumber}</td>
                          <td className="px-3 py-2.5 font-semibold text-primary">
                            {row.name || <span className="text-status-cancelled italic">Trống</span>}
                            {row.isFeatured && (
                              <Badge variant="secondary" className="ml-1.5 text-[10px]">
                                Nổi bật
                              </Badge>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`rounded px-1.5 py-0.5 ${
                                !row.category
                                  ? 'bg-status-cancelled/10 text-status-cancelled'
                                  : validCategories.some(
                                      (c) => c.toLowerCase() === row.category.toLowerCase()
                                    )
                                  ? 'bg-surface text-text'
                                  : 'bg-status-cancelled/10 text-status-cancelled font-medium'
                              }`}
                            >
                              {row.category || 'Trống'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-mono">
                            {row.price ? `${Number(row.price).toLocaleString('vi-VN')} đ` : '0 đ'}
                          </td>
                          <td className="px-3 py-2.5 text-muted">{row.vatRate}%</td>
                          <td className="px-3 py-2.5">
                            {row.isDirectSale ? (
                              <Badge variant="outline" className="border-sky-500 text-sky-600 bg-sky-50 text-[10px]">
                                Có
                              </Badge>
                            ) : (
                              <span className="text-muted">Không</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            {hasError ? (
                              <div className="flex items-center gap-1 text-status-cancelled font-medium">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                <span>{rowErrors[0]}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-status-ready">
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                <span>Hợp lệ</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4 bg-surface/20">
          <div className="text-xs text-muted">
            {rows.length > 0 && (
              <span>
                Đã chọn <strong>{selectedRows.length}</strong> / {rows.length} món
                {invalidCount > 0 && (
                  <span className="text-status-cancelled ml-1">({invalidCount} món chưa hợp lệ)</span>
                )}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={busy}>
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={confirmImport}
              isLoading={isSubmitting}
              disabled={busy || selectedRows.length === 0 || invalidCount > 0}
              className="font-semibold shadow-xs"
            >
              Xác nhận nhập thực đơn
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MenuExcelImportModal
