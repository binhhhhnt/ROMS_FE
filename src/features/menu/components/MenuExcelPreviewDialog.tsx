import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, FileSpreadsheet, X } from 'lucide-react'
import { useAuthStore } from '@/app/store/authStore'
import { Button } from '@/shared/components/ui/button'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { getExcelErrorMessage, menuExcelApi } from '../api/menuExcelApi'

export function MenuExcelPreviewDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const userId = useAuthStore(state => state.user?.id)
  const [sheetIndex, setSheetIndex] = useState(0)
  const [category, setCategory] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const download = async () => {
    setDownloading(true)
    setDownloadError(null)
    try {
      const blob = await menuExcelApi.download()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'Menu_mau.xlsx'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (failure) {
      setDownloadError(await getExcelErrorMessage(failure))
    } finally {
      setDownloading(false)
    }
  }
  const query = useQuery({
    queryKey: ['menu', 'excel-template', userId],
    queryFn: ({ signal }) => menuExcelApi.preview(signal),
  })

  useEffect(() => {
    const dialog = dialogRef.current
    const previousFocus = document.activeElement
    dialog?.showModal()
    return () => {
      dialog?.close()
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus()
    }
  }, [])

  const sheet = query.data?.sheets[sheetIndex]
  const isFoodSheet = sheet?.name === 'Món ăn'
  const rows = sheet?.rows.filter(row => !isFoodSheet || !category || row[2] === category) ?? []
  const categories = query.data?.sheets.find(value => value.name === 'Danh mục')?.rows.map(row => String(row[1])) ?? []

  return (
    <dialog ref={dialogRef} aria-labelledby="menu-excel-preview-title"
      onCancel={event => { event.preventDefault(); onClose() }}
      onClick={event => { if (event.target === event.currentTarget) {
        const rect = event.currentTarget.getBoundingClientRect()
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose()
      } }}
      className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-5xl overflow-hidden rounded-xl border border-border bg-card p-0 text-text shadow-2xl backdrop:bg-primary/60">
      <div className="flex max-h-[90dvh] min-h-80 flex-col">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <FileSpreadsheet className="h-6 w-6 shrink-0 text-accent" aria-hidden="true" />
            <div className="min-w-0"><h2 id="menu-excel-preview-title" className="break-words text-lg font-semibold text-primary">{query.data?.filename ?? 'File Excel mẫu'}</h2><p className="text-xs text-muted">Xem trước nội dung Excel mẫu · Dữ liệu minh họa</p></div>
          </div>
          <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" isLoading={downloading} onClick={() => void download()}><Download className="h-4 w-4" aria-hidden="true" />Tải file mẫu</Button><Button type="button" autoFocus variant="outline" onClick={onClose}><X className="h-4 w-4" aria-hidden="true" />Đóng</Button></div>
        </header>
        {downloadError && <p role="alert" className="shrink-0 break-words px-5 py-3 text-sm text-status-cancelled">{downloadError}</p>}
        {query.isPending ? <p role="status" className="p-12 text-center text-sm text-muted">Đang tải nội dung file mẫu...</p>
          : query.isError ? <div role="alert" className="flex flex-col items-center gap-4 p-8"><p className="text-sm text-status-cancelled">{getApiErrorMessage(query.error)}</p><Button variant="outline" onClick={() => void query.refetch()}>Thử lại</Button></div>
            : <>
              {isFoodSheet && <div className="flex shrink-0 justify-end border-b border-border px-4 py-3"><select aria-label="Lọc món theo danh mục" value={category} onChange={event => setCategory(event.target.value)} className="max-w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-accent"><option value="">Tất cả danh mục</option>{categories.map(name => <option key={name}>{name}</option>)}</select></div>}
              <div role="tabpanel" id={`excel-sheet-panel-${sheetIndex}`} aria-labelledby={`excel-sheet-tab-${sheetIndex}`} className="min-h-0 flex-1 overflow-auto">
                <table className={`w-full border-collapse text-left text-sm ${isFoodSheet ? 'min-w-190' : 'min-w-120'}`}>
                  <caption className="sr-only">Sheet {sheet?.name}</caption>
                  <thead className="sticky top-0 bg-surface text-primary"><tr>{sheet?.columns.map((column, index) => <th key={column} scope="col" className={`border-b border-r border-border px-4 py-3 font-semibold ${isFoodSheet && index === 4 ? 'text-right' : ''}`}>{column}{isFoodSheet && index === 4 ? ' (VNĐ)' : ''}</th>)}</tr></thead>
                  <tbody>{rows.map(row => <tr key={String(row[0])}>{row.map((value, index) => <td key={index} className={`border-b border-r border-border px-4 py-3 ${index === 0 ? 'w-16 bg-background text-center text-muted' : ''} ${isFoodSheet && index === 4 ? 'text-right whitespace-nowrap tabular-nums' : ''}`}>{isFoodSheet && index === 4 && typeof value === 'number' ? value.toLocaleString('vi-VN') : value}</td>)}</tr>)}</tbody>
                </table>
                {rows.length === 0 && <p className="p-8 text-center text-sm text-muted">Không có dữ liệu.</p>}
              </div>
              <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border bg-surface px-3">
                <div role="tablist" aria-label="Sheet Excel" className="flex flex-wrap">
                  {query.data?.sheets.map((value, index) => <button key={value.name} id={`excel-sheet-tab-${index}`} type="button" role="tab" aria-selected={sheetIndex === index} aria-controls={`excel-sheet-panel-${sheetIndex}`}
                    onClick={() => setSheetIndex(index)}
                    onKeyDown={event => {
                      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
                      event.preventDefault()
                      const length = query.data.sheets.length
                      const next = event.key === 'Home' ? 0 : event.key === 'End' ? length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + length) % length
                      setSheetIndex(next)
                      dialogRef.current?.querySelector<HTMLButtonElement>(`#excel-sheet-tab-${next}`)?.focus()
                    }}
                    className={`min-h-11 cursor-pointer border-r border-b-3 border-border px-5 py-3 text-sm focus-visible:outline-accent ${sheetIndex === index ? 'border-b-primary bg-card font-semibold text-primary' : 'border-b-transparent text-muted hover:bg-card/50'}`}>{value.name}</button>)}
                </div>
                <span role="status" aria-live="polite" className="py-2 text-xs text-muted">{rows.length}{isFoodSheet && category ? ` / ${sheet?.rows.length}` : ''} {isFoodSheet ? 'món ăn' : 'danh mục'}</span>
              </footer>
            </>}
      </div>
    </dialog>
  )
}
