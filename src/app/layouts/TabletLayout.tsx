import { useEffect, useRef } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/app/store/authStore'
import { authApi } from '@/features/auth/api/authApi'
import { tableApi } from '@/features/tables/api/tableApi'
import { useAiChatStore } from '@/features/tables/store/aiChatStore'
import { useCartStore } from '@/features/ordering/store/cartStore'
import { subscribeToTopic } from '@/shared/lib/stomp'
import { Button } from '@/shared/components/ui/button'
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
