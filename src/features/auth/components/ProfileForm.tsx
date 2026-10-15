import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { User, Mail, Shield, Calendar, Save, CheckCircle2, AlertCircle } from 'lucide-react'

import {
  updateProfileSchema,
  type UpdateProfileFormValues,
} from '@/features/auth/schemas/updateProfileSchema'
import { authApi } from '@/features/auth/api/authApi'
import { useAuthStore } from '@/app/store/authStore'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'

export function ProfileForm() {
  const queryClient = useQueryClient()
  const { user: authUser, setUser } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    data: profile,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => authApi.getProfile(),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: '',
      email: '',
    },
  })

  useEffect(() => {
    if (profile) {
      reset({
        fullName: profile.fullName || '',
        email: profile.email || '',
      })
    }
  }, [profile, reset])

  const mutation = useMutation({
    mutationFn: (values: UpdateProfileFormValues) =>
      authApi.updateProfile({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
      }),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['userProfile'], updatedProfile)
      if (authUser) {
        setUser({
          ...authUser,
          fullName: updatedProfile.fullName,
        })
      }
      toast.success('Cập nhật hồ sơ cá nhân thành công!')
    },
    onError: (err) => {
      const message = getApiErrorMessage(err)
      toast.error(message)
    },
    onSettled: () => {
      setIsSubmitting(false)
    },
  })

  const onSubmit = (values: UpdateProfileFormValues) => {
    setIsSubmitting(true)
    mutation.mutate(values)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs">Đang tải thông tin hồ sơ...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-status-cancelled gap-2">
        <AlertCircle className="w-8 h-8" />
        <p className="text-sm font-semibold">Không thể tải thông tin hồ sơ</p>
        <span className="text-xs text-muted">{getApiErrorMessage(error)}</span>
      </div>
    )
  }

  const roleBadgeVariant = (): 'default' | 'ready' | 'cooking' | 'secondary' | 'completed' | 'outline' => {
    switch (profile?.role) {
      case 'OWNER':
        return 'default'
      case 'SERVICE_STAFF':
        return 'ready'
      case 'KITCHEN_STAFF':
        return 'cooking'
      case 'INVENTORY_STAFF':
        return 'secondary'
      case 'TABLE_ACCOUNT':
        return 'completed'
      default:
        return 'outline'
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 text-left">
      {/* Account Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-surface/40 border border-border rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
            {profile?.username.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <span className="text-[11px] text-muted block">Tên tài khoản (Username)</span>
            <span className="text-sm font-semibold text-text">{profile?.username}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface text-muted flex items-center justify-center">
            <Shield className="w-5 h-5 text-accent" />
          </div>
          <div>
            <span className="text-[11px] text-muted block">Vai trò trong hệ thống</span>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant={roleBadgeVariant()}>{profile?.role}</Badge>
              {profile?.tableCode && (
                <span className="text-xs text-muted">Bàn: {profile.tableCode}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Editable: Full Name */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="fullName" className="text-xs font-semibold text-text flex justify-between">
          <span>Họ và tên</span>
          <span className="text-[11px] font-normal text-muted">Bắt buộc</span>
        </label>
        <Input
          id="fullName"
          autoComplete="name"
          placeholder="Nhập họ và tên đầy đủ"
          leftIcon={<User className="w-4 h-4 text-muted" />}
          error={!!errors.fullName}
          {...register('fullName')}
        />
        {errors.fullName && (
          <span className="text-xs text-status-cancelled">{errors.fullName.message}</span>
        )}
      </div>

      {/* Editable: Email */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-xs font-semibold text-text flex justify-between">
          <span>Địa chỉ Email liên hệ</span>
          <span className="text-[11px] font-normal text-muted">Nhận OTP khôi phục</span>
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="Nhập email cá nhân"
          leftIcon={<Mail className="w-4 h-4 text-muted" />}
          error={!!errors.email}
          {...register('email')}
        />
        {errors.email && (
          <span className="text-xs text-status-cancelled">{errors.email.message}</span>
        )}
      </div>

      {/* Meta details */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-muted border-t border-border">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-status-completed" />
          Trạng thái: <strong>{profile?.isActive ? 'Đang hoạt động' : 'Đã khóa'}</strong>
        </span>

        {profile?.createdAt && (
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Ngày tham gia:{' '}
            <strong>{new Date(profile.createdAt).toLocaleDateString('vi-VN')}</strong>
          </span>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isSubmitting}
        disabled={!isDirty || isSubmitting}
        className="w-full mt-2 uppercase tracking-wider font-semibold text-xs shadow-md"
      >
        <Save className="w-4 h-4 mr-2" />
        Lưu thay đổi hồ sơ
      </Button>
    </form>
  )
}
