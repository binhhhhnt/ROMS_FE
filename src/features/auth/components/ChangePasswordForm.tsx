import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Lock, Eye, EyeOff, KeyRound, ShieldAlert } from 'lucide-react'

import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from '@/features/auth/schemas/changePasswordSchema'
import { authApi } from '@/features/auth/api/authApi'
import { useAuthStore } from '@/app/store/authStore'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

export function ChangePasswordForm() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values: ChangePasswordFormValues) => {
    setIsLoading(true)
    try {
      const message = await authApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })

      toast.success(
        message || 'Đổi mật khẩu thành công! Các phiên đăng nhập khác đã được thu hồi.'
      )
      reset()

      // Thu hồi phiên và yêu cầu đăng nhập lại với mật khẩu mới để bảo mật
      clearAuth()
      navigate('/login', { replace: true })
    } catch (err) {
      const message = getApiErrorMessage(err)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-left">
      {/* Current Password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="currentPassword" className="text-xs font-semibold text-text">
          Mật khẩu hiện tại
        </label>
        <Input
          id="currentPassword"
          type={showCurrentPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Nhập mật khẩu đang sử dụng"
          leftIcon={<Lock className="w-4 h-4 text-muted" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="text-muted hover:text-text transition-colors p-1"
              aria-label={showCurrentPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showCurrentPassword ? (
                <EyeOff className="w-4 h-4 text-muted" />
              ) : (
                <Eye className="w-4 h-4 text-muted" />
              )}
            </button>
          }
          error={!!errors.currentPassword}
          {...register('currentPassword')}
        />
        {errors.currentPassword && (
          <span className="text-xs text-status-cancelled">
            {errors.currentPassword.message}
          </span>
        )}
      </div>

      {/* New Password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="newPassword" className="text-xs font-semibold text-text">
          Mật khẩu mới
        </label>
        <Input
          id="newPassword"
          type={showNewPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Tối thiểu 6 ký tự"
          leftIcon={<KeyRound className="w-4 h-4 text-muted" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="text-muted hover:text-text transition-colors p-1"
              aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showNewPassword ? (
                <EyeOff className="w-4 h-4 text-muted" />
              ) : (
                <Eye className="w-4 h-4 text-muted" />
              )}
            </button>
          }
          error={!!errors.newPassword}
          {...register('newPassword')}
        />
        {errors.newPassword && (
          <span className="text-xs text-status-cancelled">{errors.newPassword.message}</span>
        )}
      </div>

      {/* Confirm New Password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="text-xs font-semibold text-text">
          Xác nhận mật khẩu mới
        </label>
        <Input
          id="confirmPassword"
          type={showConfirmPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Nhập lại mật khẩu mới"
          leftIcon={<Lock className="w-4 h-4 text-muted" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-muted hover:text-text transition-colors p-1"
              aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4 text-muted" />
              ) : (
                <Eye className="w-4 h-4 text-muted" />
              )}
            </button>
          }
          error={!!errors.confirmPassword}
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <span className="text-xs text-status-cancelled">
            {errors.confirmPassword.message}
          </span>
        )}
      </div>

      <div className="p-3 bg-surface/50 border border-border rounded-lg flex items-start gap-2.5 text-muted text-xs">
        <ShieldAlert className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <span>
          Sau khi đổi mật khẩu thành công, hệ thống sẽ tự động đăng xuất trên mọi thiết bị và yêu cầu đăng nhập lại bằng mật khẩu mới.
        </span>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isLoading}
        className="w-full mt-2 uppercase tracking-wider font-semibold text-xs shadow-md"
      >
        Cập nhật mật khẩu mới
      </Button>
    </form>
  )
}
