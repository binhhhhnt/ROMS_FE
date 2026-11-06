import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Tag,
  Plus,
  Search,
  Percent,
  Banknote,
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
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            Đang chạy
          </span>
        )
      case 'OUT_OF_USES':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300/40">
            Hết lượt dùng
          </span>
        )
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-300/40">
            Đã hết hạn
          </span>
        )
      case 'NOT_STARTED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-300/40">
            Chưa bắt đầu
          </span>
        )
      case 'INACTIVE':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-300/40">
            Tạm ngưng
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-accent/10 text-accent">
              <Tag className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text">Quản Lý Khuyến Mãi</h1>
              <p className="text-sm text-text-secondary">
                Tạo mã ưu đãi, theo dõi số lượt sử dụng và cấu hình thể lệ áp dụng
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => {
            setEditingPromo(null)
            setIsFormOpen(true)
          }}
          className="bg-primary hover:bg-primary-hover text-white shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Tạo mã khuyến mãi
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm kiếm theo mã code hoặc tên chương trình..."
              className="pl-9 h-10 bg-background"
            />
          </div>
          <Button type="submit" variant="secondary" className="h-10">
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
            className="h-10 px-3 rounded-lg border border-border bg-background text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang kích hoạt</option>
            <option value="INACTIVE">Đã tạm ngưng</option>
          </select>

          {(search || statusFilter !== 'ALL') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs text-text-secondary hover:text-text h-10 px-2.5"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Đặt lại
            </Button>
          )}
        </div>
      </div>

      {/* Promotions Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-text-secondary">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Đang tải danh sách khuyến mãi...
          </div>
        ) : isError ? (
          <div className="p-12 text-center text-error">
            <p className="font-semibold mb-2">Đã xảy ra lỗi khi tải dữ liệu</p>
            <p className="text-xs text-text-secondary mb-4">{getApiErrorMessage(error)}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Thử lại
            </Button>
          </div>
        ) : !pageData?.content || pageData.content.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-text mb-1">Chưa có mã khuyến mãi nào</h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto mb-4">
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
                size="sm"
                onClick={() => {
                  setEditingPromo(null)
                  setIsFormOpen(true)
                }}
                className="bg-primary hover:bg-primary-hover text-white"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Tạo khuyến mãi đầu tiên
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface/60 text-xs font-semibold text-text-secondary uppercase border-b border-border">
                <tr>
                  <th className="py-3 px-4">Mã Code</th>
                  <th className="py-3 px-4">Tên chương trình</th>
                  <th className="py-3 px-4">Mức giảm</th>
                  <th className="py-3 px-4 min-w-[140px]">Đã dùng / Giới hạn</th>
                  <th className="py-3 px-4">Thời gian hiệu lực</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
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
                      className="hover:bg-surface/30 transition-colors group"
                    >
                      {/* Code */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 bg-accent/10 text-accent font-mono font-bold px-2.5 py-1 rounded-md text-xs tracking-wider border border-accent/20">
                          {promo.code}
                          <button
                            onClick={() => copyCode(promo.code)}
                            title="Sao chép mã"
                            className="hover:text-primary transition-colors p-0.5"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Tên & Người tạo */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-text">{promo.name}</div>
                        {promo.createdByName && (
                          <div className="text-[11px] text-text-secondary mt-0.5">
                            Tạo bởi: {promo.createdByName}
                          </div>
                        )}
                      </td>

                      {/* Mức giảm */}
                      <td className="py-3.5 px-4">
                        {promo.discountType === 'PERCENT' ? (
                          <span className="inline-flex items-center gap-1 font-bold text-accent text-sm">
                            <Percent className="w-3.5 h-3.5" />
                            {promo.discountValue}%
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                            <Banknote className="w-3.5 h-3.5" />
                            {formatCurrency(promo.discountValue)}
                          </span>
                        )}
                      </td>

                      {/* Tiến độ sử dụng */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-between text-xs mb-1 font-medium">
                          <span className="text-text font-semibold">{promo.usedCount}</span>
                          <span className="text-text-secondary">
                            / {promo.maxUses !== null ? `${promo.maxUses} lượt` : '∞ vô hạn'}
                          </span>
                        </div>
                        {promo.maxUses !== null && usagePercent !== null && (
                          <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                usagePercent >= 100
                                  ? 'bg-rose-500'
                                  : usagePercent >= 80
                                  ? 'bg-amber-500'
                                  : 'bg-accent'
                              }`}
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        )}
                      </td>

                      {/* Thời hạn */}
                      <td className="py-3.5 px-4 text-xs text-text-secondary">
                        {promo.startDate || promo.endDate ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-accent/80 shrink-0" />
                            <span>
                              {formatDate(promo.startDate) || 'Hiện tại'} -{' '}
                              {formatDate(promo.endDate) || 'Vô hạn'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-text-secondary italic">Vô thời hạn</span>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4 text-center">
                        {renderBadge(promo.statusBadge)}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* Toggle Active */}
                          <button
                            onClick={() => toggleMutation.mutate(promo.id)}
                            disabled={toggleMutation.isPending}
                            title={promo.isActive ? 'Tạm ngưng mã này' : 'Bật lại mã này'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              promo.isActive
                                ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                : 'text-zinc-400 hover:bg-surface hover:text-zinc-600'
                            }`}
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => {
                              setEditingPromo(promo)
                              setIsFormOpen(true)
                            }}
                            title="Chỉnh sửa"
                            className="p-1.5 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeletingPromo(promo)}
                            title="Xóa khuyến mãi"
                            className="p-1.5 rounded-lg text-text-secondary hover:text-error hover:bg-error/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
          <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-surface/30">
            <span className="text-xs text-text-secondary">
              Hiển thị trang <span className="font-semibold text-text">{page + 1}</span> /{' '}
              <span className="font-semibold text-text">{pageData.totalPages}</span> (Tổng số{' '}
              {pageData.totalElements} mã)
            </span>
            <div className="flex items-center gap-2">
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

