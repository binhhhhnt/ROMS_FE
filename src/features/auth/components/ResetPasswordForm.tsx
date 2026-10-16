import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Mail, ShieldCheck, Lock, Eye, EyeOff, KeyRound, RefreshCw, ArrowLeft } from 'lucide-react'

import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from '@/features/auth/schemas/resetPasswordSchema'
import { authApi } from '@/features/auth/api/authApi'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

export function ResetPasswordForm() {
  const [searchParams] = useSearchParams()
  const initialEmail = searchParams.get('email') || ''
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: initialEmail,
      otp: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    if (initialEmail) {
      setValue('email', initialEmail)
    }
  }, [initialEmail, setValue])

  const currentEmail = watch('email')

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setIsLoading(true)
    try {
      const message = await authApi.resetPassword({
        email: values.email.trim(),
        otp: values.otp.trim(),
        newPassword: values.newPassword,
      })

      toast.success(
        message || 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.'
      )
      navigate('/login', { replace: true })
    } catch (err) {
      const message = getApiErrorMessage(err)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (!currentEmail || errors.email) {
      toast.error('Vui lòng nhập địa chỉ email hợp lệ để nhận lại mã OTP')
      return
    }

    setIsResending(true)
    try {
      const message = await authApi.forgotPassword({ email: currentEmail.trim() })
      toast.success(message || 'Đã gửi lại mã OTP thành công. Vui lòng kiểm tra hộp thư!')
    } catch (err) {
      const message = getApiErrorMessage(err)
      toast.error(message)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-6">
      {/* Email Field */}
      <div className="flex flex-col gap-1.5 text-left">
        <label
          htmlFor="email"
          className="text-xs font-semibold text-text flex items-center justify-between"
        >
          <span>Địa chỉ Email</span>
          <span className="text-[11px] font-normal text-muted">Bắt buộc</span>
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="Nhập email nhận OTP"
          leftIcon={<Mail className="w-4 h-4 text-muted" />}
          error={!!errors.email}
          {...register('email')}
        />
        {errors.email && (
          <span className="text-xs text-status-cancelled">{errors.email.message}</span>
        )}
      </div>

      {/* OTP Field with Resend Button */}
      <div className="flex flex-col gap-1.5 text-left">
        <div className="flex items-center justify-between">
          <label htmlFor="otp" className="text-xs font-semibold text-text">
            Mã OTP (6 chữ số)
          </label>
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={isResending}
            className="text-xs text-accent hover:underline font-medium inline-flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
            Gửi lại mã
          </button>
        </div>
        <Input
          id="otp"
          maxLength={6}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="Ví dụ: 868686"
          leftIcon={<KeyRound className="w-4 h-4 text-muted" />}
          className="font-mono tracking-widest text-center text-base"
          error={!!errors.otp}
          {...register('otp')}
        />
        {errors.otp && (
          <span className="text-xs text-status-cancelled">{errors.otp.message}</span>
        )}
      </div>

      {/* New Password */}
      <div className="flex flex-col gap-1.5 text-left">
        <label htmlFor="newPassword" className="text-xs font-semibold text-text">
          Mật khẩu mới
        </label>
        <Input
          id="newPassword"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Ít nhất 6 ký tự"
          leftIcon={<Lock className="w-4 h-4 text-muted" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted hover:text-text transition-colors p-1"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? (
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
      <div className="flex flex-col gap-1.5 text-left">
        <label htmlFor="confirmPassword" className="text-xs font-semibold text-text">
          Xác nhận mật khẩu mới
        </label>
        <Input
          id="confirmPassword"
          type={showConfirmPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Nhập lại mật khẩu mới"
          leftIcon={<ShieldCheck className="w-4 h-4 text-muted" />}
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

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isLoading}
        className="w-full mt-2 uppercase tracking-wider font-semibold text-xs shadow-md"
      >
        <KeyRound className="w-4 h-4 mr-2" />
        Xác nhận đặt lại mật khẩu
      </Button>

      {/* Back to Login */}
      <div className="flex items-center justify-center pt-4 border-t border-border mt-2">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Quay lại trang Đăng nhập
        </Link>
      </div>
    </form>
  )
}
