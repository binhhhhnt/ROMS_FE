import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/app/store/authStore'
import { authApi } from '@/features/auth/api/authApi'
import { Button } from '@/shared/components/ui/button'
import { ChefHat, LogOut, Clock, Flame, CheckCircle2, UtensilsCrossed } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/shared/utils/cn'

export function KitchenLayout() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore
    } finally {
      clearAuth()
      toast.success('Đã đăng xuất khỏi màn hình bếp')
      navigate('/login')
    }
  }

  const navItems = [
    { label: 'Hàng đợi', path: '/kitchen/queue', icon: Clock },
    { label: 'Đang nấu', path: '/kitchen/cooking', icon: Flame },
    { label: 'Sẵn sàng', path: '/kitchen/ready', icon: CheckCircle2 },
    { label: 'Trạng thái món', path: '/kitchen/menu-availability', icon: UtensilsCrossed },
  ]

  return (
    <div className="min-h-screen bg-background text-text flex flex-col font-sans">
      {/* KDS Header */}
      <header className="bg-primary text-white h-16 px-6 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white font-bold text-xl tracking-wide">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-accent">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <span>ROMS KDS</span>
          </div>

          <nav className="flex items-center gap-1.5 ml-6">
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

        <div className="flex items-center gap-4">
          <span className="text-xs text-white/80 hidden sm:inline">
            Đầu bếp: <strong>{user?.fullName || user?.username}</strong>
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-white hover:bg-white/10 hover:text-white text-xs"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            Thoát KDS
          </Button>
        </div>
      </header>

      {/* KDS Main Screen */}
      <main className="flex-1 p-6 overflow-auto bg-background">
        <Outlet />
      </main>
    </div>
  )
}
