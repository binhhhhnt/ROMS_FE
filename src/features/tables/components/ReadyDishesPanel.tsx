import { Utensils, ArrowRight, CheckCircle2, X } from 'lucide-react'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { kitchenApi } from '@/features/kitchen/api/kitchenApi'
import { useReadyDishesStore, type ReadyDishItem } from '../store/readyDishesStore'
import { subscribeToTopic } from '@/shared/lib/stomp'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/utils/cn'

export function ReadyDishesPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const { readyItems, setReadyOrders, addReadyDish, removeReadyDish } = useReadyDishesStore()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Khởi tạo audio thông báo ra món
  useEffect(() => {
    audioRef.current = new Audio('/sounds/orderready.mp3')
    audioRef.current.volume = 0.7
  }, [])

  // 1. Fetch ban đầu danh sách các món đang READY từ Kitchen Orders
  const { data: kitchenOrders = [] } = useQuery({
    queryKey: ['readyDishesPanelOrders'],
    queryFn: () => kitchenApi.getKitchenOrders(),
    staleTime: 5000,
    refetchInterval: 15000,
  })

  // Đồng bộ orders lấy từ API vào Store
  useEffect(() => {
    if (kitchenOrders.length > 0) {
      setReadyOrders(kitchenOrders)
    }
  }, [kitchenOrders, setReadyOrders])

  // 2. Lắng nghe WebSocket STOMP
  useEffect(() => {
    // Topic Bếp ra món: /topic/service/ready-dishes
    const unsubReady = subscribeToTopic<ReadyDishItem>(
      '/topic/service/ready-dishes',
      (data) => {
        if (!data || !data.orderItemId) return
        addReadyDish(data)
        setIsOpen(true) // Tự mở panel để nhân viên chú ý
        audioRef.current?.play().catch(() => {
          // Bỏ qua nếu browser chặn autoplay trước khi có user interaction
        })
      }
    )

    // Topic cập nhật trạng thái đơn bếp (nếu món chuyển COMPLETED hoặc CANCELLED thì xóa khỏi panel)
    const unsubKitchen = subscribeToTopic<any>(
      '/topic/kitchen/orders',
      (event) => {
        if (!event) return
        // Nếu là event thay đổi item status sang COMPLETED hoặc CANCELLED
        if (
          event.orderItemId &&
          (event.newStatus === 'COMPLETED' || event.newStatus === 'CANCELLED')
        ) {
          removeReadyDish(event.orderItemId)
        }
      }
    )

    return () => {
      unsubReady()
      unsubKitchen()
    }
  }, [addReadyDish, removeReadyDish])

  // Gom các món sẵn sàng theo từng bàn và sắp xếp theo thời gian món mới nhất
  const groupedByTable = useMemo(() => {
    const map = new Map<
      number,
      { tableCode: string; items: ReadyDishItem[]; latestReadyAt: number }
    >()

    readyItems.forEach((item) => {
      const itemTime = item.readyAt ? new Date(item.readyAt).getTime() : 0
      if (!map.has(item.tableId)) {
        map.set(item.tableId, {
          tableCode: item.tableCode,
          items: [],
          latestReadyAt: itemTime,
        })
      }
      const entry = map.get(item.tableId)!
      entry.items.push(item)
      if (itemTime > entry.latestReadyAt) {
        entry.latestReadyAt = itemTime
      }
    })

    // Sắp xếp từng bàn: bàn nào có món ra gần nhất sẽ lên TRÊN CÙNG
    return Array.from(map.entries())
      .map(([tableId, val]) => ({
        tableId,
        tableCode: val.tableCode,
        items: val.items.sort(
          (a, b) =>
            new Date(b.readyAt || 0).getTime() - new Date(a.readyAt || 0).getTime()
        ),
        totalCount: val.items.reduce((sum, i) => sum + i.quantity, 0),
        latestReadyAt: val.latestReadyAt,
      }))
      .sort((a, b) => b.latestReadyAt - a.latestReadyAt)
  }, [readyItems])

  const totalReadyDishes = readyItems.reduce((sum, i) => sum + i.quantity, 0)

  const handleNavigateToTable = (tableId: number) => {
    setIsOpen(false)
    navigate(`/tables/${tableId}`)
  }

  return (
    <div className="relative">
      {/* Nút biểu tượng Món ra trên Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'relative p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          totalReadyDishes > 0
            ? 'text-status-ready bg-status-ready/10 hover:bg-status-ready/20 animate-pulse'
            : 'text-white/80 hover:bg-primary-hover hover:text-white'
        )}
        title="Món ăn chờ bưng ra bàn"
        aria-label="Món ăn chờ bưng ra bàn"
      >
        <Utensils className="w-5 h-5" />

        {totalReadyDishes > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-status-ready text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
            {totalReadyDishes > 9 ? '9+' : totalReadyDishes}
          </span>
        )}
      </button>

      {/* Dropdown Panel danh sách món sẵn sàng */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-full mt-2 w-88 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in-50 duration-200">
            {/* Header của Panel */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-status-ready" />
                <span className="font-semibold text-sm text-text">
                  Món ăn chờ bưng ({totalReadyDishes})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted hover:text-text p-1 rounded transition-colors"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Danh sách nhóm theo bàn */}
            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {groupedByTable.length === 0 ? (
                <div className="p-6 text-center text-muted text-sm">
                  <Utensils className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Hiện không có món nào đang chờ bưng
                </div>
              ) : (
                groupedByTable.map((group, idx) => (
                  <div
                    key={group.tableId}
                    className={cn(
                      'p-3.5 transition-colors',
                      idx % 2 === 0 ? 'bg-card hover:bg-surface/60' : 'bg-surface/35 hover:bg-surface/75'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-primary uppercase">
                          Bàn {group.tableCode}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-status-ready/15 text-status-ready">
                          {group.totalCount} món sẵn sàng
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleNavigateToTable(group.tableId)}
                        className="text-xs h-7 px-2 text-primary hover:bg-primary/10 gap-1 font-semibold"
                      >
                        Đến bàn
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <ul className="space-y-1.5 pl-2 border-l-2 border-status-ready/40">
                      {group.items.map((item, itemIdx) => (
                        <li
                          key={item.orderItemId}
                          className={cn(
                            'flex items-start justify-between text-xs py-1 px-1.5 rounded transition-colors',
                            itemIdx % 2 === 1 ? 'bg-surface/50' : 'bg-transparent'
                          )}
                        >
                          <div className="pr-2">
                            <span className="font-medium text-text">
                              {item.quantity}x {item.menuItemName}
                            </span>
                            {item.note && (
                              <p className="text-[10px] text-muted italic">
                                ({item.note})
                              </p>
                            )}
                          </div>
                          {item.readyAt && (
                            <span className="text-[10px] text-muted shrink-0">
                              {new Date(item.readyAt).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
