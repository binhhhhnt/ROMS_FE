import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Filter,
  Edit2,
  Ban,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'

import { ingredientApi } from '@/features/inventory/api/ingredientApi'
import type { IngredientResponse, StockStatus } from '@/features/inventory/types/ingredient.types'
import { IngredientFormModal } from '@/features/inventory/components/IngredientFormModal'
import { DeactivateIngredientModal } from '@/features/inventory/components/DeactivateIngredientModal'
import { useAuthStore } from '@/app/store/authStore'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'

const PAGE_SIZE = 15

export function IngredientsPage() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  // State
  const [page, setPage] = useState(0)
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | StockStatus>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<IngredientResponse | null>(null)
  const [deactivatingIngredient, setDeactivatingIngredient] = useState<IngredientResponse | null>(null)

  // API Query
  const isOwner = user?.role === 'OWNER'
  const isInventoryStaff = user?.role === 'INVENTORY_STAFF'
  const canModify = isOwner || isInventoryStaff

  const activeParam =
    activeFilter === 'ACTIVE' ? true : activeFilter === 'INACTIVE' ? false : undefined

  const {
    data: pageData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['ingredients', { activeParam, page, size: PAGE_SIZE }],
    queryFn: () =>
      ingredientApi.getIngredients({
        isActive: activeParam,
        page,
        size: PAGE_SIZE,
        sort: 'name,asc',
      }),
  })

  // Filter content by search query & stock status locally across the current loaded page
  const displayedItems = useMemo(() => {
    if (!pageData?.content) return []
    return pageData.content.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        item.unit.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        String(item.id).includes(searchQuery.trim())

      const matchStockStatus =
        stockStatusFilter === 'ALL' || item.stockStatus === stockStatusFilter

      return matchSearch && matchStockStatus
    })
  }, [pageData?.content, searchQuery, stockStatusFilter])

  // Aggregate stats across current page content
  const stats = useMemo(() => {
    const list = pageData?.content || []
    return {
      total: pageData?.totalElements || 0,
      active: list.filter((i) => i.isActive).length,
      low: list.filter((i) => i.stockStatus === 'LOW').length,
      out: list.filter((i) => i.stockStatus === 'OUT_OF_STOCK').length,
    }
  }, [pageData])

  const handleOpenCreate = () => {
    setEditingIngredient(null)
    setIsFormModalOpen(true)
  }

  const handleOpenEdit = (ingredient: IngredientResponse) => {
    setEditingIngredient(ingredient)
    setIsFormModalOpen(true)
  }

  const handleOpenDeactivate = (ingredient: IngredientResponse) => {
    setDeactivatingIngredient(ingredient)
  }

  const handleMutationSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['ingredients'] })
  }

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '—'
    return Number(num).toLocaleString('vi-VN', {
      maximumFractionDigits: 3,
    })
  }

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-surface text-primary shadow-xs">
              <Boxes className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-primary">
                Nguyên liệu & Tồn kho
              </h1>
              <p className="text-xs md:text-sm text-muted">
                Quản lý danh mục nguyên vật liệu, theo dõi mức tồn thực tế và định mức cảnh báo.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-text hover:bg-surface/50"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>

          {canModify && (
            <Button
              variant="primary"
              size="md"
              onClick={handleOpenCreate}
              className="shadow-sm font-semibold text-xs md:text-sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Thêm nguyên liệu
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted">Tổng nguyên liệu</p>
            <p className="text-2xl font-black text-primary mt-1">{stats.total}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-accent">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted">Đang hoạt động</p>
            <p className="text-2xl font-black text-status-ready mt-1">{stats.active}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-status-ready/15 flex items-center justify-center text-status-ready">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted">Sắp hết hàng (LOW)</p>
            <p className="text-2xl font-black text-status-pending mt-1">{stats.low}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-status-pending/15 flex items-center justify-center text-status-pending">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted">Hết hàng (OUT OF STOCK)</p>
            <p className="text-2xl font-black text-status-cancelled mt-1">{stats.out}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-status-cancelled/15 flex items-center justify-center text-status-cancelled">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên nguyên liệu, đơn vị tính, mã #..."
            leftIcon={<Search className="w-4 h-4 text-muted" />}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Active status filter */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted">
            <Filter className="w-3.5 h-3.5 text-accent" />
            <span>Trạng thái:</span>
          </div>
          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')
              setPage(0)
            }}
            className="text-xs border border-border rounded-lg px-2.5 py-1.5 bg-background text-text focus:outline-none focus:border-accent"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang sử dụng</option>
            <option value="INACTIVE">Đã ngưng</option>
          </select>

          {/* Stock status filter */}
          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value as 'ALL' | StockStatus)}
            className="text-xs border border-border rounded-lg px-2.5 py-1.5 bg-background text-text focus:outline-none focus:border-accent"
          >
            <option value="ALL">Tất cả mức tồn</option>
            <option value="NORMAL">Bình thường (NORMAL)</option>
            <option value="LOW">Tồn thấp (LOW)</option>
            <option value="OUT_OF_STOCK">Hết hàng (OUT OF STOCK)</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface/60 border-b border-border text-xs uppercase text-primary font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4 w-16">Mã</th>
                <th className="py-3 px-4">Tên nguyên liệu</th>
                <th className="py-3 px-4 w-28">Đơn vị</th>
                <th className="py-3 px-4 w-36 text-right">Tồn hiện tại</th>
                <th className="py-3 px-4 w-36 text-right">Mức tối thiểu</th>
                <th className="py-3 px-4 w-36 text-center">Tình trạng tồn</th>
                <th className="py-3 px-4 w-32 text-center">Hoạt động</th>
                {canModify && <th className="py-3 px-4 w-32 text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td colSpan={canModify ? 8 : 7} className="py-4 px-4">
                      <div className="h-4 bg-surface/70 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : displayedItems.length === 0 ? (
                <tr>
                  <td colSpan={canModify ? 8 : 7} className="py-12 text-center text-muted">
                    <Boxes className="w-10 h-10 mx-auto text-muted/60 mb-2" />
                    <p className="font-medium">Không tìm thấy nguyên liệu phù hợp</p>
                    <p className="text-xs text-muted/80 mt-1">
                      Thử điều chỉnh bộ lọc hoặc bấm "Thêm nguyên liệu" để bắt đầu.
                    </p>
                  </td>
                </tr>
              ) : (
                displayedItems.map((item) => {
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-surface/20 transition-colors"
                    >
                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono text-xs text-muted">
                        #{item.id}
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-text">{item.name}</span>
                      </td>

                      {/* Unit */}
                      <td className="py-3.5 px-4 font-medium text-text/80">
                        {item.unit}
                      </td>

                      {/* Current Stock */}
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`font-mono font-bold text-base ${
                            item.stockStatus === 'OUT_OF_STOCK'
                              ? 'text-status-cancelled'
                              : item.stockStatus === 'LOW'
                              ? 'text-status-pending'
                              : 'text-text'
                          }`}
                        >
                          {formatNumber(item.currentStock)}
                        </span>
                        <span className="text-xs text-muted ml-1">{item.unit}</span>
                      </td>

                      {/* Minimum Stock */}
                      <td className="py-3.5 px-4 text-right font-mono text-muted">
                        {formatNumber(item.minimumStock)}
                        {item.minimumStock !== null && (
                          <span className="text-xs text-muted ml-1">{item.unit}</span>
                        )}
                      </td>

                      {/* Stock Status */}
                      <td className="py-3.5 px-4 text-center">
                        {item.stockStatus === 'NORMAL' && (
                          <Badge variant="outline" className="border-status-ready text-status-ready bg-status-ready/10">
                            Bình thường
                          </Badge>
                        )}
                        {item.stockStatus === 'LOW' && (
                          <Badge variant="outline" className="border-status-pending text-status-pending bg-status-pending/10">
                            Tồn thấp
                          </Badge>
                        )}
                        {item.stockStatus === 'OUT_OF_STOCK' && (
                          <Badge variant="outline" className="border-status-cancelled text-status-cancelled bg-status-cancelled/10">
                            Hết hàng
                          </Badge>
                        )}
                      </td>

                      {/* Active Status */}
                      <td className="py-3.5 px-4 text-center">
                        {item.isActive ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-status-ready">
                            <span className="w-1.5 h-1.5 rounded-full bg-status-ready" />
                            Đang dùng
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
                            <span className="w-1.5 h-1.5 rounded-full bg-muted" />
                            Đã ngưng
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      {canModify && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(item)}
                              className="text-accent hover:bg-surface/50 p-1.5 h-auto"
                              title="Sửa thông tin"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>

                            {/* Deactivate button: Only for OWNER and only if still active */}
                            {isOwner && item.isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDeactivate(item)}
                                className="text-status-cancelled hover:bg-status-cancelled/10 p-1.5 h-auto"
                                title="Ngưng sử dụng nguyên liệu"
                              >
                                <Ban className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {pageData && pageData.totalPages > 1 && (
          <div className="p-3.5 border-t border-border flex items-center justify-between text-xs text-muted">
            <div>
              Hiển thị trang {pageData.page + 1} / {pageData.totalPages} (Tổng{' '}
              {pageData.totalElements} nguyên liệu)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                disabled={pageData.page === 0}
                className="h-8 px-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Trước</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.min(pageData.totalPages - 1, prev + 1))}
                disabled={pageData.page >= pageData.totalPages - 1}
                className="h-8 px-2"
              >
                <span>Sau</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <IngredientFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        initialData={editingIngredient}
        onSuccess={handleMutationSuccess}
      />

      <DeactivateIngredientModal
        isOpen={Boolean(deactivatingIngredient)}
        onClose={() => setDeactivatingIngredient(null)}
        ingredient={deactivatingIngredient}
        onSuccess={handleMutationSuccess}
      />
    </div>
  )
}

export default IngredientsPage
