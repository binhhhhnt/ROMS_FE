import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import type { ApiErrorResponse } from '@/shared/types/api.types'
import { menuItemSchema, type MenuItemFormValues } from '../schemas/menuItemSchema'
import { useMenuCategoryOptions } from '../hooks/useMenu'
import { getMenuErrorMessage, menuControlClass } from '../utils/menu'
import { settingsApi } from '@/features/settings/api/settingsApi'
import type { MenuItemReadResponse, MenuItemWriteRequest } from '../types/menu.types'
import { CatalogDeleteButton } from './CatalogDeleteButton'

export function MenuItemForm({ item, onSave, onDeleted }: {
  item?: MenuItemReadResponse
  onSave: (values: MenuItemWriteRequest) => Promise<void>
  onDeleted?: () => void
}) {
  const categories = useMenuCategoryOptions()
  const saving = useRef(false)
  const [pending, setPending] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Query available tax categories
  const { data: taxCategories = [], isLoading: isLoadingTax } = useQuery({
    queryKey: ['tax-categories'],
    queryFn: () => settingsApi.getTaxCategories(),
  })

  const itemTaxId = item?.taxCategoryId ?? item?.tax_category_id
  const itemTaxRate = item?.taxRate ?? item?.tax_rate

  const { register, handleSubmit, setValue, watch, setError, formState: { errors, isSubmitting } } = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: item?.name ?? '',
      categoryId: item?.category.id,
      taxCategoryId: itemTaxId,
      description: item?.description ?? '',
      price: item ? String(item.price) : '',
      isFeatured: item?.isFeatured ?? false,
      isDirectSale: item?.isDirectSale ?? item?.is_direct_sale ?? false,
      status: item?.status ?? 'DISCONTINUED',
    },
  })

  const selectedTaxCategoryId = watch('taxCategoryId')

  // Synchronize taxCategoryId when tax categories load or when item changes
  const taxSyncedRef = useRef(false)
  useEffect(() => {
    if (taxCategories.length === 0 || taxSyncedRef.current) return

    if (itemTaxId && taxCategories.some((t) => t.id === itemTaxId)) {
      setValue('taxCategoryId', itemTaxId)
      taxSyncedRef.current = true
    } else if (itemTaxRate !== undefined && itemTaxRate !== null) {
      const matchByRate = taxCategories.find((t) => Number(t.rate) === Number(itemTaxRate))
      if (matchByRate) {
        setValue('taxCategoryId', matchByRate.id)
        taxSyncedRef.current = true
      }
    } else {
      // Default to 8% (or first available rate) for items without tax category
      const defaultTax = taxCategories.find((t) => Number(t.rate) === 8) ?? taxCategories[0]
      if (defaultTax) {
        setValue('taxCategoryId', defaultTax.id)
        taxSyncedRef.current = true
      }
    }
  }, [taxCategories, itemTaxId, itemTaxRate, setValue])

  const submit = async (values: MenuItemFormValues) => {
    if (saving.current) return
    saving.current = true
    setPending(true)
    setSubmitError(null)
    try {
      await onSave({ ...values, price: Number(values.price) })
    } catch (error) {
      setSubmitError(getMenuErrorMessage(error))
      if (axios.isAxiosError<ApiErrorResponse>(error) && error.response?.status === 400) {
        const details = error.response.data.error?.details
        if (details && typeof details === 'object') {
          for (const field of ['name', 'categoryId', 'taxCategoryId', 'description', 'price', 'isFeatured'] as const) {
            if (Object.hasOwn(details, field)) setError(field, { type: 'server', message: 'Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.' })
          }
        }
      }
    } finally {
      saving.current = false
      setPending(false)
    }
  }

  return (
    <form onSubmit={(event) => {
      if (deleting) { event.preventDefault(); return }
      void handleSubmit(submit)(event)
    }} noValidate className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6" aria-busy={isSubmitting || pending || deleting}>
      <h2 className="text-lg font-bold text-primary">Thông tin món ăn</h2>
      <fieldset disabled={isSubmitting || pending || deleting} className="mt-5 grid min-w-0 gap-5 md:grid-cols-2">
        {/* Name */}
        <div className="md:col-span-2">
          <label htmlFor="menu-item-name" className="mb-2 block text-sm font-semibold">Tên món <span className="text-status-cancelled">*</span></label>
          <Input id="menu-item-name" maxLength={255} aria-required="true" aria-invalid={!!errors.name} aria-describedby="menu-item-name-error" {...register('name')} />
          <p id="menu-item-name-error" className="mt-1 text-sm text-status-cancelled">{errors.name?.message}</p>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="menu-item-category" className="mb-2 block text-sm font-semibold">Danh mục <span className="text-status-cancelled">*</span></label>
          <select id="menu-item-category" className={menuControlClass} disabled={categories.isPending || categories.isError}
            aria-required="true" aria-invalid={!!errors.categoryId} aria-describedby="menu-item-category-error" {...register('categoryId', { valueAsNumber: true })}>
            <option value="">Chọn danh mục</option>
            {categories.data?.map((category) => <option key={category.id} value={category.id}>{category.name}{category.isActive ? '' : ' (tạm ngưng phục vụ)'}</option>)}
          </select>
          <p id="menu-item-category-error" className="mt-1 text-sm text-status-cancelled">{errors.categoryId?.message}</p>
          {categories.isPending && <p role="status" className="mt-2 text-sm text-muted">Đang tải danh mục...</p>}
          {categories.isError && <div role="alert" className="mt-2 text-sm text-status-cancelled">Không thể tải danh mục. <button type="button" className="underline" onClick={() => void categories.refetch()}>Thử lại</button></div>}
          {categories.isSuccess && categories.data.length === 0 && <p className="mt-2 text-sm text-muted">Chưa có danh mục. Vui lòng tạo danh mục trước.</p>}
        </div>

        {/* Tax Category */}
        <div>
          <label htmlFor="menu-item-tax" className="mb-2 block text-sm font-semibold">
            Thuế suất VAT (%) <span className="text-status-cancelled">*</span>
          </label>
          <select
            id="menu-item-tax"
            className={menuControlClass}
            disabled={isLoadingTax}
            aria-required="true"
            aria-invalid={!!errors.taxCategoryId}
            aria-describedby="menu-item-tax-error"
            value={selectedTaxCategoryId ?? ''}
            {...register('taxCategoryId', { valueAsNumber: true })}
          >
            <option value="">Chọn mức thuế</option>
            {taxCategories.map((tax) => (
              <option key={tax.id} value={tax.id}>
                {tax.rate}% {Number(tax.rate) === 8 ? '(Mặc định F&B)' : Number(tax.rate) === 0 ? '(Miễn thuế)' : ''}
              </option>
            ))}
          </select>
          <p id="menu-item-tax-error" className="mt-1 text-sm text-status-cancelled">{errors.taxCategoryId?.message}</p>
          {isLoadingTax && <p role="status" className="mt-2 text-sm text-muted">Đang tải mức thuế...</p>}
        </div>

        {/* Price */}
        <div>
          <label htmlFor="menu-item-price" className="mb-2 block text-sm font-semibold">Giá (VND) <span className="text-status-cancelled">*</span></label>
          <Input id="menu-item-price" inputMode="decimal" placeholder="Ví dụ: 65000" aria-required="true" aria-invalid={!!errors.price} aria-describedby="menu-item-price-error" {...register('price')} />
          <p id="menu-item-price-error" className="mt-1 text-sm text-status-cancelled">{errors.price?.message}</p>
          <p className="mt-1 text-xs text-muted">Không nhập dấu phân cách hàng nghìn; dùng dấu chấm cho phần thập phân.</p>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="menu-item-status" className="mb-2 block text-sm font-semibold">Trạng thái kinh doanh</label>
          <select id="menu-item-status" className={menuControlClass} {...register('status')}>
            <option value="DISCONTINUED">Ngừng kinh doanh (Mặc định - Chưa lên menu)</option>
            <option value="AVAILABLE">Đang kinh doanh (Mở bán ngay)</option>
            <option value="TEMPORARILY_UNAVAILABLE">Tạm ngưng phục vụ</option>
          </select>
          <p className="mt-1 text-xs text-muted">
            {item ? 'Cập nhật trạng thái mở bán của món.' : 'Mặc định là "Ngừng kinh doanh" để món chưa hiện lên menu cho đến khi sẵn sàng.'}
          </p>
        </div>

        {/* Featured */}
        <div className="flex flex-col justify-center">
          <label className="flex items-center gap-3 text-sm font-semibold mt-2 cursor-pointer">
            <input type="checkbox" className="h-4 w-4 accent-primary" {...register('isFeatured')} />
            Món nổi bật
          </label>
          <p className="mt-1 text-xs text-muted">Đánh dấu món để giới thiệu trên thực đơn tablet.</p>
          {errors.isFeatured && <p className="text-sm text-status-cancelled">{errors.isFeatured.message}</p>}
        </div>

        {/* Direct Sale */}
        <div className="flex flex-col justify-center">
          <label className="flex items-center gap-3 text-sm font-semibold mt-2 cursor-pointer">
            <input type="checkbox" className="h-4 w-4 accent-primary" {...register('isDirectSale')} />
            Hàng bán trực tiếp
          </label>
          <p className="mt-1 text-xs text-muted">Hàng hóa lon/chai (bia, rượu, nước ngọt) cho phép kiểm đồ trả kho khi dùng thừa.</p>
          {errors.isDirectSale && <p className="text-sm text-status-cancelled">{errors.isDirectSale.message}</p>}
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label htmlFor="menu-item-description" className="mb-2 block text-sm font-semibold">Mô tả</label>
          <textarea id="menu-item-description" rows={4} className={menuControlClass} aria-invalid={!!errors.description} aria-describedby="menu-item-description-error" {...register('description')} />
          <p id="menu-item-description-error" className="mt-1 text-sm text-status-cancelled">{errors.description?.message}</p>
        </div>
      </fieldset>
      {submitError && <p role="alert" className="mt-5 rounded-lg bg-status-cancelled/5 p-3 text-sm text-status-cancelled">{submitError}</p>}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        {item && <CatalogDeleteButton kind="dish" id={item.id} name={item.name} label="Xóa món ăn" disabled={isSubmitting || pending || deleting} onBusyChange={setDeleting} onDeleted={onDeleted} />}
        <Button className="ml-auto" type="submit" isLoading={isSubmitting || pending} disabled={deleting || !categories.isSuccess || categories.data.length === 0}>{item ? 'Lưu thông tin' : 'Tạo món và tiếp tục'}</Button>
      </div>
    </form>
  )
}
