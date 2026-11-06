import { useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/app/store/authStore'
import { authApi } from '@/features/auth/api/authApi'
import { tableApi } from '@/features/tables/api/tableApi'
import { useAiChatStore } from '@/features/tables/store/aiChatStore'
import { useCartStore } from '@/features/ordering/store/cartStore'
import { subscribeToTopic } from '@/shared/lib/stomp'
import { Button } from '@/shared/components/ui/button'
import { CartItemCountBadge } from '@/features/ordering/components/CartItemCountBadge'
import { Utensils, ShoppingCart, Clock, LogOut, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export function TabletLayout() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const tableId = user?.tableId
  const prevSessionIdRef = useRef<number | null | undefined>(undefined)

  // Query current table information and session status
  const { data: table } = useQuery({
    queryKey: ['tabletTableInfo', tableId],
    queryFn: () => tableApi.getTableById(tableId!),
    enabled: !!tableId,
    refetchInterval: 5000,
  })

  const activeSessionId = table?.activeSessionId

  const resetTabletData = () => {
    useCartStore.getState().clearCart()
    useAiChatStore.getState().clearAll()
    queryClient.removeQueries({ queryKey: ['orders'] })
    queryClient.invalidateQueries({ queryKey: ['tabletTableInfo', tableId] })
  }

  // 1. Realtime STOMP Subscription for session closed event
  useEffect(() => {
    if (!activeSessionId) return

    const unsub = subscribeToTopic(
      `/topic/session/${activeSessionId}/orders`,
      (event: any) => {
        if (event?.status === 'CLOSED') {
          resetTabletData()
          toast.info('Phiên phục vụ của bàn đã kết thúc. Cảm ơn quý khách!')
          navigate('/tablet/welcome', { replace: true })
        }
      }
    )

    return () => {
      unsub()
    }
  }, [activeSessionId, tableId, navigate])

  // 2. Detection of session closing: fires ONLY when an active session transitions to closed/null
  useEffect(() => {
    if (prevSessionIdRef.current !== undefined) {
      if (prevSessionIdRef.current && !activeSessionId) {
        resetTabletData()
        toast.info('Phiên phục vụ của bàn đã kết thúc. Cảm ơn quý khách!')
        if (location.pathname !== '/tablet/welcome') {
          navigate('/tablet/welcome', { replace: true })
        }
      }
    }
    if (table !== undefined) {
      prevSessionIdRef.current = activeSessionId ?? null
    }
  }, [activeSessionId, table, location.pathname, navigate])

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore
    } finally {
      clearAuth()
      useAiChatStore.getState().clearAll()
      useCartStore.getState().clearCart()
      toast.success('Đã đăng xuất máy tính bảng')
      navigate('/login')
    }
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `relative inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:px-4 ${
      isActive
        ? 'bg-surface text-primary shadow-xs'
        : 'text-muted hover:bg-surface/50 hover:text-primary'
    }`

  return (
    <div className="min-h-screen bg-background text-text flex flex-col font-sans">
      {/* Tablet Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
          {/* Table Badge and Restaurant Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold shadow-sm">
              {user?.tableName || user?.tableId ? `B${user?.tableId}` : 'TB'}
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight text-primary">
                {user?.tableName ? `Bàn ${user.tableName}` : `Bàn #${user?.tableId || '—'}`}
              </h1>
              <p className="text-[11px] text-muted">Gọi món tại bàn · ROMS</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-wrap items-center gap-1 sm:gap-2" aria-label="Điều hướng gọi món">
            <NavLink to="/tablet/menu" className={navClass}>
              <Utensils className="h-4 w-4" aria-hidden="true" />
              <span>Thực đơn</span>
            </NavLink>
            <NavLink to="/tablet/ai-assistant" className={navClass}>
              <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
              <span>Trợ lý AI</span>
            </NavLink>
            <NavLink to="/tablet/cart" className={navClass}>
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              <span>Giỏ hàng</span>
              <CartItemCountBadge />
            </NavLink>
            <NavLink to="/tablet/orders" className={navClass}>
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span>Đơn hàng</span>
            </NavLink>
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
