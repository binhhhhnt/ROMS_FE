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
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans">
      {/* KDS Header */}
      <header className="bg-slate-950 border-b border-slate-800 h-16 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-xl tracking-wider">
            <ChefHat className="w-6 h-6" />
            <span>ROMS KDS</span>
          </div>

          <nav className="flex items-center gap-1 ml-6">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sky-600 text-white shadow'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
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
          <span className="text-xs text-slate-400">
            Đầu bếp: {user?.fullName || user?.username}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            Thoát KDS
          </Button>
        </div>
      </header>

      {/* KDS Main Screen */}
      <main className="flex-1 p-6 overflow-auto bg-slate-900">
        <Outlet />
      </main>
    </div>
  )
}
