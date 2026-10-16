import { Button } from '@/shared/components/ui/button'

export function MenuPagination({ page, totalPages, totalElements, busy, onPage }: {
  page: number; totalPages: number; totalElements: number; busy: boolean; onPage: (page: number) => void
}) {
  return (
    <nav aria-label="Phân trang món ăn" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
      <p aria-live="polite" className="text-sm text-muted">Trang {page + 1} / {Math.max(1, totalPages)} · {totalElements} món</p>
      <div className="flex gap-2">
        <Button variant="outline" disabled={page === 0 || busy} onClick={() => onPage(page - 1)}>Trang trước</Button>
        <Button variant="outline" disabled={page + 1 >= totalPages || busy} onClick={() => onPage(page + 1)}>Trang sau</Button>
      </div>
    </nav>
  )
}
