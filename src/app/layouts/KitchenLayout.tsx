import { useEffect, useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/app/store/authStore'
import { authApi } from '@/features/auth/api/authApi'
import { subscribeToTopic } from '@/shared/lib/stomp'
import { Button } from '@/shared/components/ui/button'
import { ChefHat, LogOut, Flame, Layers, CheckCircle2, UtensilsCrossed, BookOpen, LayoutDashboard, Menu, X } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

export function KitchenLayout() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  // Realtime STOMP Subscription at layout level to keep kitchen queries in sync across tabs
  useEffect(() => {
    const unsub = subscribeToTopic('/topic/kitchen/orders', () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen', 'orders'] })
    })

    return () => {
      unsub()
    }
  }, [queryClient])

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore
    } finally {
      clearAuth()
      navigate('/login')
    }
  }

  const navItems = [
    { label: 'Chế biến', path: '/kitchen/cooking', icon: Flame },
    { label: 'Tổng hợp chế biến', path: '/kitchen/summary', icon: Layers },
    { label: 'Chờ bưng món', path: '/kitchen/ready', icon: CheckCircle2 },
    { label: 'Trạng thái món', path: '/kitchen/menu-availability', icon: UtensilsCrossed },
    { label: 'Công thức (BOM)', path: '/kitchen/recipes', icon: BookOpen },
  ]

  return (
    <div className="min-h-screen bg-background text-text flex flex-col font-sans">
      {/* KDS Header */}
      <header className="bg-primary text-white h-16 px-4 md:px-6 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 -ml-1 rounded-lg text-white hover:bg-white/10 transition-colors"
            aria-label="Mở menu KDS"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-white font-bold text-lg sm:text-xl tracking-wide">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-accent">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <span>ROMS KDS</span>
          </div>

          <nav className="hidden lg:flex items-center gap-1.5 ml-6">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                    isActive
                      ? 'bg-white/20 text-white shadow-xs'
                      : 'text-white/75 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-xs text-white/80 hidden sm:inline">
            {user?.role === 'OWNER' ? 'Quản lý: ' : 'Đầu bếp: '}<strong>{user?.fullName || user?.username}</strong>
          </span>

          {user?.role === 'OWNER' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/owner/dashboard')}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs flex items-center gap-1.5"
              title="Về trang quản trị"
            >
              <LayoutDashboard className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Về trang quản trị</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-white hover:bg-white/10 hover:text-white text-xs"
            title="Thoát KDS"
          >
            <LogOut className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Thoát KDS</span>
          </Button>
        </div>
      </header>

      {/* Mobile KDS Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-64 max-w-[80vw] bg-card border-r border-border p-4 flex flex-col gap-1 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-primary flex items-center justify-center text-white">
                  <ChefHat className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-primary">ROMS KDS</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface transition-colors"
                aria-label="Đóng menu KDS"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm transition-colors',
                    isActive
                      ? 'bg-surface text-primary font-semibold shadow-[inset_3px_0_0_var(--color-accent)]'
                      : 'text-text hover:bg-surface/50'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </aside>
        </div>
      )}

      {/* KDS Main Screen */}
      <main className="flex-1 p-4 md:p-6 overflow-auto bg-background min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
