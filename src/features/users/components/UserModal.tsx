import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { X, User, Lock, Mail, Shield, Smartphone, Save, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

import {
  userModalSchema,
  type UserModalFormValues,
} from '@/features/users/schemas/userSchema'
import { userApi } from '@/features/users/api/userApi'
import { getApiErrorMessage } from '@/shared/lib/axios'
import type { UserItem } from '@/features/users/types/user.types'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userToEdit?: UserItem | null
}

export function UserModal({ isOpen, onClose, onSuccess, userToEdit }: UserModalProps) {
  const isEditMode = !!userToEdit
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [customError, setCustomError] = useState<string | null>(null)

  // Load active tables for TABLE_ACCOUNT selection
  const { data: tables = [] } = useQuery({
    queryKey: ['activeTablesForUserSelect'],
    queryFn: () => userApi.getTables(),
    enabled: isOpen,
  })

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UserModalFormValues>({
    resolver: zodResolver(userModalSchema),
    defaultValues: {
      username: '',
      password: '',
      fullName: '',
      email: '',
      role: 'SERVICE_STAFF',
      tableId: null,
    },
  })

  const selectedRole = watch('role')

  useEffect(() => {
    setCustomError(null)
    if (userToEdit) {
      reset({
        username: userToEdit.username,
        password: '',
        fullName: userToEdit.fullName,
        email: userToEdit.email || '',
        role: userToEdit.role,
        tableId: userToEdit.tableId ?? null,
      })
    } else {
      reset({
        username: '',
        password: '',
        fullName: '',
        email: '',
        role: 'SERVICE_STAFF',
        tableId: null,
      })
    }
  }, [userToEdit, reset, isOpen])

  // Clear tableId if role is not TABLE_ACCOUNT
  useEffect(() => {
    if (selectedRole !== 'TABLE_ACCOUNT') {
      setValue('tableId', null)
    }
  }, [selectedRole, setValue])

  if (!isOpen) return null

  const onSubmit = async (values: UserModalFormValues) => {
    setCustomError(null)

    // Manual validation for create mode
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

    if (values.role === 'TABLE_ACCOUNT' && (!values.tableId || values.tableId <= 0)) {
      setCustomError('Tài khoản Tablet bắt buộc phải liên kết với một bàn ăn')
      return
    }

    setIsSubmitting(true)
    try {
      if (isEditMode && userToEdit) {
        await userApi.updateUser(userToEdit.id, {
          fullName: values.fullName.trim(),
          email: values.email?.trim() || undefined,
          role: values.role,
          tableId: values.role === 'TABLE_ACCOUNT' && values.tableId ? Number(values.tableId) : null,
        })
        toast.success(`Cập nhật tài khoản "${userToEdit.username}" thành công!`)
      } else {
        await userApi.createUser({
          username: (values.username || '').trim(),
          password: values.password || '',
          fullName: values.fullName.trim(),
          email: values.email?.trim() || undefined,
          role: values.role,
          tableId: values.role === 'TABLE_ACCOUNT' && values.tableId ? Number(values.tableId) : null,
        })
        toast.success(`Tạo mới tài khoản "${values.username}" thành công!`)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50 duration-200">
      <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text">
                {isEditMode ? `Chỉnh sửa tài khoản: ${userToEdit.username}` : 'Thêm tài khoản mới'}
              </h2>
              <span className="text-[11px] text-muted">
                {isEditMode
                  ? 'Cập nhật thông tin phân quyền và định danh'
                  : 'Tạo thông tin đăng nhập và phân quyền nhân viên / tablet'}
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto flex flex-col gap-4 text-left">
          {customError && (
            <div className="p-3 bg-status-cancelled/10 border border-status-cancelled/20 text-status-cancelled rounded-lg text-xs">
              {customError}
            </div>
          )}

          {/* Username (Only when Creating) */}
          {!isEditMode && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-xs font-semibold text-text flex justify-between">
                <span>Tên đăng nhập (Username)</span>
                <span className="text-[11px] font-normal text-muted">Bắt buộc</span>
              </label>
              <Input
                id="username"
                autoComplete="off"
                placeholder="ví dụ: service_hoa, table_t01"
                leftIcon={<User className="w-4 h-4 text-muted" />}
                error={!!errors.username}
                {...register('username')}
              />
              {errors.username && (
                <span className="text-xs text-status-cancelled">{errors.username.message}</span>
              )}
            </div>
          )}

          {/* Password (Only when Creating) */}
          {!isEditMode && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-text flex justify-between">
                <span>Mật khẩu ban đầu</span>
                <span className="text-[11px] font-normal text-muted">Tối thiểu 6 ký tự</span>
              </label>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Nhập mật khẩu cấp cho nhân viên"
                leftIcon={<Lock className="w-4 h-4 text-muted" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted hover:text-text transition-colors p-1"
                    aria-label={showPassword ? 'Ẩn' : 'Hiện'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                error={!!errors.password}
                {...register('password')}
              />
              {errors.password && (
                <span className="text-xs text-status-cancelled">{errors.password.message}</span>
              )}
            </div>
          )}

          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fullName" className="text-xs font-semibold text-text flex justify-between">
              <span>Họ và tên hiển thị</span>
              <span className="text-[11px] font-normal text-muted">Bắt buộc</span>
            </label>
            <Input
              id="fullName"
              placeholder="ví dụ: Nguyễn Văn An hoặc Tablet Bàn 01"
              leftIcon={<User className="w-4 h-4 text-muted" />}
              error={!!errors.fullName}
              {...register('fullName')}
            />
            {errors.fullName && (
              <span className="text-xs text-status-cancelled">{errors.fullName.message}</span>
            )}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-semibold text-text flex justify-between">
              <span>Địa chỉ Email</span>
              <span className="text-[11px] font-normal text-muted">Tùy chọn (nhận OTP)</span>
            </label>
            <Input
              id="email"
              type="email"
              placeholder="ví dụ: staff@roms.vn"
              leftIcon={<Mail className="w-4 h-4 text-muted" />}
              error={!!errors.email}
              {...register('email')}
            />
            {errors.email && (
              <span className="text-xs text-status-cancelled">{errors.email.message}</span>
            )}
          </div>

          {/* Role Selection */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="role" className="text-xs font-semibold text-text">
              Vai trò (Role)
            </label>
            <select
              id="role"
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-text shadow-xs focus:outline-hidden focus:ring-2 focus:ring-accent"
              {...register('role')}
            >
              <option value="SERVICE_STAFF">SERVICE_STAFF (Nhân viên phục vụ bàn)</option>
              <option value="KITCHEN_STAFF">KITCHEN_STAFF (Nhân viên bếp / KDS)</option>
              <option value="INVENTORY_STAFF">INVENTORY_STAFF (Nhân viên quản lý kho)</option>
              <option value="TABLE_ACCOUNT">TABLE_ACCOUNT (Thiết bị Tablet tại bàn)</option>
              <option value="OWNER">OWNER (Quản trị viên / Chủ nhà hàng)</option>
            </select>
          </div>

          {/* Linked Table (Required if TABLE_ACCOUNT) */}
          {selectedRole === 'TABLE_ACCOUNT' && (
            <div className="flex flex-col gap-1.5 p-3.5 bg-surface/40 border border-accent/30 rounded-xl animate-in fade-in-50 duration-200">
              <label htmlFor="tableId" className="text-xs font-semibold text-accent flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Liên kết Bàn ăn (Bắt buộc cho Tablet)</span>
              </label>
              <select
                {...register('tableId', {
                  setValueAs: (v) => (v === '' || isNaN(Number(v)) ? null : Number(v)),
                })}
              >
                <option value="">-- Chọn bàn ăn gán với thiết bị này --</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    Bàn {t.tableCode} (Sức chứa: {t.capacity} khách {t.area ? `- Khu ${t.area}` : ''})
                  </option>
                ))}
              </select>
              {errors.tableId && (
                <span className="text-xs text-status-cancelled">{errors.tableId.message}</span>
              )}
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Hủy bỏ
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              <Save className="w-4 h-4 mr-1.5" />
              {isEditMode ? 'Lưu thay đổi' : 'Tạo tài khoản'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
