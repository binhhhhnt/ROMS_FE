import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { DollarSign, CheckCircle2, XCircle, TrendingDown } from 'lucide-react'
import { expenseApi } from '@/features/expenses/api/expenseApi'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { ExpenseFilterBar } from '@/features/expenses/components/ExpenseFilterBar'
import { ExpenseTable } from '@/features/expenses/components/ExpenseTable'
import { ExpenseFormModal } from '@/features/expenses/components/ExpenseFormModal'
import { CancelExpenseModal } from '@/features/expenses/components/CancelExpenseModal'
import type { ExpenseResponse } from '@/features/expenses/types/expense.types'
import type { ExpenseFormValues } from '@/features/expenses/schemas/expenseSchema'

export function ExpensesPage() {
  const queryClient = useQueryClient()

  // Filters state
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState('ALL')
  const [page, setPage] = useState(0)
  const pageSize = 10

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<ExpenseResponse | null>(null)
  const [cancellingExpense, setCancellingExpense] = useState<ExpenseResponse | null>(null)

  // Query: Get Expenses list
  const {
    data: pageData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['expenses', { page, size: pageSize, startDate, endDate, status }],
    queryFn: () =>
      expenseApi.getExpenses({
        page,
        size: pageSize,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: status || undefined,
        sort: 'expenseDate,desc',
      }),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (values: ExpenseFormValues) => expenseApi.createExpense(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Thêm khoản chi phí mới thành công!')
      setIsFormModalOpen(false)
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: ExpenseFormValues }) =>
      expenseApi.updateExpense(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Cập nhật khoản chi phí thành công!')
      setIsFormModalOpen(false)
      setEditingExpense(null)
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err))
    },
  })

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      expenseApi.cancelExpense(id, { cancelReason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Đã hủy khoản chi phí thành công!')
      setCancellingExpense(null)
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err))
    },
  })

  // Handlers
  const handleOpenCreateModal = () => {
    setEditingExpense(null)
    setIsFormModalOpen(true)
  }

  const handleOpenEditModal = (expense: ExpenseResponse) => {
    setEditingExpense(expense)
    setIsFormModalOpen(true)
  }

  const handleOpenCancelModal = (expense: ExpenseResponse) => {
    setCancellingExpense(expense)
  }

  const handleFormSubmit = async (values: ExpenseFormValues) => {
    if (editingExpense) {
      await updateMutation.mutateAsync({ id: editingExpense.id, values })
    } else {
      await createMutation.mutateAsync(values)
    }
  }

  const handleConfirmCancel = async (reason: string) => {
    if (cancellingExpense) {
      await cancelMutation.mutateAsync({ id: cancellingExpense.id, reason })
    }
  }

  const handleResetFilters = () => {
    setStartDate('')
    setEndDate('')
    setStatus('ALL')
    setPage(0)
  }

  // Quick stats calculation for current page items
  const stats = useMemo(() => {
    const list = pageData?.content || []
    const activeList = list.filter((item) => item.status === 'ACTIVE')
    const cancelledList = list.filter((item) => item.status === 'CANCELLED')
    const activeTotalAmount = activeList.reduce((sum, item) => sum + item.amount, 0)

    return {
      totalCount: pageData?.totalElements || 0,
      activeCount: activeList.length,
      cancelledCount: cancelledList.length,
      activeTotalAmount,
    }
  }, [pageData])

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num)
  }

  return (
    <div className="flex flex-col gap-6 text-left max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text tracking-tight flex items-center gap-2">
            Quản lý Chi phí
          </h1>
          <p className="text-xs text-muted mt-1">
            Ghi nhận và quản lý các khoản chi phí phát sinh trong quá trình vận hành nhà hàng.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-muted font-medium">Tổng chi trên trang hiện tại</span>
            <div className="text-xl font-bold font-mono text-status-cancelled mt-1">
              {formatVND(stats.activeTotalAmount)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-status-cancelled/10 text-status-cancelled flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-muted font-medium">Tổng số khoản chi (Toàn hệ thống)</span>
            <div className="text-xl font-bold font-mono text-primary mt-1">
              {stats.totalCount} <span className="text-xs font-normal text-muted">khoản</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-muted font-medium">Trạng thái (Trên trang)</span>
            <div className="text-sm font-semibold text-text mt-1 flex items-center gap-3">
              <span className="text-status-ready flex items-center gap-1 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> {stats.activeCount} Hoạt động
              </span>
              <span className="text-status-cancelled flex items-center gap-1 text-xs">
                <XCircle className="w-3.5 h-3.5" /> {stats.cancelledCount} Đã hủy
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-surface text-accent flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="p-4 rounded-xl bg-status-cancelled/10 border border-status-cancelled/30 text-status-cancelled text-xs">
          Có lỗi khi tải danh sách chi phí: {getApiErrorMessage(error)}
        </div>
      )}

      {/* Filter Bar */}
      <ExpenseFilterBar
        startDate={startDate}
        endDate={endDate}
        status={status}
        onStartDateChange={(val) => {
          setStartDate(val)
          setPage(0)
        }}
        onEndDateChange={(val) => {
          setEndDate(val)
          setPage(0)
        }}
        onStatusChange={(val) => {
          setStatus(val)
          setPage(0)
        }}
        onReset={handleResetFilters}
        onOpenCreateModal={handleOpenCreateModal}
      />

      {/* Expense Table */}
      <ExpenseTable
        expenses={pageData?.content || []}
        isLoading={isLoading}
        currentPage={page}
        totalPages={pageData?.totalPages || 0}
        totalElements={pageData?.totalElements || 0}
        onPageChange={(newPage) => setPage(newPage)}
        onEdit={handleOpenEditModal}
        onCancel={handleOpenCancelModal}
      />

      {/* Create / Edit Modal */}
      <ExpenseFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false)
          setEditingExpense(null)
        }}
        onSubmit={handleFormSubmit}
        expense={editingExpense}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Cancel Modal */}
      <CancelExpenseModal
        isOpen={Boolean(cancellingExpense)}
        onClose={() => setCancellingExpense(null)}
        onConfirm={handleConfirmCancel}
        expense={cancellingExpense}
        isLoading={cancelMutation.isPending}
      />
    </div>
  )
}
export default ExpensesPage
