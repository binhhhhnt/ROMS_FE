import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Receipt, DollarSign, Calendar, FileText } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  expenseFormSchema,
  type ExpenseFormValues,
} from '@/features/expenses/schemas/expenseSchema'
import type { ExpenseResponse } from '@/features/expenses/types/expense.types'

interface ExpenseFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (values: ExpenseFormValues) => Promise<void>
  expense?: ExpenseResponse | null
  isLoading?: boolean
}

export function ExpenseFormModal({
  isOpen,
  onClose,
  onSubmit,
  expense,
  isLoading = false,
}: ExpenseFormModalProps) {
  const isEditing = Boolean(expense)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      name: '',
      amount: 0,
      expenseDate: new Date().toISOString().split('T')[0],
      note: '',
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (expense) {
        reset({
          name: expense.name,
          amount: expense.amount,
          expenseDate: expense.expenseDate,
          note: expense.note || '',
        })
      } else {
        reset({
          name: '',
          amount: 0,
          expenseDate: new Date().toISOString().split('T')[0],
          note: '',
        })
      }
    }
  }, [isOpen, expense, reset])

  if (!isOpen) return null

  const handleFormSubmit = async (values: ExpenseFormValues) => {
    await onSubmit(values)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full shadow-2xl flex flex-col overflow-hidden text-left">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Receipt className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-base text-text">
                {isEditing ? 'Chỉnh sửa khoản chi phí' : 'Thêm khoản chi phí mới'}
              </h3>
              <p className="text-xs text-muted">
                {isEditing
                  ? `Mã khoản chi: #${expense?.id}`
                  : 'Ghi nhận chi phí phát sinh phục vụ vận hành nhà hàng'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-muted-bg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="expense-name" className="text-xs font-semibold text-text flex items-center justify-between">
              <span>Tên khoản chi / Mục đích</span>
              <span className="text-[11px] font-normal text-status-cancelled">* Bắt buộc</span>
            </label>
            <Input
              id="expense-name"
              placeholder="Ví dụ: Mua đá lạnh, Mua gas, Nước rửa chén, Tiền điện..."
              leftIcon={<Receipt className="w-4 h-4 text-muted" />}
              error={Boolean(errors.name)}
              disabled={isLoading}
              {...register('name')}
            />
            {errors.name && (
              <span className="text-xs text-status-cancelled">{errors.name.message}</span>
            )}
          </div>

          {/* Amount & Date in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="expense-amount" className="text-xs font-semibold text-text flex items-center justify-between">
                <span>Số tiền (VNĐ)</span>
                <span className="text-[11px] font-normal text-status-cancelled">* Bắt buộc</span>
              </label>
              <Input
                id="expense-amount"
                type="number"
                step="1000"
                min="0"
                placeholder="0"
                leftIcon={<DollarSign className="w-4 h-4 text-muted" />}
                error={Boolean(errors.amount)}
                disabled={isLoading}
                {...register('amount', { valueAsNumber: true })}
              />
              {errors.amount && (
                <span className="text-xs text-status-cancelled">{errors.amount.message}</span>
              )}
            </div>

            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="expense-date" className="text-xs font-semibold text-text flex items-center justify-between">
                <span>Ngày phát sinh</span>
                <span className="text-[11px] font-normal text-status-cancelled">* Bắt buộc</span>
              </label>
              <Input
                id="expense-date"
                type="date"
                leftIcon={<Calendar className="w-4 h-4 text-muted" />}
                error={Boolean(errors.expenseDate)}
                disabled={isLoading}
                {...register('expenseDate')}
              />
              {errors.expenseDate && (
                <span className="text-xs text-status-cancelled">{errors.expenseDate.message}</span>
              )}
            </div>
          </div>

          {/* Note */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="expense-note" className="text-xs font-semibold text-text">
              Ghi chú thêm (Tùy chọn)
            </label>
            <div className="relative">
              <textarea
                id="expense-note"
                rows={3}
                placeholder="Nhập thông tin hóa đơn, nhà cung cấp hoặc lưu ý kèm theo..."
                className="w-full text-xs p-3 rounded-md border border-border bg-card text-text placeholder:text-muted focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent transition-colors resize-none disabled:opacity-50"
                disabled={isLoading}
                {...register('note')}
              />
              <FileText className="w-4 h-4 text-muted absolute right-3 bottom-3 pointer-events-none opacity-40" />
            </div>
            {errors.note && (
              <span className="text-xs text-status-cancelled">{errors.note.message}</span>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-2">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onClose}
              disabled={isLoading}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="font-semibold shadow-sm px-5"
            >
              {isEditing ? 'Lưu thay đổi' : 'Thêm khoản chi'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
