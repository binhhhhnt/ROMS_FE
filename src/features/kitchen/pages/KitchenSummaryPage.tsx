import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Layers, CheckCircle2 } from 'lucide-react'

import { kitchenApi } from '@/features/kitchen/api/kitchenApi'
import type { OrderItemStatus } from '@/features/ordering/types/ordering.types'
import { subscribeToTopic } from '@/shared/lib/stomp'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { Button } from '@/shared/components/ui/button'
import {
  KitchenSummaryDishCard,
  type ConsolidatedDish,
  type ConsolidatedTableItem,
} from '@/features/kitchen/components/KitchenSummaryDishCard'
import { KitchenSummaryTableBreakdown } from '@/features/kitchen/components/KitchenSummaryTableBreakdown'

export function KitchenSummaryPage() {
  const queryClient = useQueryClient()
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState<string>(
    new Date().toLocaleTimeString('vi-VN')
  )

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('vi-VN'))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Query active kitchen orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['kitchen', 'orders', 'summary'],
    queryFn: () => kitchenApi.getKitchenOrders(),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  // Realtime STOMP Subscription
  useEffect(() => {
    const unsubKitchen = subscribeToTopic('/topic/kitchen/orders', () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen', 'orders'] })
    })

    return () => {
      unsubKitchen()
    }
  }, [queryClient])

  // Aggregate active items grouped by menuItemId and sorted by FIFO (oldest waiting first)
  const consolidatedDishes = useMemo(() => {
    const map = new Map<number, ConsolidatedDish>()

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.status === 'PENDING' || item.status === 'COOKING') {
          const tableItem: ConsolidatedTableItem = {
            orderId: order.id,
            itemId: item.id,
            tableId: order.tableId,
            tableCode: order.tableCode ?? null,
            quantity: item.quantity,
            status: item.status,
            note: item.note ?? null,
            createdAt: item.createdAt || order.createdAt,
          }

          const existing = map.get(item.menuItemId)
          if (!existing) {
            map.set(item.menuItemId, {
              menuItemId: item.menuItemId,
              menuItemName: item.menuItemName,
              totalQuantity: item.quantity,
              pendingQuantity: item.status === 'PENDING' ? item.quantity : 0,
              cookingQuantity: item.status === 'COOKING' ? item.quantity : 0,
              oldestCreatedAt: tableItem.createdAt,
              tableItems: [tableItem],
            })
          } else {
            existing.totalQuantity += item.quantity
            if (item.status === 'PENDING') {
              existing.pendingQuantity += item.quantity
            } else if (item.status === 'COOKING') {
              existing.cookingQuantity += item.quantity
            }
            if (new Date(tableItem.createdAt).getTime() < new Date(existing.oldestCreatedAt).getTime()) {
              existing.oldestCreatedAt = tableItem.createdAt
            }
            existing.tableItems.push(tableItem)
          }
        }
      })
    })

    // Sort dishes by oldestCreatedAt ascending (FIFO)
    const list = Array.from(map.values())
    list.sort(
      (a, b) => new Date(a.oldestCreatedAt).getTime() - new Date(b.oldestCreatedAt).getTime()
    )

    // For each dish, sort tableItems FIFO as well
    list.forEach((dish) => {
      dish.tableItems.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    })

    return list
  }, [orders])

  // Automatically keep selectedMenuItemId in sync with available dishes
  useEffect(() => {
    if (consolidatedDishes.length > 0) {
      const exists = consolidatedDishes.some((d) => d.menuItemId === selectedMenuItemId)
      if (!exists) {
        setSelectedMenuItemId(consolidatedDishes[0].menuItemId)
      }
    } else {
      setSelectedMenuItemId(null)
    }
  }, [consolidatedDishes, selectedMenuItemId])

  // Get currently selected dish
  const selectedDish = useMemo(() => {
    return consolidatedDishes.find((d) => d.menuItemId === selectedMenuItemId) || null
  }, [consolidatedDishes, selectedMenuItemId])

  // Summary statistics
  const totalDishesCount = consolidatedDishes.length
  const totalPortionsCount = useMemo(() => {
    return consolidatedDishes.reduce((sum, d) => sum + d.totalQuantity, 0)
  }, [consolidatedDishes])

  // Action: Update status for a specific table item
  const handleUpdateItemStatus = async (
    orderId: number,
    itemId: number,
    targetStatus: OrderItemStatus
  ) => {
    try {
      const order = orders.find((o) => o.id === orderId)
      const currentItem = order?.items.find((i) => i.id === itemId)
      if (currentItem?.status === 'PENDING' && targetStatus !== 'COOKING') {
        toast.error('Món chưa nấu, phải bắt đầu "Nấu" trước khi ra món!')
        return
      }

      await kitchenApi.updateOrderItemStatus(orderId, itemId, targetStatus)
      toast.success(
        targetStatus === 'READY'
          ? 'Đã báo món nấu xong (READY)!'
          : 'Đã nhận món vào chế biến (COOKING)!'
      )
      await queryClient.invalidateQueries({ queryKey: ['kitchen', 'orders'] })
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  // Action: Cook all pending portions of a dish
  const handleCookAllDish = async (dish: ConsolidatedDish) => {
    try {
      const pendingItems = dish.tableItems.filter((i) => i.status === 'PENDING')
      if (pendingItems.length === 0) {
        toast.info('Không có suất nào đang chờ nấu.')
        return
      }
      for (const item of pendingItems) {
        await kitchenApi.updateOrderItemStatus(item.orderId, item.itemId, 'COOKING')
      }
      toast.success(`Đã nhận nấu tất cả (${pendingItems.length} suất) món ${dish.menuItemName}!`)
      await queryClient.invalidateQueries({ queryKey: ['kitchen', 'orders'] })
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  // Action: Ready ONLY cooking portions of a dish across all tables
  const handleReadyAllDish = async (dish: ConsolidatedDish) => {
    try {
      const cookingItems = dish.tableItems.filter((i) => i.status === 'COOKING')
      if (cookingItems.length === 0) {
        toast.error('Chưa có suất nào đang nấu để ra món! Vui lòng bấm "Nấu" trước.')
        return
      }
      for (const item of cookingItems) {
        await kitchenApi.updateOrderItemStatus(item.orderId, item.itemId, 'READY')
      }
      toast.success(`Đã ra tất cả (${cookingItems.length} suất đang nấu) món ${dish.menuItemName}!`)
      await queryClient.invalidateQueries({ queryKey: ['kitchen', 'orders'] })
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-5 h-[calc(100vh-6rem)]">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-card px-5 py-4 rounded-xl border border-border shadow-xs shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-text tracking-tight flex items-center gap-2">
              <Layers className="w-6 h-6 text-primary" />
              TỔNG HỢP CHẾ BIẾN
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-primary text-white">
              {totalDishesCount} MÓN ({totalPortionsCount} SUẤT CẦN NẤU)
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Tổng hợp số lượng theo từng món ăn để gom mẻ chế biến cùng lúc. Chọn món để xem danh sách bàn cần phục vụ.
          </p>
        </div>

        {/* Live Clock & Link */}
        <div className="flex items-center gap-3">
          <Link
            to="/kitchen/ready"
            className="hidden md:inline-flex text-xs font-semibold text-status-ready hover:underline"
          >
            Quầy chờ bưng món →
          </Link>
          <div className="bg-surface border border-border px-3.5 py-1.5 rounded-lg text-right">
            <div className="text-[10px] text-muted font-bold uppercase tracking-wider">
              Thời gian
            </div>
            <div className="text-sm font-black text-primary font-mono">
              {currentTime}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 min-h-0">
          <div className="md:col-span-5 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-card border border-border rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="md:col-span-7 bg-card border border-border rounded-2xl animate-pulse h-full" />
        </div>
      ) : consolidatedDishes.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-16 text-center flex flex-col items-center justify-center flex-1 my-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-status-ready/15 text-status-ready flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-text mb-1">
            Không có món ăn nào đang chờ chế biến!
          </h2>
          <p className="text-xs text-muted max-w-md leading-relaxed mb-6">
            Bếp đã hoàn thành toàn bộ món ăn hoặc chưa có đơn đặt món mới từ khách. Các món đã nấu xong được chuyển sang Quầy chờ bưng.
          </p>
          <Link to="/kitchen/ready">
            <Button
              variant="primary"
              size="md"
              className="bg-status-ready hover:bg-emerald-600 font-bold"
            >
              Xem Quầy Chờ Bưng Món
            </Button>
          </Link>
        </div>
      ) : (
        /* Split Screen: Panel 1 (Left: Master Dishes List) & Panel 2 (Right: Table Breakdown) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
          {/* Panel 1: Danh sách tổng hợp món ăn */}
          <div className="lg:col-span-5 flex flex-col min-h-0 bg-surface/30 rounded-2xl p-2 sm:p-3 border border-border">
            <div className="flex items-center justify-between px-2 py-1.5 mb-2 text-xs font-bold text-muted uppercase tracking-wider">
              <span>Danh sách món cần nấu ({consolidatedDishes.length})</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {consolidatedDishes.map((dish) => (
                <KitchenSummaryDishCard
                  key={dish.menuItemId}
                  dish={dish}
                  isSelected={dish.menuItemId === selectedMenuItemId}
                  onSelect={() => setSelectedMenuItemId(dish.menuItemId)}
                  onCookAll={handleCookAllDish}
                  onReadyAll={handleReadyAllDish}
                />
              ))}
            </div>
          </div>

          {/* Panel 2: Chi tiết theo bàn */}
          <div className="lg:col-span-7 flex flex-col min-h-0">
            <KitchenSummaryTableBreakdown
              dish={selectedDish}
              onUpdateItemStatus={handleUpdateItemStatus}
            />
          </div>
        </div>
      )}
    </div>
  )
}
export default KitchenSummaryPage
