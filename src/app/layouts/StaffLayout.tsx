import { useEffect, useState } from 'react'
import { Outlet, Link, NavLink, useNavigate, useMatch, useLocation } from 'react-router-dom'
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
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/shared/utils/cn'
import { StaffCallPanel } from '@/features/tables/components/StaffCallPanel'
import { ReadyDishesPanel } from '@/features/tables/components/ReadyDishesPanel'

interface SidebarNavItem {
  to: string
  label: string
  icon: LucideIcon
  visible: boolean
  isActiveOverride?: boolean
}

const getNavLinkClassName = ({
  isActive,
  collapsed,
}: {
  isActive: boolean
  collapsed?: boolean
}) =>
  cn(
    'flex items-center rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
    collapsed ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-3 py-2',
    isActive
      ? 'bg-surface text-primary font-semibold shadow-[inset_3px_0_0_var(--color-accent)]'
      : 'text-text hover:bg-surface/50'
  )

export function StaffLayout() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const isReportsPage = Boolean(useMatch('/owner/reports/*'))

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Close mobile drawer when route changes
  useEffect(() => {
    setIsMobileOpen(false)
  }, [location.pathname])

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

  const isOwner = user?.role === 'OWNER'
  const isServiceOrOwner = isOwner || user?.role === 'SERVICE_STAFF'
  const isInventoryOrOwner = isOwner || user?.role === 'INVENTORY_STAFF'

  const navItems: SidebarNavItem[] = [
    // OWNER Links
    { to: '/owner/dashboard', label: 'Tổng quan', icon: LayoutDashboard, visible: isOwner },
    { to: '/owner/users', label: 'Quản lý tài khoản', icon: Users, visible: isOwner },
    { to: '/owner/categories', label: 'Danh mục món', icon: FolderOpen, visible: isOwner },
    { to: '/owner/menu-items', label: 'Danh sách món', icon: UtensilsCrossed, visible: isOwner },
    { to: '/owner/expenses', label: 'Quản lý Chi phí', icon: Receipt, visible: isOwner },
    { to: '/owner/bills', label: 'Lịch sử hóa đơn', icon: ReceiptText, visible: isOwner },
    { to: '/owner/promotions', label: 'Khuyến mãi', icon: Tag, visible: isOwner },
    {
      to: '/owner/reports/revenue',
      label: 'Báo cáo & Thống kê',
      icon: BarChart3,
      visible: isOwner,
      isActiveOverride: isReportsPage,
    },
    { to: '/owner/settings', label: 'Cài đặt & Thuế', icon: Sliders, visible: isOwner },

    // SERVICE_STAFF & OWNER Links
    { to: '/tables', label: 'Sơ đồ bàn', icon: Layers, visible: isServiceOrOwner },
    { to: '/staff/orders', label: 'Danh sách Order', icon: ClipboardList, visible: isServiceOrOwner },
    { to: '/sessions/history', label: 'Lịch sử phiên bàn', icon: History, visible: isServiceOrOwner },
    { to: '/ai-assistant', label: 'Trợ lý AI Gemini', icon: Sparkles, visible: isServiceOrOwner },

    // INVENTORY_STAFF & OWNER Links
    { to: '/inventory/ingredients', label: 'Nguyên liệu & Tồn kho', icon: Boxes, visible: isInventoryOrOwner },
    { to: '/inventory/movements', label: 'Biến động kho', icon: History, visible: isInventoryOrOwner },
    { to: '/inventory/checks', label: 'Kiểm kê kho', icon: ClipboardCheck, visible: isInventoryOrOwner },
    { to: '/owner/recipes', label: 'Công thức món (BOM)', icon: BookOpen, visible: isOwner },
    { to: '/inventory/purchases', label: 'Phiếu nhập hàng', icon: ShoppingBag, visible: isInventoryOrOwner },
  ]

  const renderNavLinks = (collapsed: boolean) => (
    <>
      {navItems
        .filter((item) => item.visible)
        .map((item) => {
          const Icon = item.icon
          if (item.isActiveOverride !== undefined) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                aria-current={item.isActiveOverride ? 'page' : undefined}
                className={() =>
                  getNavLinkClassName({ isActive: item.isActiveOverride!, collapsed })
                }
              >
                <Icon className="w-4 h-4 text-accent shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            )
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) => getNavLinkClassName({ isActive, collapsed })}
            >
              <Icon className="w-4 h-4 text-accent shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          )
        })}

      {/* Bottom Profile Link */}
      <NavLink
        to="/profile"
        title={collapsed ? 'Hồ sơ & Bảo mật' : undefined}
        className={({ isActive }) =>
          cn(
            getNavLinkClassName({ isActive, collapsed }),
            'mt-auto pt-2 border-t border-border'
          )
        }
      >
        <UserCog className="w-4 h-4 text-accent shrink-0" />
        {!collapsed && <span className="truncate">Hồ sơ & Bảo mật</span>}
      </NavLink>
    </>
  )

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="bg-primary text-white h-16 px-4 md:px-6 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="md:hidden p-2 -ml-1 rounded-lg text-white hover:bg-primary-hover transition-colors"
            aria-label="Mở menu điều hướng"
          >
            <Menu className="w-5 h-5" />
          </button>

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

        <div className="flex items-center gap-2 sm:gap-4">
          {(user?.role === 'SERVICE_STAFF' || user?.role === 'OWNER') && (
            <>
              <ReadyDishesPanel />
              <StaffCallPanel />
            </>
          )}
          <Link
            to="/profile"
            className="text-right text-xs hover:opacity-80 transition-opacity p-1 rounded hidden sm:block"
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
            <LogOut className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </Button>
        </div>
      </header>

      {/* Mobile Sidebar Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-64 max-w-[80vw] bg-card border-r border-border p-4 flex flex-col gap-1 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-primary flex items-center justify-center text-white">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-primary">ROMS Menu</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface transition-colors"
                aria-label="Đóng menu điều hướng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {renderNavLinks(false)}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Desktop Side Nav */}
        <aside
          className={cn(
            'hidden md:flex bg-card border-r border-border flex-col gap-1 transition-all duration-200 shrink-0',
            isCollapsed ? 'w-16 p-2' : 'w-56 p-4'
          )}
        >
          <div
            className={cn(
              'flex items-center mb-2 pb-2 border-b border-border/60',
              isCollapsed ? 'justify-center' : 'justify-between'
            )}
          >
            {!isCollapsed && (
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted px-1">
                Điều hướng
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="p-1.5 rounded-md text-muted hover:text-text hover:bg-surface transition-colors"
              title={isCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
              aria-label={isCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>

          {renderNavLinks(isCollapsed)}
        </aside>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
