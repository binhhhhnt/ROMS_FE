import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { User, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'

import { loginSchema, type LoginFormValues } from '@/features/auth/schemas/loginSchema'
import { authApi } from '@/features/auth/api/authApi'
import { useAuthStore } from '@/app/store/authStore'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true)
    setFormError(null)
    try {
      // 1. Call login API to get accessToken
      const loginData = await authApi.login({
        username: values.username.trim(),
        password: values.password,
      })

      // Temporary set access token so getMe request will carry it
      useAuthStore.getState().setAccessToken(loginData.accessToken)

      // 2. Fetch authenticated user profile
      const userProfile = await authApi.getMe()

      // 3. Save to Zustand store
      setAuth(loginData.accessToken, userProfile)
      toast.success(`Xin chào, ${userProfile.fullName || userProfile.username}!`)

      // 4. Role-aware redirection
      if (userProfile.role === 'KITCHEN_STAFF') {
        navigate('/kitchen/cooking', { replace: true })
      } else if (userProfile.role === 'OWNER') {
        navigate('/owner/dashboard', { replace: true })
      } else if (userProfile.role === 'SERVICE_STAFF') {
        navigate('/tables', { replace: true })
      } else if (userProfile.role === 'INVENTORY_STAFF') {
        navigate('/inventory/ingredients', { replace: true })
      } else {
        navigate('/staff/orders', { replace: true })
      }
    } catch (err) {
      setFormError(getApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-6">
      {/* Username / Staff ID */}
      <div className="flex flex-col gap-1.5 text-left">
        <label
          htmlFor="username"
          className="text-xs font-semibold text-text flex items-center justify-between"
        >
          <span>Tên đăng nhập / Email</span>
          <span className="text-[11px] font-normal text-muted">Bắt buộc</span>
        </label>
        <Input
          id="username"
          autoComplete="username"
          placeholder="Nhập tên đăng nhập hoặc email"
          leftIcon={<User className="w-4 h-4 text-muted" />}
          error={!!errors.username}
          {...register('username', {
            onChange: () => {
              if (formError) setFormError(null)
            },
          })}
        />
        {errors.username && (
          <span className="text-xs text-status-cancelled">{errors.username.message}</span>
        )}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5 text-left">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-xs font-semibold text-text">
            Mật khẩu
          </label>
          <Link
            to="/forgot-password"
            className="text-xs text-accent hover:underline font-medium"
          >
            Quên mật khẩu?
          </Link>
        </div>
        <Input
          id="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
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
          error={!!errors.password}
          {...register('password', {
            onChange: () => {
              if (formError) setFormError(null)
            },
          })}
        />
        {errors.password && (
          <span className="text-xs text-status-cancelled">{errors.password.message}</span>
        )}
      </div>

      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700 text-left"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <span>{formError}</span>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isLoading}
        className="w-full mt-2 uppercase tracking-wider font-semibold text-sm shadow-md"
      >
        <LogIn className="w-4 h-4 mr-2" />
        Đăng nhập
      </Button>
    </form>
  )
}
