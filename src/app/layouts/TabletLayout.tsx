import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/app/store/authStore'
import { authApi } from '@/features/auth/api/authApi'
import { Button } from '@/shared/components/ui/button'
import { CartItemCountBadge } from '@/features/ordering/components/CartItemCountBadge'
import { Utensils, ShoppingCart, Clock, LogOut } from 'lucide-react'
import { toast } from 'sonner'

export function TabletLayout() {
  const { clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `relative inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:px-4 ${isActive ? 'bg-surface/60 text-primary' : 'text-muted hover:bg-background hover:text-primary'}`

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
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-8">
          <div className="flex items-center gap-3" aria-label="ROMS — Gọi món tại bàn">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white"><Utensils className="h-5 w-5" aria-hidden="true" /></span>
            <div><p className="text-xl font-extrabold tracking-[0.16em] text-primary">ROMS</p><p className="text-[11px] text-muted">Gọi món tại bàn</p></div>
          </div>
          <nav className="flex flex-wrap items-center gap-1 sm:gap-2" aria-label="Điều hướng gọi món">
            <NavLink to="/tablet/menu" className={navClass}><Utensils className="h-4 w-4" aria-hidden="true" />Thực đơn</NavLink>
            <NavLink to="/tablet/cart" className={navClass}><ShoppingCart className="h-4 w-4" aria-hidden="true" />Giỏ hàng<CartItemCountBadge /></NavLink>
            <NavLink to="/tablet/orders" className={navClass}><Clock className="h-4 w-4" aria-hidden="true" />Đơn hàng</NavLink>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-11 w-11 rounded-xl text-muted hover:bg-surface/50 hover:text-primary"
              aria-label="Đăng xuất tài khoản bàn"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Tablet Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8 md:py-8">
        <Outlet />
      </main>
    </div>
  )
}
