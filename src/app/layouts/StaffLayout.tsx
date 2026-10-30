import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/app/store/authStore'
import { authApi } from '@/features/auth/api/authApi'
import { Button } from '@/shared/components/ui/button'
import {
  UtensilsCrossed,
  LogOut,
  ClipboardList,
  LayoutDashboard,
  Boxes,
  History,
  ClipboardCheck,
  BookOpen,
  ShoppingBag,
  Receipt,
  BarChart3,
  FolderOpen,
  UserCog,
  Users,
  Layers,
  Sparkles,
} from 'lucide-react'
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
          <Link
            to="/profile"
            className="text-right text-xs hover:opacity-80 transition-opacity p-1 rounded"
            title="Xem hồ sơ cá nhân"
          >
            <div className="font-medium text-white">{user?.fullName || user?.username}</div>
            <div className="text-surface/80">{user?.role}</div>
          </Link>
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
          {/* OWNER Links */}
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
                to="/owner/users"
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-text hover:bg-surface/50 transition-colors"
              >
                <Users className="w-4 h-4 text-accent" />
                Quản lý tài khoản
              </Link>
              <Link
                to="/owner/categories"
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-text hover:bg-surface/50 transition-colors"
              >
                <FolderOpen className="w-4 h-4 text-accent" />
                Danh mục món
              </Link>
              <Link
                to="/owner/menu-items"
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-text hover:bg-surface/50 transition-colors"
              >
                <UtensilsCrossed className="w-4 h-4 text-accent" />
                Danh sách món
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

          {/* SERVICE_STAFF & OWNER Links */}
          {(user?.role === 'OWNER' || user?.role === 'SERVICE_STAFF') && (
            <>
              <Link
                to="/tables"
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-text hover:bg-surface/50 transition-colors"
              >
                <Layers className="w-4 h-4 text-accent" />
                Sơ đồ bàn
              </Link>
              <Link
                to="/staff/orders"
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-text hover:bg-surface/50 transition-colors"
              >
                <ClipboardList className="w-4 h-4 text-accent" />
                Danh sách Order
              </Link>
              <Link
                to="/sessions/history"
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-text hover:bg-surface/50 transition-colors"
              >
                <History className="w-4 h-4 text-accent" />
                Lịch sử phiên bàn
              </Link>
              <Link
                to="/ai-assistant"
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-text hover:bg-surface/50 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-accent" />
                Trợ lý AI Gemini
              </Link>
            </>
          )}

          {/* INVENTORY_STAFF & OWNER Links */}
          {(user?.role === 'OWNER' || user?.role === 'INVENTORY_STAFF') && (
            <>
              <Link
                to="/inventory/ingredients"
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-text hover:bg-surface/50 transition-colors"
              >
                <Boxes className="w-4 h-4 text-accent" />
                Nguyên liệu & Tồn kho
              </Link>
              <Link
                to="/inventory/movements"
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-text hover:bg-surface/50 transition-colors"
              >
                <History className="w-4 h-4 text-accent" />
                Biến động kho
              </Link>
              <Link
                to="/inventory/checks"
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-text hover:bg-surface/50 transition-colors"
              >
                <ClipboardCheck className="w-4 h-4 text-accent" />
                Kiểm kê kho
              </Link>
              {user?.role === 'OWNER' && (
                <Link
                  to="/kitchen/recipes"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-text hover:bg-surface/50 transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-accent" />
                  Công thức món (BOM)
                </Link>
              )}
              <Link
                to="/inventory/purchases"
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-text hover:bg-surface/50 transition-colors"
              >
                <ShoppingBag className="w-4 h-4 text-accent" />
                Phiếu nhập hàng
              </Link>
            </>
          )}

          {/* Bottom Profile Link */}
          <Link
            to="/profile"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-text hover:bg-surface/50 transition-colors mt-auto pt-2 border-t border-border"
          >
            <UserCog className="w-4 h-4 text-accent" />
            Hồ sơ & Bảo mật
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
