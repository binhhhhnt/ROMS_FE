import { UtensilsCrossed, ShieldCheck } from 'lucide-react'
import { LoginForm } from '@/features/auth/components/LoginForm'

export function LoginPage() {
  return (
    <div className="w-full max-w-[460px] mx-auto">
      {/* Login Card */}
      <div className="bg-card border border-border shadow-xl rounded-xl p-6 sm:p-8 transition-all">
        {/* Brand & Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mb-4 text-primary shadow-inner">
            <UtensilsCrossed className="w-7 h-7 text-primary" />
          </div>

          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-black tracking-tight text-primary uppercase">
              ROMS
            </span>
          </div>

          <h1 className="text-base font-semibold text-text">
            Hệ thống Quản lý vận hành nhà hàng
          </h1>

          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-surface/60 border border-surface rounded-full">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-medium text-text/80 tracking-wide uppercase">
              Quản trị viên &bull; Nhân viên &bull; Tablet bàn
            </span>
          </div>
        </div>

        {/* Divider line */}
        <div className="w-full h-px bg-border my-6" />

        {/* Login Form */}
        <LoginForm />

        {/* Access Policy Notice */}
        <div className="mt-6 pt-4 border-t border-border flex items-start gap-2.5 text-muted">
          <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed text-left text-muted">
            Tài khoản được cấp bởi Quản trị viên nhà hàng. Vui lòng liên hệ Quản lý nếu bạn chưa có thông tin truy cập.
          </p>
        </div>
      </div>
    </div>
  )
}
export default LoginPage
