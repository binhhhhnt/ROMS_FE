import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Save, Layers, Users, MapPin } from 'lucide-react'
import { toast } from 'sonner'

import { tableSchema, type TableFormValues } from '@/features/tables/schemas/tableSchema'
import { tableApi } from '@/features/tables/api/tableApi'
import type { TableItem } from '@/features/tables/types/table.types'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

interface TableModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  tableToEdit?: TableItem | null
  existingAreas?: string[]
}

export function TableModal({
  isOpen,
  onClose,
  onSuccess,
  tableToEdit,
  existingAreas = [],
}: TableModalProps) {
  const isEditMode = !!tableToEdit
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TableFormValues>({
    resolver: zodResolver(tableSchema),
    defaultValues: {
      tableCode: '',
      capacity: 4,
      area: '',
    },
  })

  useEffect(() => {
    if (tableToEdit) {
      reset({
        tableCode: tableToEdit.tableCode,
        capacity: tableToEdit.capacity,
        area: tableToEdit.area || '',
      })
    } else {
      reset({
        tableCode: '',
        capacity: 4,
        area: '',
      })
    }
  }, [tableToEdit, reset, isOpen])

  if (!isOpen) return null

  const onSubmit = async (values: TableFormValues) => {
    setIsSubmitting(true)
    try {
      if (isEditMode && tableToEdit) {
        await tableApi.updateTable(tableToEdit.id, {
          tableCode: values.tableCode.trim().toUpperCase(),
          capacity: Number(values.capacity),
          area: values.area?.trim() || null,
        })
        toast.success(`Cập nhật thông tin bàn ${values.tableCode} thành công!`)
      } else {
        await tableApi.createTable({
          tableCode: values.tableCode.trim().toUpperCase(),
          capacity: Number(values.capacity),
          area: values.area?.trim() || null,
        })
        toast.success(`Thêm bàn mới ${values.tableCode} thành công!`)
      }
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50 duration-200">
      <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text">
                {isEditMode ? `Chỉnh sửa bàn: ${tableToEdit.tableCode}` : 'Thêm bàn ăn mới'}
              </h2>
              <span className="text-[11px] text-muted">
                {isEditMode ? 'Cập nhật mã bàn, sức chứa và khu vực' : 'Khai báo thông số bàn mới trong nhà hàng'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted hover:text-text hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-4 text-left">
          {/* Table Code */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tableCode" className="text-xs font-semibold text-text flex justify-between">
              <span>Mã số bàn</span>
              <span className="text-[11px] font-normal text-muted">Ví dụ: T01, VIP-1</span>
            </label>
            <Input
              id="tableCode"
              placeholder="Nhập mã bàn..."
              leftIcon={<Layers className="w-4 h-4 text-muted" />}
              className="uppercase font-semibold tracking-wider"
              error={!!errors.tableCode}
              {...register('tableCode')}
            />
            {errors.tableCode && (
              <span className="text-xs text-status-cancelled">{errors.tableCode.message}</span>
            )}
          </div>

          {/* Capacity */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="capacity" className="text-xs font-semibold text-text flex justify-between">
              <span>Sức chứa tối đa (Khách)</span>
              <span className="text-[11px] font-normal text-muted">1 - 50 người</span>
            </label>
            <Input
              id="capacity"
              type="number"
              min={1}
              max={50}
              placeholder="Số ghế ngồi..."
              leftIcon={<Users className="w-4 h-4 text-muted" />}
              error={!!errors.capacity}
              {...register('capacity', { valueAsNumber: true })}
            />
            {errors.capacity && (
              <span className="text-xs text-status-cancelled">{errors.capacity.message}</span>
            )}
          </div>

          {/* Area */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="area" className="text-xs font-semibold text-text flex justify-between">
              <span>Khu vực (Area)</span>
              <span className="text-[11px] font-normal text-muted">Tùy chọn</span>
            </label>
            <Input
              id="area"
              list="existing-areas-list"
              placeholder="ví dụ: Tầng 1, Sân vườn, Phòng VIP..."
              leftIcon={<MapPin className="w-4 h-4 text-muted" />}
              error={!!errors.area}
              {...register('area')}
            />
            <datalist id="existing-areas-list">
              {existingAreas.map((area) => (
                <option key={area} value={area} />
              ))}
            </datalist>
            {errors.area && (
              <span className="text-xs text-status-cancelled">{errors.area.message}</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Hủy bỏ
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              <Save className="w-4 h-4 mr-1.5" />
              {isEditMode ? 'Lưu thay đổi' : 'Thêm bàn'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
