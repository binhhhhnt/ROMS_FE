import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Layers, Hash, AlignLeft, CheckCircle2 } from 'lucide-react'
import { categorySchema, type CategoryFormValues } from '@/features/menu/schemas/categorySchema'
import type { CategoryResponse } from '@/features/menu/types/category.types'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

interface CategoryFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (values: CategoryFormValues) => Promise<void>
  category?: CategoryResponse | null
  isLoading?: boolean
}

export function CategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  category,
  isLoading = false,
}: CategoryFormModalProps) {
  const isEditing = Boolean(category)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      displayOrder: 1,
      isActive: true,
    },
  })

  const isActiveValue = watch('isActive')

  useEffect(() => {
    if (isOpen) {
      if (category) {
        reset({
          name: category.name,
          description: category.description || '',
          displayOrder: category.displayOrder,
          isActive: category.isActive,
        })
      } else {
        reset({
          name: '',
          description: '',
          displayOrder: 1,
          isActive: true,
        })
      }
    }
  }, [isOpen, category, reset])

  if (!isOpen) return null

  const handleFormSubmit = async (values: CategoryFormValues) => {
    await onSubmit(values)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full shadow-2xl flex flex-col overflow-hidden text-left">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-base text-text">
                {isEditing ? 'Chỉnh sửa danh mục món' : 'Thêm danh mục món mới'}
              </h3>
              <p className="text-xs text-muted">
                {isEditing
                  ? `Mã danh mục: #${category?.id}`
                  : 'Tạo nhóm phân loại các món ăn hiển thị trên thực đơn'}
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
            <label htmlFor="cat-name" className="text-xs font-semibold text-text flex items-center justify-between">
              <span>Tên danh mục</span>
              <span className="text-[11px] font-normal text-status-cancelled">* Bắt buộc</span>
            </label>
            <Input
              id="cat-name"
              placeholder="Ví dụ: Món khai vị, Món chính, Đồ uống, Tráng miệng..."
              leftIcon={<Layers className="w-4 h-4 text-muted" />}
              error={Boolean(errors.name)}
              disabled={isLoading}
              {...register('name')}
            />
            {errors.name && (
              <span className="text-xs text-status-cancelled">{errors.name.message}</span>
            )}
          </div>

          {/* Display Order */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cat-display-order" className="text-xs font-semibold text-text flex items-center justify-between">
              <span>Thứ tự hiển thị trên Menu / Tablet</span>
              <span className="text-[11px] font-normal text-status-cancelled">* Bắt buộc</span>
            </label>
            <Input
              id="cat-display-order"
              type="number"
              min="0"
              placeholder="1"
              leftIcon={<Hash className="w-4 h-4 text-muted" />}
              error={Boolean(errors.displayOrder)}
              disabled={isLoading}
              {...register('displayOrder', { valueAsNumber: true })}
            />
            <p className="text-[11px] text-muted">
              Số nhỏ hơn sẽ được ưu tiên hiển thị trước trên thanh danh mục tablet của thực khách.
            </p>
            {errors.displayOrder && (
              <span className="text-xs text-status-cancelled">{errors.displayOrder.message}</span>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cat-desc" className="text-xs font-semibold text-text flex items-center justify-between">
              <span>Mô tả danh mục</span>
              <span className="text-[11px] font-normal text-muted">(Tùy chọn)</span>
            </label>
            <div className="relative">
              <textarea
                id="cat-desc"
                rows={3}
                placeholder="Mô tả tóm tắt về đặc trưng của danh mục món ăn này..."
                disabled={isLoading}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-input text-text placeholder:text-muted/60 focus:outline-hidden focus:ring-2 focus:ring-accent/40 focus:border-accent disabled:opacity-50 transition-all resize-none"
                {...register('description')}
              />
              <AlignLeft className="w-4 h-4 text-muted absolute right-3 top-3 pointer-events-none" />
            </div>
            {errors.description && (
              <span className="text-xs text-status-cancelled">{errors.description.message}</span>
            )}
          </div>

          {/* Active Status Switch */}
          <div className="p-3.5 rounded-xl bg-surface/30 border border-border flex items-center justify-between cursor-pointer"
               onClick={() => !isLoading && setValue('isActive', !isActiveValue, { shouldValidate: true })}>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-text flex items-center gap-1.5">
                <CheckCircle2 className={`w-4 h-4 ${isActiveValue ? 'text-status-ready' : 'text-muted'}`} />
                Hiển thị trên thực đơn
              </span>
              <span className="text-[11px] text-muted">
                {isActiveValue
                  ? 'Danh mục đang kích hoạt và hiển thị cho thực khách đặt món'
                  : 'Tạm ẩn danh mục khỏi thực đơn tablet và danh sách gọi món'}
              </span>
            </div>
            <input
              type="checkbox"
              id="cat-active"
              className="w-4 h-4 accent-primary rounded cursor-pointer shrink-0"
              disabled={isLoading}
              checked={isActiveValue}
              onChange={(e) => setValue('isActive', e.target.checked, { shouldValidate: true })}
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isLoading}
              className="bg-primary hover:bg-primary-hover text-white font-semibold"
            >
              {isEditing ? 'Lưu thay đổi' : 'Tạo danh mục'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
