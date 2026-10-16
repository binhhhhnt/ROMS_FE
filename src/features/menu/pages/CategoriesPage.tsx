import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Layers,
  Plus,
  Search,
  RotateCw,
  CheckCircle2,
  EyeOff,
  Filter,
} from 'lucide-react'
import { categoryApi } from '@/features/menu/api/categoryApi'
import type { CategoryResponse } from '@/features/menu/types/category.types'
import type { CategoryFormValues } from '@/features/menu/schemas/categorySchema'
import { CategoryTable } from '@/features/menu/components/CategoryTable'
import { CategoryFormModal } from '@/features/menu/components/CategoryFormModal'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Card } from '@/shared/components/ui/card'
import { getApiErrorMessage } from '@/shared/lib/axios'

export function CategoriesPage() {
  const queryClient = useQueryClient()

  // Pagination & Filter state
  const [page, setPage] = useState(0)
  const [size] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<CategoryResponse | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  // 1. Fetch categories
  const {
    data: pageData,
    isLoading,
    isRefetching,
    isError,
    error,
  } = useQuery({
    queryKey: ['categories', page, size],
    queryFn: () => categoryApi.getCategories({ page, size, sort: 'displayOrder' }),
  })

  // 2. Create mutation
  const createMutation = useMutation({
    mutationFn: (values: CategoryFormValues) => categoryApi.createCategory(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Tạo danh mục mới thành công!')
      setIsModalOpen(false)
    },
    onError: (err) => {
      toast.error('Lỗi khi tạo danh mục: ' + getApiErrorMessage(err))
    },
  })

  // 3. Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: CategoryFormValues }) =>
      categoryApi.updateCategory(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Cập nhật danh mục thành công!')
      setIsModalOpen(false)
      setSelectedCategory(null)
    },
    onError: (err) => {
      toast.error('Lỗi khi cập nhật danh mục: ' + getApiErrorMessage(err))
    },
  })

  // 4. Toggle status mutation
  const toggleMutation = useMutation({
    mutationFn: (category: CategoryResponse) => categoryApi.toggleCategoryStatus(category),
    onMutate: (category) => {
      setTogglingId(category.id)
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success(
        updated.isActive
          ? `Đã hiển thị danh mục "${updated.name}" trên thực đơn`
          : `Đã tạm ẩn danh mục "${updated.name}" khỏi thực đơn`
      )
    },
    onError: (err) => {
      toast.error('Lỗi khi đổi trạng thái danh mục: ' + getApiErrorMessage(err))
    },
    onSettled: () => {
      setTogglingId(null)
    },
  })

  // Filtered categories
  const filteredCategories = useMemo(() => {
    const list = pageData?.content || []
    return list.filter((cat) => {
      const matchSearch =
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'ACTIVE'
          ? cat.isActive
          : !cat.isActive

      return matchSearch && matchStatus
    })
  }, [pageData?.content, searchTerm, statusFilter])

  // Stats calculation
  const stats = useMemo(() => {
    const list = pageData?.content || []
    const total = pageData?.totalElements || list.length
    const active = list.filter((c) => c.isActive).length
    const inactive = list.filter((c) => !c.isActive).length
    return { total, active, inactive }
  }, [pageData])

  // Handlers
  const handleOpenCreate = () => {
    setSelectedCategory(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (category: CategoryResponse) => {
    setSelectedCategory(category)
    setIsModalOpen(true)
  }

  const handleFormSubmit = async (values: CategoryFormValues) => {
    if (selectedCategory) {
      await updateMutation.mutateAsync({ id: selectedCategory.id, values })
    } else {
      await createMutation.mutateAsync(values)
    }
  }

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['categories'] })
    toast.info('Đã làm mới danh mục món')
  }

  return (
    <div className="flex flex-col gap-6 text-left max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-primary" />
            Quản lý Danh mục Món
          </h1>
          <p className="text-xs text-muted mt-1">
            Phân loại thực đơn nhà hàng và quản lý thứ tự hiển thị danh mục trên tablet của thực khách.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-primary hover:bg-primary-hover text-white shadow-xs flex items-center gap-2 self-start sm:self-auto font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm danh mục mới</span>
        </Button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border border-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-muted font-medium">TỔNG SỐ DANH MỤC</span>
            <div className="text-2xl font-black font-mono text-primary mt-1">
              {stats.total}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 border border-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-muted font-medium">ĐANG HIỂN THỊ</span>
            <div className="text-2xl font-black font-mono text-status-ready mt-1">
              {stats.active}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-status-ready/15 text-status-ready flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 border border-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-muted font-medium">ĐANG TẠM ẨN</span>
            <div className="text-2xl font-black font-mono text-muted mt-1">
              {stats.inactive}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-muted-bg text-muted flex items-center justify-center shrink-0">
            <EyeOff className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Tìm theo tên danh mục hoặc mô tả..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-muted" />}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-surface/50 border border-border rounded-lg p-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-muted ml-1 mr-0.5" />
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted hover:text-text'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'ACTIVE'
                  ? 'bg-status-ready text-white shadow-xs'
                  : 'text-muted hover:text-text'
              }`}
            >
              Đang hiển thị
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('INACTIVE')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'INACTIVE'
                  ? 'bg-muted-bg text-text shadow-xs'
                  : 'text-muted hover:text-text'
              }`}
            >
              Đang tạm ẩn
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefetching}
            className="h-9 px-3 text-xs flex items-center gap-1.5 border-border hover:bg-surface"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* Error alert */}
      {isError && (
        <div className="p-4 rounded-xl bg-status-cancelled/10 border border-status-cancelled/30 text-status-cancelled text-xs">
          Có lỗi khi tải danh sách danh mục: {getApiErrorMessage(error)}
        </div>
      )}

      {/* Table */}
      <CategoryTable
        categories={filteredCategories}
        isLoading={isLoading}
        onEdit={handleOpenEdit}
        onToggleStatus={(cat) => toggleMutation.mutate(cat)}
        isTogglingId={togglingId}
        pagination={
          pageData
            ? {
                page: pageData.page,
                totalPages: pageData.totalPages,
                totalElements: pageData.totalElements,
                size: pageData.size,
                onPageChange: (newPage) => setPage(newPage),
              }
            : undefined
        }
      />

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <CategoryFormModal
          category={selectedCategory}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedCategory(null)
          }}
          onSave={handleFormSubmit}
        />
      )}
    </div>
  )
}
export default CategoriesPage
