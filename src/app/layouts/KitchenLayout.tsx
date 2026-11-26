import { useEffect, useRef, useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/app/store/authStore'
import { authApi } from '@/features/auth/api/authApi'
import { settingsApi } from '@/features/settings/api/settingsApi'
import { kitchenApi } from '@/features/kitchen/api/kitchenApi'
import { printKitchenOrderTicketViaBrowser } from '@/features/kitchen/utils/kitchenTicketPrinter'
import { useKdsSettingsStore, type KdsBellMode } from '@/features/kitchen/store/kdsSettingsStore'
import { subscribeToTopic } from '@/shared/lib/stomp'
import { Button } from '@/shared/components/ui/button'
import { ChefHat, LogOut, Flame, Layers, CheckCircle2, UtensilsCrossed, BookOpen, LayoutDashboard, Menu, X, SlidersHorizontal, BellRing } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { handleNumericKeyDown, handleNumericPaste } from '@/shared/utils/numericInput'

const BELL_COOLDOWN_MS = 1000
const MAX_NOTIFIED_ORDER_IDS = 200

interface PendingBellOrder {
  orderId: number
  tableName: string
  totalItems: number
}

const BELL_MODE_OPTIONS: { value: KdsBellMode; label: string; description: string }[] = [
  {
    value: 'single',
    label: 'Kêu 1 lần khi có đơn mới',
    description: 'Phát tiếng chuông 1 lần mỗi khi có order mới gửi vào bếp.',
  },
  {
    value: 'until_ok',
    label: 'Kêu liên tục đến khi bấm OK',
    description: 'Chuông lặp liên tục và hiện popup xác nhận cho tới khi bếp bấm OK.',
  },
  {
    value: 'off',
    label: 'Tắt chuông',
    description: 'Không phát âm thanh khi có đơn mới (danh sách đơn vẫn tự cập nhật).',
  },
]

export function KitchenLayout() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [pendingBellOrders, setPendingBellOrders] = useState<PendingBellOrder[]>([])
  const { overdueMinutes, setOverdueMinutes, bellMode, setBellMode } = useKdsSettingsStore()
  const bellModeRef = useRef<KdsBellMode>(bellMode)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastPlayedAtRef = useRef<number>(0)
  const notifiedOrderIdsRef = useRef<Set<number>>(new Set())

  const { data: settings } = useQuery({
    queryKey: ['restaurant-settings'],
    queryFn: () => settingsApi.getSettings(),
  })
  const settingsRef = useRef(settings)
  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  const stopBellAudio = () => {
    if (!audioRef.current) return
    audioRef.current.pause()
    audioRef.current.loop = false
    audioRef.current.currentTime = 0
  }

  useEffect(() => {
    bellModeRef.current = bellMode
    if (bellMode !== 'until_ok') {
      stopBellAudio()
      setPendingBellOrders([])
    }
  }, [bellMode])

  useEffect(() => {
    setIsSidebarOpen(false)
  }, [location.pathname])

  // Khởi tạo audio thông báo order mới vào bếp
  useEffect(() => {
    const audio = new Audio('/sounds/bell.mp3')
    audio.volume = 0.7
    audio.preload = 'auto'
    audioRef.current = audio

    return () => {
      audio.pause()
      audio.loop = false
    }
  }, [])

  // Realtime STOMP Subscription at layout level to keep kitchen queries in sync across tabs
  useEffect(() => {
    const unsub = subscribeToTopic<Record<string, unknown>>(
      '/topic/kitchen/orders',
      (event) => {
        queryClient.invalidateQueries({ queryKey: ['kitchen', 'orders'] })

        const isNewKitchenOrder =
          Boolean(event) &&
          typeof event === 'object' &&
          typeof event.totalItems === 'number' &&
          typeof event.orderId === 'number' &&
          !('oldStatus' in event) &&
          !('orderItemId' in event)

        if (!isNewKitchenOrder) return

        const orderId = event.orderId as number
        if (notifiedOrderIdsRef.current.has(orderId)) return
        notifiedOrderIdsRef.current.add(orderId)
        if (notifiedOrderIdsRef.current.size > MAX_NOTIFIED_ORDER_IDS) {
          const oldestOrderId = notifiedOrderIdsRef.current.values().next().value
          if (oldestOrderId !== undefined) {
            notifiedOrderIdsRef.current.delete(oldestOrderId)
          }
        }

        const currentBellMode = bellModeRef.current
        if (currentBellMode === 'single') {
          const now = Date.now()
          if (audioRef.current && now - lastPlayedAtRef.current >= BELL_COOLDOWN_MS) {
            lastPlayedAtRef.current = now
            audioRef.current.loop = false
            audioRef.current.currentTime = 0
            audioRef.current.play().catch(() => {
              // Bỏ qua nếu browser chặn autoplay trước khi có user interaction
            })
          }
        } else if (currentBellMode === 'until_ok') {
          const tableName =
            typeof event.tableName === 'string' && event.tableName.trim()
              ? event.tableName
              : typeof event.tableId === 'number'
                ? `Bàn #${event.tableId}`
                : 'Bàn mới'
          const totalItems = event.totalItems as number

          setPendingBellOrders((prev) =>
            prev.some((o) => o.orderId === orderId)
              ? prev
              : [...prev, { orderId, tableName, totalItems }]
          )

          if (audioRef.current && (audioRef.current.paused || !audioRef.current.loop)) {
            audioRef.current.loop = true
            audioRef.current.currentTime = 0
            audioRef.current.play().catch(() => {
              // Bỏ qua nếu browser chặn autoplay trước khi có user interaction
            })
          }
        }

        const currentSettings = settingsRef.current
        if (currentSettings?.printKitchenOrderTicket) {
          kitchenApi
            .getKitchenOrderById(orderId)
            .then((order) => {
              const activeItems = order.items.filter(
                (i) => i.status === 'PENDING' || i.status === 'COOKING'
              )
              if (activeItems.length === 0) return
              printKitchenOrderTicketViaBrowser({
                tableCode: order.tableCode || `Bàn #${order.tableId}`,
                orderId: order.id,
                orderCreatedAt: order.createdAt,
                items: activeItems.map((i) => ({
                  itemName: i.menuItemName,
                  quantity: i.quantity,
                  note: i.note,
                })),
                paperSize:
                  (currentSettings.readyTicketPaperSize as 'K80' | 'K58' | 'A5') || 'K80',
              })
            })
            .catch(() => {
              // Bỏ qua nếu không tải được chi tiết đơn để in tự động
            })
        }
      }
    )

    return () => {
      unsub()
    }
  }, [queryClient])

  const handleAcknowledgeBell = () => {
    stopBellAudio()
    setPendingBellOrders([])
  }

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
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-1 rounded-lg text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Mở menu & cài đặt KDS"
            title="Cài đặt KDS"
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

      {/* KDS Left Sidebar Drawer (Navigation on mobile + Local Settings) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] bg-card border-r border-border p-4 flex flex-col gap-1 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-primary flex items-center justify-center text-white">
                  <ChefHat className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-primary">ROMS KDS</span>
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface transition-colors cursor-pointer"
                aria-label="Đóng cài đặt KDS"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="lg:hidden flex flex-col gap-1 pb-3 mb-3 border-b border-border">
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
            </div>

            {/* KDS Local Settings (saved in localStorage) */}
            <div className="space-y-4 pt-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
                <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                <span>Cài đặt hiển thị KDS</span>
              </div>

              <div className="p-3 rounded-lg border border-border bg-surface/40 space-y-2">
                <label
                  htmlFor="kds-overdue-minutes"
                  className="block text-xs font-semibold text-text"
                >
                  Cảnh báo đơn quá giờ (phút)
                </label>
                <input
                  id="kds-overdue-minutes"
                  type="number"
                  min={1}
                  max={180}
                  value={overdueMinutes}
                  onKeyDown={(e) => handleNumericKeyDown(e, 'integer')}
                  onPaste={(e) => handleNumericPaste(e, 'integer')}
                  onChange={(e) => {
                    const parsed = Number(e.target.value)
                    if (!Number.isNaN(parsed) && parsed >= 0) {
                      setOverdueMinutes(parsed)
                    }
                  }}
                  className="w-full px-3 py-1.5 text-sm font-mono font-semibold bg-card border border-border rounded-md text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-[11px] text-muted leading-relaxed">
                  Card đơn ở màn Chế biến chưa hoàn thành sẽ tự động chuyển sang màu đỏ khi vượt quá số phút này (lưu trên trình duyệt).
                </p>
              </div>

              <div className="p-3 rounded-lg border border-border bg-surface/40 space-y-2.5">
                <span className="block text-xs font-semibold text-text">
                  Chế độ chuông báo đơn mới
                </span>
                <div className="space-y-2">
                  {BELL_MODE_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={cn(
                        'flex items-start gap-2.5 p-2 rounded-md border cursor-pointer transition-colors',
                        bellMode === option.value
                          ? 'bg-primary/10 border-primary'
                          : 'bg-card border-border hover:border-primary/40'
                      )}
                    >
                      <input
                        type="radio"
                        name="kds-bell-mode"
                        value={option.value}
                        checked={bellMode === option.value}
                        onChange={() => setBellMode(option.value)}
                        className="mt-0.5 accent-primary"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-text leading-snug">
                          {option.label}
                        </div>
                        <div className="text-[11px] text-muted leading-snug mt-0.5">
                          {option.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Mode 'until_ok': Persistent Order Alert Modal */}
      {pendingBellOrders.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card border-2 border-red-500 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 animate-bounce">
                <BellRing className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text">
                  Có đơn mới vào bếp!
                </h2>
                <p className="text-xs text-muted">
                  Chuông sẽ tiếp tục kêu cho đến khi bếp bấm xác nhận bên dưới.
                </p>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto divide-y divide-border rounded-lg border border-border bg-surface/40">
              {pendingBellOrders.map((order) => (
                <div
                  key={order.orderId}
                  className="px-3.5 py-2.5 flex items-center justify-between text-sm"
                >
                  <span className="font-bold text-text">
                    {order.tableName} <span className="font-mono text-xs text-muted">#{order.orderId}</span>
                  </span>
                  <span className="text-xs font-semibold text-primary">
                    {order.totalItems} món
                  </span>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={handleAcknowledgeBell}
              className="w-full h-12 text-base font-bold bg-red-600 hover:bg-red-700 text-white"
            >
              OK / Đã nhận đơn
            </Button>
          </div>
        </div>
      )}

      {/* KDS Main Screen */}
      <main className="flex-1 p-4 md:p-6 overflow-auto bg-background min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
