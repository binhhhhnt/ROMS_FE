import { Edit2, Eye, EyeOff, Layers, ChevronLeft, ChevronRight } from 'lucide-react'
import type { CategoryResponse } from '@/features/menu/types/category.types'
import { Button } from '@/shared/components/ui/button'

interface CategoryTableProps {
  categories: CategoryResponse[]
  isLoading?: boolean
  onEdit: (category: CategoryResponse) => void
  onToggleStatus: (category: CategoryResponse) => void
  isTogglingId?: number | null
  pagination?: {
    page: number
    totalPages: number
    totalElements: number
    size: number
    onPageChange: (newPage: number) => void
  }
}

export function CategoryTable({
  categories,
  isLoading = false,
  onEdit,
  onToggleStatus,
  isTogglingId = null,
  pagination,
}: CategoryTableProps) {
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-muted-bg/40 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-muted-bg text-muted flex items-center justify-center">
          <Layers className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-text">Chưa có danh mục món nào</h4>
          <p className="text-xs text-muted max-w-sm">
            Tạo danh mục đầu tiên để bắt đầu phân loại và trình bày thực đơn cho nhà hàng của bạn.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs flex flex-col text-left">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-surface/50 border-b border-border text-muted font-bold tracking-wider uppercase text-[11px]">
              <th className="py-3.5 px-4 w-20 text-center">Thứ tự</th>
              <th className="py-3.5 px-4">Tên danh mục</th>
              <th className="py-3.5 px-4 hidden md:table-cell">Mô tả</th>
              <th className="py-3.5 px-4 w-36 text-center">Trạng thái</th>
              <th className="py-3.5 px-4 w-32 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {categories.map((category) => {
              const isBusy = isTogglingId === category.id
              return (
                <tr
                  key={category.id}
                  className="hover:bg-surface/20 transition-colors group"
                >
                  {/* Display Order */}
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-surface font-mono font-bold text-primary text-xs border border-border">
                      {category.displayOrder}
                    </span>
                  </td>

                  {/* Name & ID */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-text text-sm group-hover:text-primary transition-colors">
                        {category.name}
                      </span>
                      <span className="text-[10px] text-muted font-mono">
                        Mã #{category.id}
                      </span>
                    </div>
                  </td>

                  {/* Description */}
                  <td className="py-3 px-4 text-muted hidden md:table-cell max-w-xs truncate" title={category.description || ''}>
                    {category.description ? (
                      category.description
                    ) : (
                      <span className="italic text-muted/60">Chưa có mô tả</span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        category.isActive
                          ? 'bg-status-ready/15 text-status-ready'
                          : 'bg-muted-bg text-muted'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          category.isActive ? 'bg-status-ready' : 'bg-muted'
                        }`}
                      />
                      {category.isActive ? 'Đang hiển thị' : 'Đang tạm ẩn'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Quick Toggle Status */}
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => onToggleStatus(category)}
                        title={category.isActive ? 'Ẩn khỏi thực đơn' : 'Hiện trên thực đơn'}
                        className={`h-8 w-8 p-0 rounded-lg ${
                          category.isActive
                            ? 'text-status-ready hover:bg-status-ready/10'
                            : 'text-muted hover:text-text hover:bg-muted-bg'
                        }`}
                      >
                        {category.isActive ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </Button>

                      {/* Edit Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(category)}
                        className="h-8 px-2.5 text-xs flex items-center gap-1 border-border hover:bg-surface"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-secondary" />
                        <span>Sửa</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface/20 text-xs text-muted">
          <span>
            Hiển thị trang <strong className="text-text">{pagination.page + 1}</strong> / {pagination.totalPages} ({pagination.totalElements} danh mục)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 0}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="h-8 px-2 text-xs"
            >
              <ChevronLeft className="w-4 h-4 mr-0.5" /> Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages - 1}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="h-8 px-2 text-xs"
            >
              Sau <ChevronRight className="w-4 h-4 ml-0.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
