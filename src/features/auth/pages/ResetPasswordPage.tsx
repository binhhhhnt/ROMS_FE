import { ShieldCheck, Info } from 'lucide-react'
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm'

export function ResetPasswordPage() {
  return (
    <div className="w-full max-w-[460px] mx-auto">
      <div className="bg-card border border-border rounded-lg p-6 sm:p-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <ShieldCheck className="w-7 h-7 text-primary mb-3" />

          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-black tracking-tight text-primary uppercase">
              ROMS
            </span>
          </div>

          <h1 className="text-base font-semibold text-text">
            Thiết lập mật khẩu mới
          </h1>

          <p className="mt-2 text-xs text-muted max-w-[340px] leading-relaxed">
            Nhập mã OTP 6 số đã được gửi qua email cùng với mật khẩu mới để hoàn tất khôi phục tài khoản.
          </p>
        </div>

        {/* Divider line */}
        <div className="w-full h-px bg-border my-6" />

        {/* Form */}
        <ResetPasswordForm />

        {/* Policy Notice */}
        <div className="mt-6 pt-4 border-t border-border flex items-start gap-2.5 text-muted">
          <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed text-left text-muted">
            Khi đặt lại mật khẩu thành công, toàn bộ các phiên đăng nhập trước đó trên các thiết bị khác sẽ tự động bị thu hồi vì lý do an toàn.
          </p>
        </div>
      </div>
    </div>
  )
}
export default ResetPasswordPage
