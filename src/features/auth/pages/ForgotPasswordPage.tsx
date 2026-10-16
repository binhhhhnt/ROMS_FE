import { KeyRound, ShieldAlert } from 'lucide-react'
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm'

export function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-[460px] mx-auto">
      <div className="bg-card border border-border shadow-xl rounded-xl p-6 sm:p-8 transition-all">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mb-4 text-primary shadow-inner">
            <KeyRound className="w-7 h-7 text-primary" />
          </div>

          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-black tracking-tight text-primary uppercase">
              ROMS
            </span>
          </div>

          <h1 className="text-base font-semibold text-text">
            Khôi phục mật khẩu tài khoản
          </h1>

          <p className="mt-2 text-xs text-muted max-w-[340px] leading-relaxed">
            Nhập email tài khoản của bạn để nhận mã xác thực OTP 6 số qua hộp thư điện tử.
          </p>
        </div>

        {/* Divider line */}
        <div className="w-full h-px bg-border my-6" />

        {/* Form */}
        <ForgotPasswordForm />

        {/* Policy Notice */}
        <div className="mt-6 pt-4 border-t border-border flex items-start gap-2.5 text-muted">
          <ShieldAlert className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed text-left text-muted">
            Nếu bạn không nhớ email gắn với tài khoản nhân sự, vui lòng liên hệ trực tiếp Quản trị viên nhà hàng để được cấp lại quyền.
          </p>
        </div>
      </div>
    </div>
  )
}
export default ForgotPasswordPage
