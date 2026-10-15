import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FolderOpen, Pencil, Plus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/app/store/authStore'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { CategoryFormModal } from '../components/CategoryFormModal'
import { useCategories, useSaveCategory } from '../hooks/useCategories'
import { getCategoryErrorMessage } from '../api/categoryApi'
import type { CategoryFormValues } from '../schemas/categorySchema'
import type { CategoryResponse } from '../types/category.types'

const PAGE_SIZE = 20

export function CategoryManagementPage() {
  const userId = useAuthStore((state) => state.user?.id)
  const [searchParams, setSearchParams] = useSearchParams()
  const rawPage = Number(searchParams.get('page') ?? 0)
  const page = Number.isSafeInteger(rawPage) && rawPage >= 0 && rawPage < 2147483647 ? rawPage : 0
  const query = useCategories(userId, page, PAGE_SIZE)
  const saveCategory = useSaveCategory()
  const [editor, setEditor] = useState<CategoryResponse | 'create' | null>(null)

  const changePage = (nextPage: number) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.set('page', String(nextPage))
      return next
    })
  }

  const handleSave = async (values: CategoryFormValues) => {
    const id = editor && editor !== 'create' ? editor.id : undefined
    await saveCategory.mutateAsync({ id, values })
    toast.success(id === undefined ? 'Đã tạo danh mục món.' : 'Đã cập nhật danh mục món.')
    setEditor(null)
  }

  const data = query.data

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6" aria-labelledby="categories-title">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">Quản lý thực đơn</p>
          <h1 id="categories-title" className="text-2xl font-bold text-primary">Danh mục món</h1>
          <p className="mt-2 text-sm text-muted">Tổ chức nhóm món và thứ tự hiển thị trên thực đơn.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}>
            <RefreshCw aria-hidden="true" className={`h-4 w-4 ${query.isFetching ? 'animate-spin' : ''}`} />Làm mới
          </Button>
          <Button onClick={() => setEditor('create')}><Plus aria-hidden="true" className="h-4 w-4" />Thêm danh mục</Button>
        </div>
      </header>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm" aria-busy={query.isFetching}>
        <div className="flex items-center justify-between gap-3 border-b border-border bg-surface/30 px-5 py-4">
          <h2 className="font-semibold text-primary">Danh sách danh mục</h2>
          {data && <span className="text-sm text-muted">{data.totalElements} danh mục</span>}
        </div>
        {query.isPending ? (
          <p role="status" className="p-12 text-center text-sm text-muted">Đang tải danh mục món...</p>
        ) : query.isError ? (
          <div role="alert" className="flex flex-col items-center gap-4 p-8 text-center">
            <p className="text-sm text-status-cancelled">{getCategoryErrorMessage(query.error)}</p>
            <Button variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}>Thử lại</Button>
          </div>
        ) : data?.content.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <FolderOpen aria-hidden="true" className="h-10 w-10 text-accent" />
            <h3 className="font-semibold">{page > 0 ? 'Trang này không có danh mục' : 'Chưa có danh mục món'}</h3>
            <p className="text-sm text-muted">{page > 0 ? 'Quay về trang đầu để xem danh sách hiện tại.' : 'Tạo danh mục đầu tiên để sắp xếp thực đơn nhà hàng.'}</p>
            <Button variant="outline" onClick={() => page > 0 ? changePage(0) : setEditor('create')}>{page > 0 ? 'Về trang đầu' : 'Thêm danh mục'}</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Danh mục món, mô tả, thứ tự hiển thị và trạng thái hoạt động</caption>
              <thead className="border-b border-border bg-background text-xs text-muted">
                <tr><th scope="col" className="px-5 py-3">Tên danh mục</th><th scope="col" className="px-5 py-3">Mô tả</th><th scope="col" className="whitespace-nowrap px-5 py-3">Thứ tự</th><th scope="col" className="px-5 py-3">Trạng thái</th><th scope="col" className="px-5 py-3 text-right">Thao tác</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.content.map((category) => (
                  <tr key={category.id} className="hover:bg-surface/20">
                    <th scope="row" className="min-w-40 max-w-xs break-words px-5 py-4 font-semibold text-primary">{category.name}</th>
                    <td className="min-w-48 max-w-sm whitespace-pre-wrap break-words px-5 py-4 text-muted">{category.description || '—'}</td>
                    <td className="px-5 py-4 tabular-nums">{category.displayOrder}</td>
                    <td className="whitespace-nowrap px-5 py-4"><Badge variant={category.isActive ? 'secondary' : 'outline'}>{category.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}</Badge></td>
                    <td className="px-5 py-4 text-right"><Button variant="ghost" size="sm" aria-label={`Chỉnh sửa danh mục ${category.name}`} onClick={() => setEditor(category)}><Pencil aria-hidden="true" className="h-4 w-4" />Chỉnh sửa</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && !query.isError && data.content.length > 0 && (
          <nav aria-label="Phân trang danh mục" className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4">
            <p className="text-sm text-muted" aria-live="polite">Trang {data.page + 1} / {Math.max(1, data.totalPages)} · {data.totalElements} danh mục</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => changePage(page - 1)} disabled={page === 0 || query.isFetching}>Trang trước</Button>
              <Button variant="outline" size="sm" onClick={() => changePage(page + 1)} disabled={page + 1 >= data.totalPages || query.isFetching}>Trang sau</Button>
            </div>
          </nav>
        )}
      </div>
      {editor !== null && <CategoryFormModal category={editor === 'create' ? null : editor} onClose={() => setEditor(null)} onSave={handleSave} />}
    </section>
  )
}
