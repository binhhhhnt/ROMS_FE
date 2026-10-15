import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import type { ApiErrorResponse } from '@/shared/types/api.types'
import { menuItemSchema, type MenuItemFormValues } from '../schemas/menuItemSchema'
import { useMenuCategoryOptions } from '../hooks/useMenu'
import { getMenuErrorMessage, menuControlClass } from '../utils/menu'
import type { MenuItemReadResponse, MenuItemWriteRequest } from '../types/menu.types'

export function MenuItemForm({ item, onSave }: {
  item?: MenuItemReadResponse
  onSave: (values: MenuItemWriteRequest) => Promise<void>
}) {
  const categories = useMenuCategoryOptions()
  const saving = useRef(false)
  const [pending, setPending] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: item?.name ?? '',
      categoryId: item?.category.id,
      description: item?.description ?? '',
      price: item ? String(item.price) : '',
      isFeatured: item?.isFeatured ?? false,
    },
  })
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
          for (const field of ['name', 'categoryId', 'description', 'price', 'isFeatured'] as const) {
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
    <form onSubmit={(event) => { void handleSubmit(submit)(event) }} noValidate className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6" aria-busy={isSubmitting || pending}>
      <h2 className="text-lg font-bold text-primary">Thông tin món ăn</h2>
      <fieldset disabled={isSubmitting || pending} className="mt-5 grid min-w-0 gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="menu-item-name" className="mb-2 block text-sm font-semibold">Tên món <span className="text-status-cancelled">*</span></label>
          <Input id="menu-item-name" maxLength={255} aria-required="true" aria-invalid={!!errors.name} aria-describedby="menu-item-name-error" {...register('name')} />
          <p id="menu-item-name-error" className="mt-1 text-sm text-status-cancelled">{errors.name?.message}</p>
        </div>
        <div>
          <label htmlFor="menu-item-category" className="mb-2 block text-sm font-semibold">Danh mục <span className="text-status-cancelled">*</span></label>
          <select id="menu-item-category" className={menuControlClass} disabled={categories.isPending || categories.isError}
            aria-required="true" aria-invalid={!!errors.categoryId} aria-describedby="menu-item-category-error" {...register('categoryId', { valueAsNumber: true })}>
            <option value="">Chọn danh mục</option>
            {categories.data?.map((category) => <option key={category.id} value={category.id}>{category.name}{category.isActive ? '' : ' (ngừng hoạt động)'}</option>)}
          </select>
          <p id="menu-item-category-error" className="mt-1 text-sm text-status-cancelled">{errors.categoryId?.message}</p>
          {categories.isPending && <p role="status" className="mt-2 text-sm text-muted">Đang tải danh mục...</p>}
          {categories.isError && <div role="alert" className="mt-2 text-sm text-status-cancelled">Không thể tải danh mục. <button type="button" className="underline" onClick={() => void categories.refetch()}>Thử lại</button></div>}
          {categories.isSuccess && categories.data.length === 0 && <p className="mt-2 text-sm text-muted">Chưa có danh mục. Vui lòng tạo danh mục trước.</p>}
        </div>
        <div>
          <label htmlFor="menu-item-price" className="mb-2 block text-sm font-semibold">Giá (VND) <span className="text-status-cancelled">*</span></label>
          <Input id="menu-item-price" inputMode="decimal" placeholder="Ví dụ: 65000" aria-required="true" aria-invalid={!!errors.price} aria-describedby="menu-item-price-error" {...register('price')} />
          <p id="menu-item-price-error" className="mt-1 text-sm text-status-cancelled">{errors.price?.message}</p>
          <p className="mt-1 text-xs text-muted">Không nhập dấu phân cách hàng nghìn; dùng dấu chấm cho phần thập phân.</p>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="menu-item-description" className="mb-2 block text-sm font-semibold">Mô tả</label>
          <textarea id="menu-item-description" rows={4} className={menuControlClass} aria-invalid={!!errors.description} aria-describedby="menu-item-description-error" {...register('description')} />
          <p id="menu-item-description-error" className="mt-1 text-sm text-status-cancelled">{errors.description?.message}</p>
        </div>
        <div className="md:col-span-2">
          <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-primary" {...register('isFeatured')} />Món nổi bật</label>
          <p className="mt-2 text-xs text-muted">Đánh dấu món để giới thiệu trên thực đơn tablet.</p>
          {errors.isFeatured && <p className="text-sm text-status-cancelled">{errors.isFeatured.message}</p>}
        </div>
      </fieldset>
      {submitError && <p role="alert" className="mt-5 rounded-lg bg-status-cancelled/5 p-3 text-sm text-status-cancelled">{submitError}</p>}
      <div className="mt-6 flex justify-end border-t border-border pt-5">
        <Button type="submit" isLoading={isSubmitting || pending} disabled={!categories.isSuccess || categories.data.length === 0}>{item ? 'Lưu thông tin' : 'Tạo món và tiếp tục'}</Button>
      </div>
    </form>
  )
}
