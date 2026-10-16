import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, PackagePlus, Edit3, AlertCircle, Info } from 'lucide-react'
import { toast } from 'sonner'

import {
  ingredientSchema,
  type IngredientFormValues,
} from '@/features/inventory/schemas/ingredientSchema'
import { ingredientApi } from '@/features/inventory/api/ingredientApi'
import type { IngredientResponse } from '@/features/inventory/types/ingredient.types'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

interface IngredientFormModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: IngredientResponse | null
  onSuccess: () => void
}

export function IngredientFormModal({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}: IngredientFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEdit = Boolean(initialData)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IngredientFormValues>({
    resolver: zodResolver(ingredientSchema),
    defaultValues: {
      name: '',
      unit: '',
      minimumStock: '',
    },
  })

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        unit: initialData.unit,
        minimumStock:
          initialData.minimumStock !== null && initialData.minimumStock !== undefined
            ? String(initialData.minimumStock)
            : '',
      })
    } else {
      reset({
        name: '',
        unit: '',
        minimumStock: '',
      })
    }
  }, [initialData, reset, isOpen])

  if (!isOpen) return null

  const onSubmit = async (values: IngredientFormValues) => {
    setIsSubmitting(true)
    const parsedMinStock =
      values.minimumStock && values.minimumStock.trim() !== ''
        ? Number(values.minimumStock)
        : null

    try {
      if (isEdit && initialData) {
        await ingredientApi.updateIngredient(initialData.id, {
          name: values.name.trim(),
          unit: values.unit.trim(),
          minimumStock: parsedMinStock,
        })
        toast.success(`Đã cập nhật nguyên liệu "${values.name.trim()}"`)
      } else {
        await ingredientApi.createIngredient({
          name: values.name.trim(),
          unit: values.unit.trim(),
          minimumStock: parsedMinStock,
        })
        toast.success(`Đã thêm nguyên liệu mới "${values.name.trim()}"`)
      }
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-5 text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-surface text-primary">
              {isEdit ? <Edit3 className="w-5 h-5 text-accent" /> : <PackagePlus className="w-5 h-5 text-accent" />}
            </div>
            <div>
              <h3 className="font-bold text-lg text-text">
                {isEdit ? 'Chỉnh sửa nguyên liệu' : 'Thêm nguyên liệu mới'}
              </h3>
              <p className="text-xs text-muted">
                {isEdit ? `Mã nguyên liệu: #${initialData?.id}` : 'Nhập thông tin danh mục nguyên liệu kho'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted hover:text-text hover:bg-surface/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Note info */}
        <div className="p-3 rounded-lg bg-surface/50 border border-surface flex items-start gap-2.5 text-xs text-text">
          <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <span>
            <strong>Lưu ý:</strong> Tồn kho thực tế được quản lý tự động qua <em>Nhập hàng</em> và <em>Kiểm kê</em>. Định mức tồn tối thiểu dùng để gửi cảnh báo khi kho sắp hết.
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Tên nguyên liệu */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-xs font-semibold text-text flex items-center justify-between">
              <span>Tên nguyên liệu</span>
              <span className="text-[11px] font-normal text-status-cancelled">* Bắt buộc</span>
            </label>
            <Input
              id="name"
              placeholder="Ví dụ: Thịt bò Wagyu, Gạo ST25, Sữa chua..."
              error={Boolean(errors.name)}
              {...register('name')}
            />
            {errors.name && (
              <span className="text-xs text-status-cancelled flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.name.message}
              </span>
            )}
          </div>

          {/* Đơn vị tính */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="unit" className="text-xs font-semibold text-text flex items-center justify-between">
              <span>Đơn vị tính</span>
              <span className="text-[11px] font-normal text-status-cancelled">* Bắt buộc</span>
            </label>
            <Input
              id="unit"
              placeholder="Ví dụ: kg, g, lít, ml, quả, lon, gói..."
              error={Boolean(errors.unit)}
              {...register('unit')}
            />
            {errors.unit && (
              <span className="text-xs text-status-cancelled flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.unit.message}
              </span>
            )}
          </div>

          {/* Mức tồn tối thiểu */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="minimumStock" className="text-xs font-semibold text-text flex items-center justify-between">
              <span>Mức tồn tối thiểu (Cảnh báo tồn thấp)</span>
              <span className="text-[11px] font-normal text-muted">Tùy chọn</span>
            </label>
            <Input
              id="minimumStock"
              type="number"
              step="any"
              min="0"
              placeholder="Ví dụ: 5.0 (để trống nếu không cần)"
              error={Boolean(errors.minimumStock)}
              {...register('minimumStock')}
            />
            {errors.minimumStock && (
              <span className="text-xs text-status-cancelled flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.minimumStock.message}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border mt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
            >
              {isEdit ? 'Lưu thay đổi' : 'Thêm nguyên liệu'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
