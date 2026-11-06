import { Outlet, Link, NavLink, useNavigate, useMatch } from 'react-router-dom'
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
  Sliders,
  Tag,
  ReceiptText,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/shared/utils/cn'

const getNavLinkClassName = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
    isActive
      ? 'bg-surface text-primary font-semibold shadow-[inset_3px_0_0_var(--color-accent)]'
      : 'text-text hover:bg-surface/50'
  )

export function StaffLayout() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const isReportsPage = Boolean(useMatch('/owner/reports/*'))

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
              <NavLink
                to="/owner/dashboard"
                className={getNavLinkClassName}
              >
                <LayoutDashboard className="w-4 h-4 text-accent" />
                Tổng quan
              </NavLink>
              <NavLink
                to="/owner/users"
                className={getNavLinkClassName}
              >
                <Users className="w-4 h-4 text-accent" />
                Quản lý tài khoản
              </NavLink>
              <NavLink
                to="/owner/categories"
                className={getNavLinkClassName}
              >
                <FolderOpen className="w-4 h-4 text-accent" />
                Danh mục món
              </NavLink>
              <NavLink
                to="/owner/menu-items"
                className={getNavLinkClassName}
              >
                <UtensilsCrossed className="w-4 h-4 text-accent" />
                Danh sách món
              </NavLink>
              <NavLink
                to="/owner/expenses"
                className={getNavLinkClassName}
              >
                <Receipt className="w-4 h-4 text-accent" />
                Quản lý Chi phí
              </NavLink>
              <NavLink
                to="/owner/bills"
                className={getNavLinkClassName}
              >
                <ReceiptText className="w-4 h-4 text-accent" />
                Lịch sử hóa đơn
              </NavLink>
              <NavLink
                to="/owner/promotions"
                className={getNavLinkClassName}
              >
                <Tag className="w-4 h-4 text-accent" />
                Khuyến mãi
              </NavLink>
              <NavLink
                to="/owner/reports/revenue"
                aria-current={isReportsPage ? 'page' : undefined}
                className={() => getNavLinkClassName({ isActive: isReportsPage })}
              >
                <BarChart3 className="w-4 h-4 text-accent" />
                Báo cáo & Thống kê
              </NavLink>
              <NavLink
                to="/owner/settings"
                className={getNavLinkClassName}
              >
                <Sliders className="w-4 h-4 text-accent" />
                Cài đặt & Thuế
              </NavLink>
            </>
          )}

          {/* SERVICE_STAFF & OWNER Links */}
          {(user?.role === 'OWNER' || user?.role === 'SERVICE_STAFF') && (
            <>
              <NavLink
                to="/tables"
                className={getNavLinkClassName}
              >
                <Layers className="w-4 h-4 text-accent" />
                Sơ đồ bàn
              </NavLink>
              <NavLink
                to="/staff/orders"
                className={getNavLinkClassName}
              >
                <ClipboardList className="w-4 h-4 text-accent" />
                Danh sách Order
              </NavLink>
              <NavLink
                to="/sessions/history"
                className={getNavLinkClassName}
              >
                <History className="w-4 h-4 text-accent" />
                Lịch sử phiên bàn
              </NavLink>
              <NavLink
                to="/ai-assistant"
                className={getNavLinkClassName}
              >
                <Sparkles className="w-4 h-4 text-accent" />
                Trợ lý AI Gemini
              </NavLink>
            </>
          )}

          {/* INVENTORY_STAFF & OWNER Links */}
          {(user?.role === 'OWNER' || user?.role === 'INVENTORY_STAFF') && (
            <>
              <NavLink
                to="/inventory/ingredients"
                className={getNavLinkClassName}
              >
                <Boxes className="w-4 h-4 text-accent" />
                Nguyên liệu & Tồn kho
              </NavLink>
              <NavLink
                to="/inventory/movements"
                className={getNavLinkClassName}
              >
                <History className="w-4 h-4 text-accent" />
                Biến động kho
              </NavLink>
              <NavLink
                to="/inventory/checks"
                className={getNavLinkClassName}
              >
                <ClipboardCheck className="w-4 h-4 text-accent" />
                Kiểm kê kho
              </NavLink>
              {user?.role === 'OWNER' && (
                <NavLink
                  to="/kitchen/recipes"
                  className={getNavLinkClassName}
                >
                  <BookOpen className="w-4 h-4 text-accent" />
                  Công thức món (BOM)
                </NavLink>
              )}
              <NavLink
                to="/inventory/purchases"
                className={getNavLinkClassName}
              >
                <ShoppingBag className="w-4 h-4 text-accent" />
                Phiếu nhập hàng
              </NavLink>
            </>
          )}

          {/* Bottom Profile Link */}
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              cn(getNavLinkClassName({ isActive }), 'mt-auto pt-2 border-t border-border')
            }
          >
            <UserCog className="w-4 h-4 text-accent" />
            Hồ sơ & Bảo mật
          </NavLink>
        </aside>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
