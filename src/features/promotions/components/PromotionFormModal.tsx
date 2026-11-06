import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Tag, Calendar, Percent, Banknote, Hash } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  promotionFormSchema,
  type PromotionFormValues,
} from '@/features/promotions/schemas/promotionSchema'
import type { PromotionResponse } from '@/features/promotions/types/promotion.types'

interface PromotionFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (values: PromotionFormValues) => Promise<void>
  promotion?: PromotionResponse | null
  isLoading?: boolean
}

export function PromotionFormModal({
  isOpen,
  onClose,
  onSubmit,
  promotion,
  isLoading = false,
}: PromotionFormModalProps) {
  const isEditing = Boolean(promotion)

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionFormSchema),
    defaultValues: {
      name: '',
      code: '',
      discountType: 'PERCENT',
      discountValue: 10,
      maxUses: null,
      startDate: null,
      endDate: null,
      isActive: true,
    },
  })

  const discountType = watch('discountType')

  useEffect(() => {
    if (isOpen) {
      if (promotion) {
        reset({
          name: promotion.name,
          code: promotion.code,
          discountType: promotion.discountType,
          discountValue: promotion.discountValue,
          maxUses: promotion.maxUses,
          startDate: promotion.startDate || null,
          endDate: promotion.endDate || null,
          isActive: promotion.isActive,
        })
      } else {
        reset({
          name: '',
          code: '',
          discountType: 'PERCENT',
          discountValue: 10,
          maxUses: null,
          startDate: null,
          endDate: null,
          isActive: true,
        })
      }
    }
  }, [isOpen, promotion, reset])

  if (!isOpen) return null

  const handleFormSubmit = async (data: PromotionFormValues) => {
    await onSubmit({
      ...data,
      code: data.code.trim().toUpperCase(),
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      maxUses: data.maxUses ? Number(data.maxUses) : null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-accent/10 text-accent">
              <Tag className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text">
                {isEditing ? 'Chỉnh sửa Khuyến mãi' : 'Tạo Mã Khuyến Mãi Mới'}
              </h2>
              <p className="text-xs text-text-secondary">
                {isEditing
                  ? `Cập nhật thông tin cho mã ${promotion?.code}`
                  : 'Thiết lập mã giảm giá và thể lệ áp dụng'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-secondary hover:text-text hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Tên chương trình */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Tên chương trình <span className="text-error">*</span>
            </label>
            <Input
              {...register('name')}
              placeholder="VD: Tri ân khách hàng thân thiết"
              className={errors.name ? 'border-error focus-visible:ring-error' : ''}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-error font-medium">{errors.name.message}</p>
            )}
          </div>

          {/* Mã khuyến mãi */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Mã khuyến mãi <span className="text-error">*</span>
            </label>
            <div className="relative">
              <Input
                {...register('code')}
                onChange={(e) => setValue('code', e.target.value.toUpperCase())}
                placeholder="VD: VIP10, GIAM50K"
                className={`uppercase font-mono font-bold tracking-wider ${
                  errors.code ? 'border-error focus-visible:ring-error' : ''
                }`}
              />
            </div>
            {errors.code && (
              <p className="mt-1 text-xs text-error font-medium">{errors.code.message}</p>
            )}
            <p className="mt-1 text-[11px] text-text-secondary">
              Mã chỉ bao gồm chữ, số, gạch nối (-) hoặc gạch dưới (_). Tự động viết hoa.
            </p>
          </div>

          {/* Loại giảm giá */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Hình thức giảm giá <span className="text-error">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                  discountType === 'PERCENT'
                    ? 'border-accent bg-accent/5 ring-1 ring-accent'
                    : 'border-border bg-surface/30 hover:bg-surface/70'
                }`}
              >
                <input
                  type="radio"
                  value="PERCENT"
                  {...register('discountType')}
                  className="sr-only"
                />
                <div
                  className={`p-1.5 rounded-md ${
                    discountType === 'PERCENT'
                      ? 'bg-accent text-white'
                      : 'bg-surface text-text-secondary'
                  }`}
                >
                  <Percent className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-text">Theo phần trăm</div>
                  <div className="text-[11px] text-text-secondary">Tối đa 100%</div>
                </div>
              </label>

              <label
                className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                  discountType === 'FIXED_AMOUNT'
                    ? 'border-accent bg-accent/5 ring-1 ring-accent'
                    : 'border-border bg-surface/30 hover:bg-surface/70'
                }`}
              >
                <input
                  type="radio"
                  value="FIXED_AMOUNT"
                  {...register('discountType')}
                  className="sr-only"
                />
                <div
                  className={`p-1.5 rounded-md ${
                    discountType === 'FIXED_AMOUNT'
                      ? 'bg-accent text-white'
                      : 'bg-surface text-text-secondary'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-text">Số tiền cố định</div>
                  <div className="text-[11px] text-text-secondary">Giảm trực tiếp VNĐ</div>
                </div>
              </label>
            </div>
          </div>

          {/* Giá trị giảm & Giới hạn số lượt */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Giá trị giảm <span className="text-error">*</span>
              </label>
              <div className="relative">
                <Input
                  type="number"
                  step="any"
                  {...register('discountValue', { valueAsNumber: true })}
                  placeholder={discountType === 'PERCENT' ? '10' : '50000'}
                  className={errors.discountValue ? 'border-error focus-visible:ring-error pr-12' : 'pr-12'}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-secondary">
                  {discountType === 'PERCENT' ? '%' : 'VNĐ'}
                </span>
              </div>
              {errors.discountValue && (
                <p className="mt-1 text-xs text-error font-medium">{errors.discountValue.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Số lượt dùng tối đa
              </label>
              <div className="relative">
                <Input
                  type="number"
                  {...register('maxUses', {
                    setValueAs: (v) => (v === '' || v === null || isNaN(v) ? null : Number(v)),
                  })}
                  placeholder="Không giới hạn"
                  className={errors.maxUses ? 'border-error focus-visible:ring-error pr-8' : 'pr-8'}
                />
                <Hash className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              </div>
              {errors.maxUses && (
                <p className="mt-1 text-xs text-error font-medium">{errors.maxUses.message}</p>
              )}
              <p className="mt-1 text-[11px] text-text-secondary">Để trống = Vô hạn lượt dùng</p>
            </div>
          </div>

          {/* Thời gian hiệu lực: Bắt đầu & Kết thúc */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-sm font-medium text-text mb-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-accent" />
                Ngày bắt đầu
              </label>
              <Input
                type="date"
                {...register('startDate', {
                  setValueAs: (v) => (v ? v : null),
                })}
              />
              <p className="mt-1 text-[11px] text-text-secondary">Để trống = Áp dụng ngay</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-accent" />
                Ngày kết thúc
              </label>
              <Input
                type="date"
                {...register('endDate', {
                  setValueAs: (v) => (v ? v : null),
                })}
                className={errors.endDate ? 'border-error focus-visible:ring-error' : ''}
              />
              {errors.endDate && (
                <p className="mt-1 text-xs text-error font-medium">{errors.endDate.message}</p>
              )}
              <p className="mt-1 text-[11px] text-text-secondary">Để trống = Vô thời hạn</p>
            </div>
          </div>

          {/* Kích hoạt trạng thái */}
          <div className="pt-2 border-t border-border">
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent"
                  />
                  <div>
                    <span className="text-sm font-medium text-text">Kích hoạt chương trình</span>
                    <p className="text-xs text-text-secondary">
                      Cho phép thu ngân áp dụng mã này khi tính tiền
                    </p>
                  </div>
                </label>
              )}
            />
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Hủy bỏ
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary-hover text-white">
              {isLoading ? (
                'Đang lưu...'
              ) : isEditing ? (
                'Cập nhật khuyến mãi'
              ) : (
                'Tạo khuyến mãi'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
