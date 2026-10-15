import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Mail, ArrowLeft, Send, CheckCircle2, RefreshCw } from 'lucide-react'

import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '@/features/auth/schemas/forgotPasswordSchema'
import { authApi } from '@/features/auth/api/authApi'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setIsLoading(true)
    try {
      const email = values.email.trim()
      const message = await authApi.forgotPassword({ email })
      setSubmittedEmail(email)
      toast.success(message || 'Mã xác thực OTP đã được gửi đến email của bạn!')
    } catch (err) {
      const message = getApiErrorMessage(err)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (!submittedEmail) return
    setIsLoading(true)
    try {
      const message = await authApi.forgotPassword({ email: submittedEmail })
      toast.success(message || 'Đã gửi lại mã OTP thành công!')
    } catch (err) {
      const message = getApiErrorMessage(err)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  // Màn hình thông báo khi đã gửi mã thành công
  if (submittedEmail) {
    return (
      <div className="flex flex-col gap-5 mt-6 text-center animate-in fade-in-50 duration-300">
        <div className="mx-auto w-12 h-12 rounded-full bg-status-completed/10 border border-status-completed/20 flex items-center justify-center text-status-completed">
          <CheckCircle2 className="w-6 h-6" />
        </div>

        <div className="flex flex-col gap-1.5">
          <h2 className="text-base font-semibold text-text">Kiểm tra hộp thư đến</h2>
          <p className="text-xs text-muted leading-relaxed">
            Chúng tôi đã gửi mã xác thực OTP 6 số đến địa chỉ:
          </p>
          <span className="text-sm font-semibold text-primary bg-surface/60 py-1.5 px-3 rounded-lg border border-border inline-block break-all">
            {submittedEmail}
          </span>
          <p className="text-[11px] text-muted/80 mt-1">
            Mã OTP có hiệu lực trong vòng <strong>5 phút</strong> (tối đa 5 lần thử sai).
          </p>
        </div>

        <div className="flex flex-col gap-2.5 mt-2">
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full uppercase tracking-wider font-semibold text-xs shadow-md"
            onClick={() =>
              navigate(`/reset-password?email=${encodeURIComponent(submittedEmail)}`)
            }
          >
            Nhập mã OTP đặt lại mật khẩu &rarr;
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            isLoading={isLoading}
            className="w-full text-xs text-muted hover:text-text"
            onClick={handleResend}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Gửi lại mã OTP
          </Button>
        </div>

        <div className="pt-3 border-t border-border">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Quay lại trang Đăng nhập
          </Link>
        </div>
      </div>
    )
  }

  // Màn hình nhập Email yêu cầu gửi OTP
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-6">
      <div className="flex flex-col gap-1.5 text-left">
        <label
          htmlFor="email"
          className="text-xs font-semibold text-text flex items-center justify-between"
        >
          <span>Địa chỉ Email tài khoản</span>
          <span className="text-[11px] font-normal text-muted">Bắt buộc</span>
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="ví dụ: owner@roms.vn hoặc email của bạn"
          leftIcon={<Mail className="w-4 h-4 text-muted" />}
          error={!!errors.email}
          {...register('email')}
        />
        {errors.email && (
          <span className="text-xs text-status-cancelled">{errors.email.message}</span>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isLoading}
        className="w-full mt-2 uppercase tracking-wider font-semibold text-xs shadow-md"
      >
        <Send className="w-4 h-4 mr-2" />
        Gửi mã xác nhận OTP
      </Button>

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
