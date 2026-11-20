import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  Calendar,
  Copy,
  Edit2,
  Trash2,
  Power,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import { promotionApi } from '@/features/promotions/api/promotionApi'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { PromotionFormModal } from '@/features/promotions/components/PromotionFormModal'
import { PromotionDeleteModal } from '@/features/promotions/components/PromotionDeleteModal'
import type {
  PromotionResponse,
  PromotionStatusBadge,
} from '@/features/promotions/types/promotion.types'
import type { PromotionFormValues } from '@/features/promotions/schemas/promotionSchema'

export function PromotionsPage() {
  const queryClient = useQueryClient()

  // Filter states
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [page, setPage] = useState(0)
  const pageSize = 10

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPromo, setEditingPromo] = useState<PromotionResponse | null>(null)
  const [deletingPromo, setDeletingPromo] = useState<PromotionResponse | null>(null)

  const isActiveParam = useMemo(() => {
    if (statusFilter === 'ACTIVE') return true
    if (statusFilter === 'INACTIVE') return false
    return undefined
  }, [statusFilter])

  // Query: Get Promotions
  const {
    data: pageData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['promotions', { page, size: pageSize, search, isActive: isActiveParam }],
    queryFn: () =>
      promotionApi.getPromotions({
        page,
        size: pageSize,
        search: search || undefined,
        isActive: isActiveParam,
      }),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (values: PromotionFormValues) => promotionApi.createPromotion(values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] })
      toast.success(`Đã tạo mã khuyến mãi ${data.code} thành công!`)
      setIsFormOpen(false)
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: PromotionFormValues }) =>
      promotionApi.updatePromotion(id, values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] })
      toast.success(`Đã cập nhật mã khuyến mãi ${data.code} thành công!`)
      setIsFormOpen(false)
      setEditingPromo(null)
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => promotionApi.deletePromotion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] })
      toast.success('Đã xóa mã khuyến mãi thành công!')
      setDeletingPromo(null)
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err))
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (id: number) => promotionApi.toggleStatus(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] })
      toast.success(
        data.isActive
          ? `Đã kích hoạt mã ${data.code}`
          : `Đã tạm ngưng mã ${data.code}`
      )
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err))
    },
  })

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    setSearch(searchInput.trim())
  }

  const handleResetFilters = () => {
    setSearchInput('')
    setSearch('')
    setStatusFilter('ALL')
    setPage(0)
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success(`Đã sao chép mã: ${code}`)
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    const [year, month, day] = dateStr.split('-')
    return `${day}/${month}/${year}`
  }

  const renderBadge = (badge: PromotionStatusBadge) => {
    switch (badge) {
      case 'ACTIVE':
        return (
          <Badge variant="ready">
            <span className="w-1.5 h-1.5 rounded-full bg-status-ready shrink-0" />
            Đang chạy
          </Badge>
        )
      case 'OUT_OF_USES':
        return <Badge variant="pending">Hết lượt dùng</Badge>
      case 'EXPIRED':
        return <Badge variant="cancelled">Đã hết hạn</Badge>
      case 'NOT_STARTED':
        return <Badge variant="cooking">Chưa bắt đầu</Badge>
      case 'INACTIVE':
      default:
        return (
          <Badge variant="outline" className="text-muted">
            Tạm ngưng
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-5">
      {/* Tầng 1: Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-border">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-text">Quản lý khuyến mãi</h1>
          <p className="text-xs text-muted mt-0.5">
            Tạo mã ưu đãi, theo dõi số lượt sử dụng và cấu hình thể lệ áp dụng
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingPromo(null)
            setIsFormOpen(true)
          }}
          className="h-9 px-3.5 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tạo mã khuyến mãi
        </Button>
      </div>

      {/* Tầng 2: Filter Bar */}
      <div className="bg-card border border-border rounded-lg p-3.5 flex flex-col md:flex-row gap-2.5 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm kiếm theo mã code hoặc tên chương trình..."
              className="pl-9 h-9 text-xs"
            />
          </div>
          <Button type="submit" variant="primary" size="sm" className="h-9 px-4 text-xs">
            Tìm
          </Button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')
              setPage(0)
            }}
            className="h-9 px-3 rounded-md border border-border bg-card text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang kích hoạt</option>
            <option value="INACTIVE">Đã tạm ngưng</option>
          </select>

          {(search || statusFilter !== 'ALL') && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs h-9 px-3 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Đặt lại
            </Button>
          )}
        </div>
      </div>

      {/* Tầng 3: Promotions Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted text-xs">
            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Đang tải danh sách khuyến mãi...
          </div>
        ) : isError ? (
          <div className="p-12 text-center text-status-cancelled">
            <p className="font-semibold text-sm mb-1">Đã xảy ra lỗi khi tải dữ liệu</p>
            <p className="text-xs text-muted mb-4">{getApiErrorMessage(error)}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Thử lại
            </Button>
          </div>
        ) : !pageData?.content || pageData.content.length === 0 ? (
          <div className="p-12 text-center">
            <Sparkles className="w-8 h-8 text-muted/60 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-text mb-1">Chưa có mã khuyến mãi nào</h3>
            <p className="text-xs text-muted max-w-sm mx-auto mb-4">
              {search || statusFilter !== 'ALL'
                ? 'Không tìm thấy kết quả phù hợp với bộ lọc hiện tại.'
                : 'Bắt đầu tạo mã ưu đãi để thu hút khách hàng và gia tăng doanh số.'}
            </p>
            {search || statusFilter !== 'ALL' ? (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Xóa bộ lọc
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingPromo(null)
                  setIsFormOpen(true)
                }}
              >
                <Plus className="w-4 h-4 mr-1.5" /> Tạo khuyến mãi đầu tiên
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-xs">
              <thead className="bg-surface/60 font-medium text-muted border-b border-border">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">Mã Code</th>
                  <th className="py-3 px-4">Tên chương trình</th>
                  <th className="py-3 px-4 whitespace-nowrap">Mức giảm</th>
                  <th className="py-3 px-4 min-w-[140px] whitespace-nowrap">Đã dùng / Giới hạn</th>
                  <th className="py-3 px-4 whitespace-nowrap">Thời gian hiệu lực</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Trạng thái</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageData.content.map((promo) => {
                  const usagePercent =
                    promo.maxUses && promo.maxUses > 0
                      ? Math.min(100, Math.round((promo.usedCount / promo.maxUses) * 100))
                      : null

                  return (
                    <tr
                      key={promo.id}
                      className="hover:bg-muted-bg/40 transition-colors"
                    >
                      {/* Code */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 font-mono font-semibold text-xs text-primary">
                          <span>{promo.code}</span>
                          <button
                            onClick={() => copyCode(promo.code)}
                            title="Sao chép mã"
                            className="text-muted hover:text-text transition-colors p-0.5 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Tên & Người tạo */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-sm text-text">{promo.name}</div>
                        {promo.createdByName && (
                          <div className="text-xs text-muted mt-0.5">
                            Tạo bởi: {promo.createdByName}
                          </div>
                        )}
                      </td>

                      {/* Mức giảm */}
                      <td className="py-3 px-4 whitespace-nowrap tabular-nums">
                        {promo.discountType === 'PERCENT' ? (
                          <span className="font-semibold text-text text-sm">
                            {promo.discountValue}%
                          </span>
                        ) : (
                          <span className="font-semibold text-status-completed text-sm">
                            {formatCurrency(promo.discountValue)}
                          </span>
                        )}
                      </td>

                      {/* Tiến độ sử dụng */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-between text-xs mb-1 font-medium tabular-nums">
                          <span className="text-text font-semibold">{promo.usedCount}</span>
                          <span className="text-muted">
                            / {promo.maxUses !== null ? `${promo.maxUses} lượt` : '∞ vô hạn'}
                          </span>
                        </div>
                        {promo.maxUses !== null && usagePercent !== null && (
                          <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                usagePercent >= 100
                                  ? 'bg-status-cancelled'
                                  : usagePercent >= 80
                                    ? 'bg-status-pending'
                                    : 'bg-primary'
                              }`}
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        )}
                      </td>

                      {/* Thời hạn */}
                      <td className="py-3 px-4 text-xs text-muted whitespace-nowrap tabular-nums">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {formatDate(
                              promo.startDate ||
                              (promo.createdAt ? promo.createdAt.slice(0, 10) : null)
                            )}{' '}
                            - {formatDate(promo.endDate) || 'Vô thời hạn'}
                          </span>
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {renderBadge(promo.statusBadge)}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => toggleMutation.mutate(promo.id)}
                            disabled={toggleMutation.isPending}
                            title={promo.isActive ? 'Tạm ngưng mã này' : 'Bật lại mã này'}
                            className={`h-8 px-2 ${
                              promo.isActive ? 'text-status-completed' : 'text-muted'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingPromo(promo)
                              setIsFormOpen(true)
                            }}
                            title="Chỉnh sửa"
                            className="h-8 px-2"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            type="button"
                            variant="destructiveOutline"
                            size="sm"
                            onClick={() => setDeletingPromo(promo)}
                            title="Xóa khuyến mãi"
                            className="h-8 px-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pageData && pageData.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card text-xs">
            <span className="text-muted">
              Trang <strong className="text-text tabular-nums">{page + 1}</strong> /{' '}
              <strong className="text-text tabular-nums">{pageData.totalPages}</strong> ({pageData.totalElements} mã)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="h-8 px-2.5 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pageData.totalPages - 1, p + 1))}
                disabled={page >= pageData.totalPages - 1}
                className="h-8 px-2.5 text-xs"
              >
                Sau
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal (Create / Edit) */}
      <PromotionFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingPromo(null)
        }}
        promotion={editingPromo}
        isLoading={createMutation.isPending || updateMutation.isPending}
        onSubmit={async (values) => {
          if (editingPromo) {
            await updateMutation.mutateAsync({ id: editingPromo.id, values })
          } else {
            await createMutation.mutateAsync(values)
          }
        }}
      />

      {/* Delete Confirmation Modal */}
      <PromotionDeleteModal
        isOpen={Boolean(deletingPromo)}
        onClose={() => setDeletingPromo(null)}
        promotion={deletingPromo}
        isLoading={deleteMutation.isPending}
        onConfirm={async () => {
          if (deletingPromo) {
            await deleteMutation.mutateAsync(deletingPromo.id)
          }
        }}
      />
    </div>
  )
}

