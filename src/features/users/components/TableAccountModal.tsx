import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Tablet, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

import {
  tableAccountModalSchema,
  type TableAccountFormValues,
} from '@/features/users/schemas/userSchema'
import { userApi } from '@/features/users/api/userApi'
import type { UserItem, TableOption } from '@/features/users/types/user.types'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { getApiErrorMessage } from '@/shared/lib/axios'

interface TableAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userToEdit?: UserItem | null
}

export function TableAccountModal({
  isOpen,
  onClose,
  onSuccess,
  userToEdit,
}: TableAccountModalProps) {
  const isEditMode = !!userToEdit
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customError, setCustomError] = useState<string | null>(null)
  const [tables, setTables] = useState<TableOption[]>([])
  const [isLoadingTables, setIsLoadingTables] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TableAccountFormValues>({
    resolver: zodResolver(tableAccountModalSchema),
    defaultValues: {
      username: '',
      password: '',
      fullName: '',
      tableId: 0,
    },
  })

  const selectedTableId = watch('tableId')

  // Load active tables
  useEffect(() => {
    if (isOpen) {
      setIsLoadingTables(true)
      userApi
        .getTables()
        .then((data) => setTables(data))
        .catch((err) => {
          toast.error(getApiErrorMessage(err) || 'Không thể tải danh sách bàn ăn')
        })
        .finally(() => setIsLoadingTables(false))
    }
  }, [isOpen])

  // Reset form values on open/edit
  useEffect(() => {
    setCustomError(null)
    setShowPassword(false)
    if (userToEdit) {
      reset({
        username: userToEdit.username,
        password: '',
        fullName: userToEdit.fullName,
        tableId: userToEdit.tableId ? Number(userToEdit.tableId) : 0,
      })
    } else {
      reset({
        username: '',
        password: '',
        fullName: '',
        tableId: 0,
      })
    }
  }, [userToEdit, reset, isOpen])

  // Auto suggest Full Name and Username when table is selected (in create mode)
  useEffect(() => {
    if (!isEditMode && selectedTableId && tables.length > 0) {
      const matched = tables.find((t) => t.id === Number(selectedTableId))
      if (matched) {
        const cleanCode = matched.tableCode.replace(/\s+/g, '').toLowerCase()
        setValue('fullName', `Máy tính bảng ${matched.tableCode}`)
        const currentUsername = watch('username')
        if (!currentUsername || currentUsername.startsWith('tablet_')) {
          setValue('username', `tablet_${cleanCode}`)
        }
      }
    }
  }, [selectedTableId, tables, isEditMode, setValue, watch])

  if (!isOpen) return null

  const onSubmit = async (values: TableAccountFormValues) => {
    setCustomError(null)

    if (!isEditMode) {
      if (!values.username || values.username.trim().length < 3) {
        setCustomError('Tên đăng nhập phải có ít nhất 3 ký tự')
        return
      }
      if (!values.password || values.password.length < 6) {
        setCustomError('Mật khẩu phải có ít nhất 6 ký tự')
        return
      }
    }

    if (!values.tableId || values.tableId <= 0) {
      setCustomError('Vui lòng chọn một bàn ăn cho máy tính bảng')
      return
    }

    setIsSubmitting(true)
    try {
      if (isEditMode && userToEdit) {
        await userApi.updateUser(userToEdit.id, {
          fullName: values.fullName.trim(),
          role: 'TABLE_ACCOUNT',
          tableId: Number(values.tableId),
        })
        toast.success(`Cập nhật thông tin tài khoản bàn "${userToEdit.username}" thành công!`)
      } else {
        await userApi.createUser({
          username: (values.username || '').trim(),
          password: values.password || '',
          fullName: values.fullName.trim(),
          role: 'TABLE_ACCOUNT',
          tableId: Number(values.tableId),
        })
        toast.success(`Tạo mới tài khoản bàn "${values.username}" thành công!`)
      }
      onSuccess()
      onClose()
    } catch (err) {
      const message = getApiErrorMessage(err)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-accent/10 text-accent rounded-xl">
              <Tablet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-text">
                {isEditMode ? 'Chỉnh sửa tài khoản bàn (Tablet)' : 'Thêm tài khoản bàn (Tablet)'}
              </h3>
              <p className="text-xs text-muted">
                {isEditMode
                  ? `Cập nhật thông tin hoặc đổi mật khẩu cho @${userToEdit?.username}`
                  : 'Cấp tài khoản máy tính bảng đặt trực tiếp tại từng bàn ăn'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:text-text hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto space-y-4">
          {customError && (
            <div className="p-3 rounded-lg bg-status-cancelled/10 border border-status-cancelled/20 text-status-cancelled text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{customError}</span>
            </div>
          )}

          {/* Table selection */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Bàn ăn liên kết <span className="text-status-cancelled">*</span>
            </label>
            <div className="relative">
              <select
                {...register('tableId', { valueAsNumber: true })}
                disabled={isLoadingTables}
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-text shadow-xs focus:outline-hidden focus:ring-2 focus:ring-accent"
              >
                <option value={0}>-- Chọn bàn ăn cần cấp tài khoản --</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tableCode} ({t.area ? `Khu vực: ${t.area}` : 'Sảnh chính'} - {t.capacity} chỗ ngồi)
                  </option>
                ))}
              </select>
            </div>
            {errors.tableId && (
              <p className="mt-1 text-xs text-status-cancelled">{errors.tableId.message}</p>
            )}
            <span className="text-[11px] text-muted mt-1 block">
              Mỗi bàn ăn trong nhà hàng gắn với 1 tài khoản máy tính bảng duy nhất.
            </span>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Tên đăng nhập <span className="text-status-cancelled">*</span>
            </label>
            <Input
              {...register('username')}
              disabled={isEditMode}
              placeholder="VD: tablet_t01, tablet15"
              leftIcon={<Tablet className="w-4 h-4 text-muted" />}
              error={errors.username?.message}
            />
            {isEditMode && (
              <span className="text-[11px] text-muted mt-1 block">
                Tên đăng nhập là định danh cố định của thiết bị.
              </span>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Tên định danh thiết bị <span className="text-status-cancelled">*</span>
            </label>
            <Input
              {...register('fullName')}
              placeholder="VD: Máy tính bảng Bàn T01"
              error={errors.fullName?.message}
            />
          </div>

          {/* Password (only in create mode) */}
          {!isEditMode && (
            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Mật khẩu khởi tạo <span className="text-status-cancelled">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="Tối thiểu 6 ký tự"
                  leftIcon={<Lock className="w-4 h-4 text-muted" />}
                  error={errors.password?.message}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted hover:text-text transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : isEditMode ? (
                'Lưu thay đổi'
              ) : (
                'Tạo tài khoản bàn'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
