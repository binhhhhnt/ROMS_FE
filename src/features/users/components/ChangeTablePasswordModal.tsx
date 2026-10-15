import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, KeyRound, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

import {
  changeTablePasswordSchema,
  type ChangeTablePasswordFormValues,
} from '@/features/users/schemas/userSchema'
import { userApi } from '@/features/users/api/userApi'
import type { UserItem } from '@/features/users/types/user.types'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { getApiErrorMessage } from '@/shared/lib/axios'

interface ChangeTablePasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  account: UserItem | null
}

export function ChangeTablePasswordModal({
  isOpen,
  onClose,
  onSuccess,
  account,
}: ChangeTablePasswordModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangeTablePasswordFormValues>({
    resolver: zodResolver(changeTablePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    reset({
      password: '',
      confirmPassword: '',
    })
    setErrorMessage(null)
    setShowPassword(false)
    setShowConfirmPassword(false)
  }, [isOpen, reset, account])

  if (!isOpen || !account) return null

  const onSubmit = async (values: ChangeTablePasswordFormValues) => {
    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      await userApi.updateUser(account.id, {
        fullName: account.fullName,
        role: 'TABLE_ACCOUNT',
        tableId: account.tableId ? Number(account.tableId) : null,
        password: values.password.trim(),
      })

      toast.success(
        `Đã cập nhật mật khẩu mới cho tài khoản máy tính bảng @${account.username}!`
      )
      onSuccess()
      onClose()
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err) || 'Không thể đổi mật khẩu')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-accent/10 text-accent rounded-xl">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-text">Đổi mật khẩu tài khoản Tablet</h3>
              <p className="text-xs text-muted">
                Tài khoản: <span className="font-mono font-semibold text-text">@{account.username}</span>
                {account.tableCode && ` (Bàn ${account.tableCode})`}
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
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-status-cancelled/10 border border-status-cancelled/20 text-status-cancelled text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Mật khẩu mới <span className="text-status-cancelled">*</span>
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
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

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Xác nhận mật khẩu mới <span className="text-status-cancelled">*</span>
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                placeholder="Nhập lại mật khẩu mới"
                leftIcon={<Lock className="w-4 h-4 text-muted" />}
                error={errors.confirmPassword?.message}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-muted hover:text-text transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface/70 border border-border text-[11px] text-muted space-y-1">
            <p className="font-semibold text-text">Lưu ý khi đổi mật khẩu thiết bị:</p>
            <p>• Mật khẩu mới có hiệu lực ngay trên máy tính bảng tại bàn.</p>
            <p>• Nếu máy đang đăng nhập, thiết bị sẽ cần đăng nhập lại với mật khẩu mới.</p>
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
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                'Cập nhật mật khẩu'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
