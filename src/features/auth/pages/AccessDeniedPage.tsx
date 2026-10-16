import { useNavigate } from 'react-router-dom'
import { ShieldAlert, ArrowLeft, LogOut, Home } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { useAuthStore } from '@/app/store/authStore'
import { authApi } from '@/features/auth/api/authApi'
import { toast } from 'sonner'

export function AccessDeniedPage() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleGoHome = () => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }

    if (user.role === 'TABLE_ACCOUNT') {
      navigate('/tablet/cart', { replace: true })
    } else if (user.role === 'KITCHEN_STAFF') {
      navigate('/kitchen/queue', { replace: true })
    } else if (user.role === 'OWNER') {
      navigate('/owner/dashboard', { replace: true })
    } else {
      navigate('/staff/orders', { replace: true })
    }
  }

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore
    } finally {
      clearAuth()
      toast.success('Đã đăng xuất thành công')
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card border border-border shadow-xl rounded-2xl p-8 max-w-md w-full text-center animate-in fade-in-50 duration-300">
        <div className="w-16 h-16 rounded-2xl bg-status-cancelled/15 text-status-cancelled mx-auto flex items-center justify-center mb-5 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-bold text-text mb-2">Truy cập bị từ chối</h1>

        <p className="text-xs text-muted mb-6 leading-relaxed">
          Tài khoản <strong>{user?.username || 'hiện tại'}</strong> với vai trò{' '}
          <span className="font-semibold text-primary">{user?.role || 'Khách'}</span>{' '}
          không có đặc quyền truy cập vào đường dẫn hoặc tài nguyên này.
        </p>

        <div className="flex flex-col gap-2.5">
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleGoHome}
            className="w-full text-xs font-semibold shadow-md"
          >
            <Home className="w-4 h-4 mr-2" />
            Về màn hình làm việc chính
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="w-full text-xs text-muted hover:text-text"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Quay lại trang trước
          </Button>

          {user && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full text-xs text-status-cancelled hover:bg-status-cancelled/10 mt-2"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Đăng xuất khỏi tài khoản
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
export default AccessDeniedPage
