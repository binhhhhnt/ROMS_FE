import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, User, Mail, Shield, Lock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

import {
  staffUserModalSchema,
  type StaffUserFormValues,
} from '@/features/users/schemas/userSchema'
import { userApi } from '@/features/users/api/userApi'
import type { UserItem } from '@/features/users/types/user.types'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { getApiErrorMessage } from '@/shared/lib/axios'

interface StaffUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userToEdit?: UserItem | null
}

export function StaffUserModal({
  isOpen,
  onClose,
  onSuccess,
  userToEdit,
}: StaffUserModalProps) {
  const isEditMode = !!userToEdit
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customError, setCustomError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StaffUserFormValues>({
    resolver: zodResolver(staffUserModalSchema),
    defaultValues: {
      username: '',
      password: '',
      fullName: '',
      email: '',
      role: 'SERVICE_STAFF',
    },
  })

  useEffect(() => {
    setCustomError(null)
    if (userToEdit) {
      reset({
        username: userToEdit.username,
        password: '',
        fullName: userToEdit.fullName,
        email: userToEdit.email || '',
        role: userToEdit.role === 'TABLE_ACCOUNT' ? 'SERVICE_STAFF' : userToEdit.role,
      })
    } else {
      reset({
        username: '',
        password: '',
        fullName: '',
        email: '',
        role: 'SERVICE_STAFF',
      })
    }
  }, [userToEdit, reset, isOpen])

  if (!isOpen) return null

  const onSubmit = async (values: StaffUserFormValues) => {
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

    setIsSubmitting(true)
    try {
      if (isEditMode && userToEdit) {
        await userApi.updateUser(userToEdit.id, {
          fullName: values.fullName.trim(),
          email: values.email.trim(),
          role: values.role,
          tableId: null, // Không gắn bàn cho tài khoản người dùng
        })
        toast.success(`Cập nhật thông tin nhân viên "${userToEdit.username}" thành công!`)
      } else {
        await userApi.createUser({
          username: (values.username || '').trim(),
          password: values.password || '',
          fullName: values.fullName.trim(),
          email: values.email.trim(),
          role: values.role,
          tableId: null,
        })
        toast.success(`Tạo mới tài khoản nhân viên "${values.username}" thành công!`)
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
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-text">
                {isEditMode ? 'Chỉnh sửa tài khoản nhân viên' : 'Thêm mới tài khoản nhân viên'}
              </h3>
              <p className="text-xs text-muted">
                {isEditMode
                  ? `Cập nhật thông tin cho @${userToEdit?.username}`
                  : 'Tạo tài khoản dành cho Quản trị viên, Phục vụ, Bếp hoặc Kho'}
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

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Tên đăng nhập <span className="text-status-cancelled">*</span>
            </label>
            <Input
              {...register('username')}
              disabled={isEditMode}
              placeholder="VD: service02, chef02"
              leftIcon={<User className="w-4 h-4 text-muted" />}
              error={errors.username?.message}
            />
            {isEditMode && (
              <span className="text-[11px] text-muted mt-1 block">
                Tên đăng nhập là định danh cố định không thể chỉnh sửa.
              </span>
            )}
          </div>

          {/* Password (only in create mode) */}
          {!isEditMode && (
            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Mật khẩu khởi tạo <span className="text-status-cancelled">*</span>
              </label>
              <Input
                type="password"
                {...register('password')}
                placeholder="Tối thiểu 6 ký tự"
                leftIcon={<Lock className="w-4 h-4 text-muted" />}
                error={errors.password?.message}
              />
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Họ và tên nhân viên <span className="text-status-cancelled">*</span>
            </label>
            <Input
              {...register('fullName')}
              placeholder="VD: Nguyễn Văn A"
              leftIcon={<User className="w-4 h-4 text-muted" />}
              error={errors.fullName?.message}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Địa chỉ Email <span className="text-status-cancelled">*</span>
            </label>
            <Input
              type="email"
              {...register('email')}
              placeholder="VD: staff@roms.vn"
              leftIcon={<Mail className="w-4 h-4 text-muted" />}
              error={errors.email?.message}
            />
            <span className="text-[11px] text-muted mt-1 block">
              Email dùng để nhận mã khôi phục mật khẩu và thông báo hệ thống.
            </span>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Vai trò hệ thống <span className="text-status-cancelled">*</span>
            </label>
            <div className="relative">
              <select
                {...register('role')}
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-text shadow-xs focus:outline-hidden focus:ring-2 focus:ring-accent"
              >
                <option value="SERVICE_STAFF">Nhân viên phục vụ (SERVICE_STAFF)</option>
                <option value="KITCHEN_STAFF">Nhân viên bếp (KITCHEN_STAFF)</option>
                <option value="INVENTORY_STAFF">Nhân viên kho (INVENTORY_STAFF)</option>
                <option value="OWNER">Quản trị viên nhà hàng (OWNER)</option>
              </select>
              <Shield className="w-4 h-4 text-muted absolute right-3 top-3 pointer-events-none" />
            </div>
            {errors.role && (
              <p className="mt-1 text-xs text-status-cancelled">{errors.role.message}</p>
            )}
          </div>

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
                'Tạo tài khoản'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
