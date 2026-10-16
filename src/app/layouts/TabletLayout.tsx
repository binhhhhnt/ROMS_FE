import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/app/store/authStore'
import { authApi } from '@/features/auth/api/authApi'
import { Button } from '@/shared/components/ui/button'
import { Utensils, ShoppingCart, Clock, LogOut, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export function TabletLayout() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore
    } finally {
      clearAuth()
      toast.success('Đã đăng xuất máy tính bảng')
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-background text-text flex flex-col font-sans">
      {/* Tablet Top Navigation */}
      <header className="bg-primary text-white h-16 px-6 flex items-center justify-between shadow sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-primary font-bold shadow-sm">
            {user?.tableName || user?.tableId ? `B${user?.tableId}` : 'TB'}
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">
              {user?.tableName ? `Bàn ${user.tableName}` : `Bàn #${user?.tableId || '—'}`}
            </h1>
            <p className="text-xs text-surface/80">Gọi món tại bàn</p>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <Link to="/tablet/menu">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-primary-hover hover:text-white"
            >
              <Utensils className="w-4 h-4 mr-1.5" />
              Thực đơn
            </Button>
          </Link>
          <Link to="/tablet/ai-assistant">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-primary-hover hover:text-white"
            >
              <Sparkles className="w-4 h-4 mr-1.5 text-accent" />
              Trợ lý AI
            </Button>
          </Link>
          <Link to="/tablet/cart">
            <Button
              variant="secondary"
              size="sm"
              className="bg-surface text-text hover:bg-surface/90 font-medium"
            >
              <ShoppingCart className="w-4 h-4 mr-1.5 text-accent" />
              Giỏ hàng
            </Button>
          </Link>
          <Link to="/tablet/orders">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-primary-hover hover:text-white"
            >
              <Clock className="w-4 h-4 mr-1.5" />
              Đơn hàng
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-surface/70 hover:text-white hover:bg-primary-hover ml-2"
            title="Đăng xuất tài khoản bàn"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </nav>
      </header>

      {/* Main Tablet Content */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  )
}
