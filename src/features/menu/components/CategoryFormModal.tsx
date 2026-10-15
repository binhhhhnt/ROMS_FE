import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import type { ApiErrorResponse } from '@/shared/types/api.types'
import { getCategoryErrorMessage } from '../api/categoryApi'
import { categorySchema, type CategoryFormValues } from '../schemas/categorySchema'
import type { CategoryResponse } from '../types/category.types'

interface CategoryFormModalProps {
  category: CategoryResponse | null
  onClose: () => void
  onSave: (values: CategoryFormValues) => Promise<void>
}

export function CategoryFormModal({ category, onClose, onSave }: CategoryFormModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? '',
      description: category?.description ?? '',
      displayOrder: category?.displayOrder ?? 0,
      isActive: category?.isActive ?? true,
    },
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

  const submit = handleSubmit(async (values) => {
    setSubmitError(null)
    try {
      await onSave(values)
    } catch (error) {
      setSubmitError(getCategoryErrorMessage(error))
      if (axios.isAxiosError<ApiErrorResponse>(error) && error.response?.status === 400) {
        const details = error.response.data.error?.details
        if (details && typeof details === 'object') {
          const messages: Record<keyof CategoryFormValues, string> = {
            name: 'Tên danh mục chưa hợp lệ (bắt buộc, tối đa 100 ký tự).',
            description: 'Mô tả chưa hợp lệ (tối đa 255 ký tự).',
            displayOrder: 'Thứ tự hiển thị phải là số nguyên trong phạm vi cho phép.',
            isActive: 'Vui lòng chọn trạng thái danh mục hợp lệ.',
          }
          for (const field of Object.keys(messages) as Array<keyof CategoryFormValues>) {
            if (Object.hasOwn(details, field)) setError(field, { type: 'server', message: messages[field] })
          }
        }
      }
    }
  })

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="category-dialog-title"
      aria-describedby="category-dialog-description"
      aria-modal="true"
      onCancel={(event) => { event.preventDefault(); if (!isSubmitting) onClose() }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-0 text-text shadow-xl backdrop:bg-primary/40"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border p-6">
        <div>
          <h2 id="category-dialog-title" className="text-xl font-bold text-primary">
            {category ? 'Chỉnh sửa danh mục' : 'Thêm danh mục'}
          </h2>
          <p id="category-dialog-description" className="mt-1 text-sm text-muted">Sắp xếp và quản lý nhóm món trong thực đơn.</p>
        </div>
        <Button type="button" variant="ghost" size="icon" aria-label="Đóng biểu mẫu" onClick={onClose} disabled={isSubmitting}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      <form onSubmit={submit} noValidate aria-busy={isSubmitting}>
        <fieldset disabled={isSubmitting} className="flex min-w-0 flex-col gap-5 p-6">
          <div>
            <label htmlFor="category-name" className="mb-2 block text-sm font-semibold">Tên danh mục <span className="text-status-cancelled">*</span></label>
            <Input id="category-name" autoFocus maxLength={100} autoComplete="off" aria-required="true" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'category-name-error' : undefined} error={!!errors.name} {...register('name')} />
            {errors.name && <p id="category-name-error" className="mt-1 text-sm text-status-cancelled">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="category-description" className="mb-2 block text-sm font-semibold">Mô tả</label>
            <textarea id="category-description" rows={3} maxLength={255} aria-invalid={!!errors.description} aria-describedby="category-description-help category-description-error" className="w-full resize-y rounded-md border border-border bg-card p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" {...register('description')} />
            <p id="category-description-help" className="mt-1 text-xs text-muted">Tối đa 255 ký tự.</p>
            <p id="category-description-error" className="mt-1 text-sm text-status-cancelled">{errors.description?.message}</p>
          </div>
          <div>
            <label htmlFor="category-display-order" className="mb-2 block text-sm font-semibold">Thứ tự hiển thị <span className="text-status-cancelled">*</span></label>
            <Input id="category-display-order" type="number" step="1" aria-required="true" aria-invalid={!!errors.displayOrder} aria-describedby="category-order-help category-order-error" error={!!errors.displayOrder} {...register('displayOrder', { valueAsNumber: true })} />
            <p id="category-order-help" className="mt-1 text-xs text-muted">Số nhỏ hơn được hiển thị trước.</p>
            <p id="category-order-error" className="mt-1 text-sm text-status-cancelled">{errors.displayOrder?.message}</p>
          </div>
          <div>
            <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
              <input type="checkbox" className="h-4 w-4 accent-primary focus-visible:outline-accent" {...register('isActive')} />
              Đang hoạt động
            </label>
            <p className="mt-2 text-xs leading-relaxed text-muted">Danh mục ngừng hoạt động và các món thuộc danh mục sẽ không hiển thị trên thực đơn của tài khoản bàn.</p>
            {errors.isActive && <p className="mt-1 text-sm text-status-cancelled">{errors.isActive.message}</p>}
          </div>
          {submitError && <p role="alert" className="rounded-lg border border-status-cancelled/30 bg-status-cancelled/5 p-3 text-sm text-status-cancelled">{submitError}</p>}
        </fieldset>
        <div className="flex justify-end gap-3 border-t border-border bg-background px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Hủy</Button>
          <Button type="submit" isLoading={isSubmitting}>{category ? 'Lưu thay đổi' : 'Tạo danh mục'}</Button>
        </div>
      </form>
    </dialog>
  )
}
