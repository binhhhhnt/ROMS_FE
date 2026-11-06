import { useRef, useState } from 'react'
import { ArrowLeft, FileSpreadsheet, Upload, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { menuExcelApi, getExcelErrorMessage, getExcelImportErrors, getExcelDuplicateConfirmation, type MenuExcelImportError, type MenuExcelDuplicateConfirmation } from '../api/menuExcelApi'
import { useRefreshMenu } from '../hooks/useMenu'
import { MenuExcelPreviewDialog } from '../components/MenuExcelPreviewDialog'
import { MenuExcelDuplicateDialog } from '../components/MenuExcelDuplicateDialog'

export function MenuExcelImportPage() {
  const location = useLocation()
  const requestedReturn: unknown = location.state?.returnTo
  const returnTo = typeof requestedReturn === 'string' && /^\/owner\/categories(?:\?.*)?$/.test(requestedReturn)
    ? requestedReturn : '/owner/categories'
  const inputRef = useRef<HTMLInputElement>(null)
  const importing = useRef(false)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rowErrors, setRowErrors] = useState<MenuExcelImportError[]>([])
  const [busy, setBusy] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [pendingImport, setPendingImport] = useState<{ file: File; review: MenuExcelDuplicateConfirmation } | null>(null)
  const refresh = useRefreshMenu()

  const selectFile = (selected: File | null) => {
    setError(null)
    setRowErrors([])
    setPendingImport(null)
    if (selected && (!/\.xlsx$/i.test(selected.name) || !selected.size || selected.size > 5 * 1024 * 1024)) {
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
      setError('Chọn file Excel .xlsx không rỗng, tối đa 5 MB.')
      return
    }
    setFile(selected)
  }

  const upload = async (confirmationToken?: string, selectedFile = file) => {
    if (!selectedFile || importing.current) return
    importing.current = true
    setBusy(true)
    setError(null)
    setRowErrors([])
    try {
      const result = await menuExcelApi.import(selectedFile, confirmationToken)
      setPendingImport(null)
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
      toast.success(`Đã nhập ${result.itemsCreated} món ăn, tạo ${result.categoriesCreated} danh mục và dùng lại ${result.categoriesReused} danh mục.${result.itemsSkipped ? ` Bỏ qua ${result.itemsSkipped} món trùng.` : ''}`)
      void refresh()
    } catch (failure) {
      const review = getExcelDuplicateConfirmation(failure)
      if (review) {
        setPendingImport({ file: selectedFile, review })
      } else {
        setPendingImport(null)
        setError(await getExcelErrorMessage(failure))
        setRowErrors(getExcelImportErrors(failure))
      }
    } finally {
      importing.current = false
      setBusy(false)
    }
  }

  return (
    <section aria-labelledby="menu-excel-title" className="mx-auto flex min-h-140 w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link to={returnTo} replace className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-text hover:bg-muted-bg focus-visible:outline-accent"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Quay lại</Link>
        <Button type="button" variant="outline" className="ml-auto" onClick={() => setPreviewOpen(true)}><FileSpreadsheet className="h-4 w-4" aria-hidden="true" />File Excel mẫu</Button>
      </header>
      <div className="mt-4 text-center"><h1 id="menu-excel-title" className="text-2xl font-bold text-primary">Chọn file Excel</h1><p className="mt-2 text-sm text-muted">Nhập danh mục và món ăn từ file Excel.</p></div>
      <div className="mx-auto my-4 flex w-full max-w-xl flex-col items-center rounded-xl border border-dashed border-accent bg-card px-4 py-10 text-center sm:px-8">
        <FileSpreadsheet className="mb-3 h-9 w-9 text-accent" aria-hidden="true" />
        <p className="font-medium text-primary">Chọn file menu</p>
        <p className="mt-2 text-xs text-muted">Định dạng .xlsx · Tối đa 5 MB</p>
        <input ref={inputRef} type="file" accept=".xlsx" aria-label="Chọn file Excel" className="hidden" disabled={busy} onChange={event => selectFile(event.target.files?.[0] ?? null)} />
        <Button type="button" className="mt-5" disabled={busy} onClick={() => inputRef.current?.click()}><Upload className="h-4 w-4" aria-hidden="true" />Chọn file Excel</Button>
        <p className="mt-3 max-w-full break-all text-sm text-muted" role="status" aria-live="polite">{file ? `${file.name} · ${Math.max(1, Math.round(file.size / 1024))} KB` : 'Chưa chọn file'}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2"><Button type="button" disabled={!file} isLoading={busy} onClick={() => void upload()}>Tải lên</Button>{file && <Button type="button" variant="ghost" disabled={busy} onClick={() => { selectFile(null); if (inputRef.current) inputRef.current.value = '' }}><X className="h-4 w-4" aria-hidden="true" />Bỏ chọn</Button>}</div>
      </div>
      {error && <div role="alert" className="rounded-xl border border-status-cancelled/30 bg-card p-4">
        <p className="break-words text-sm font-medium text-status-cancelled">{rowErrors.length ? `File có ${rowErrors.length} lỗi. Chưa nhập dữ liệu; hãy sửa các lỗi bên dưới rồi tải lại.` : error}</p>
        {rowErrors.length > 0 && <div className="mt-3 overflow-x-auto"><table className="w-full min-w-120 text-left text-sm">
          <caption className="sr-only">Tất cả lỗi trong file Excel</caption>
          <thead className="border-b border-border bg-background text-muted"><tr><th scope="col" className="px-3 py-2">Sheet</th><th scope="col" className="px-3 py-2">Dòng</th><th scope="col" className="px-3 py-2">Cột</th><th scope="col" className="px-3 py-2">Lỗi</th></tr></thead>
          <tbody>{rowErrors.map((value, index) => <tr key={index} className="border-b border-border"><td className="px-3 py-2 whitespace-nowrap">{value.sheet}</td><td className="px-3 py-2 tabular-nums">{value.row ?? '—'}</td><td className="px-3 py-2 tabular-nums">{value.column ?? '—'}</td><td className="px-3 py-2 break-words">{value.message}</td></tr>)}</tbody>
        </table></div>}
      </div>}
      {previewOpen && <MenuExcelPreviewDialog onClose={() => setPreviewOpen(false)} />}
      {pendingImport && <MenuExcelDuplicateDialog review={pendingImport.review} busy={busy}
        onClose={() => setPendingImport(null)}
        onConfirm={() => void upload(pendingImport.review.confirmationToken, pendingImport.file)} />}
    </section>
  )
}
