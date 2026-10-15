import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/app/store/authStore'
import { authApi } from '@/features/auth/api/authApi'
import { Button } from '@/shared/components/ui/button'
import { UtensilsCrossed, LogOut, ClipboardList, LayoutDashboard, Receipt, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'

export function StaffLayout() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore
    } finally {
      clearAuth()
      toast.success('Đã đăng xuất thành công')
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="bg-primary text-white h-16 px-6 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-accent/20 flex items-center justify-center text-accent">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight">ROMS</span>
            <span className="text-xs text-surface ml-2 hidden sm:inline">
              | Vận hành Nhà hàng
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right text-xs">
            <div className="font-medium text-white">{user?.fullName || user?.username}</div>
            <div className="text-surface/80">{user?.role}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-white hover:bg-primary-hover hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            Đăng xuất
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Simple Side Nav */}
        <aside className="w-56 bg-card border-r border-border p-4 flex flex-col gap-1 hidden md:flex">
          {user?.role === 'OWNER' && (
            <>
              <Link
                to="/owner/dashboard"
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-text hover:bg-surface/50 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-accent" />
                Tổng quan
              </Link>
              <Link
                to="/owner/expenses"
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-text hover:bg-surface/50 transition-colors"
              >
                <Receipt className="w-4 h-4 text-accent" />
                Quản lý Chi phí
              </Link>
              <Link
                to="/owner/reports/revenue"
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-text hover:bg-surface/50 transition-colors"
              >
                <BarChart3 className="w-4 h-4 text-accent" />
                Báo cáo & Thống kê
              </Link>
            </>
          )}
          <Link
            to="/staff/orders"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-text hover:bg-surface/50 transition-colors"
          >
            <ClipboardList className="w-4 h-4 text-accent" />
            Danh sách Order
          </Link>
        </aside>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
