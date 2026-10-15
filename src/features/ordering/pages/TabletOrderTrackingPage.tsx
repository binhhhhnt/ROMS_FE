import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { RefreshCw, Utensils, Clock, AlertCircle } from 'lucide-react'

import { useAuthStore } from '@/app/store/authStore'
import { orderApi } from '@/features/ordering/api/orderApi'
import type {
  OrderResponse,
  OrderItemResponse,
  OrderStatus,
} from '@/features/ordering/types/ordering.types'
import { subscribeToTopic } from '@/shared/lib/stomp'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { OrderProgressCard } from '@/features/ordering/components/OrderProgressCard'
import { CancelItemModal } from '@/features/ordering/components/CancelItemModal'
import { Button } from '@/shared/components/ui/button'

export function TabletOrderTrackingPage() {
  const { user } = useAuthStore()
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL')

  // Cancel modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    type: 'item' | 'order'
    orderId: number
    item?: OrderItemResponse
  }>({
    isOpen: false,
    type: 'item',
    orderId: 0,
  })
  const [isCancelling, setIsCancelling] = useState(false)

  // Query orders for current tablet
  const {
    data: orders = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['orders', 'tablet', user?.tableId],
    queryFn: () => orderApi.getOrders(),
  })

  // Realtime STOMP Subscription
  useEffect(() => {
    // Subscribe to session topic (session 1 or dynamic)
    const unsubscribeSession = subscribeToTopic(
      '/topic/session/1/orders',
      () => {
        refetch()
      }
    )

    return () => {
      unsubscribeSession()
    }
  }, [refetch])

  // Open cancel modal for single item
  const handleOpenCancelItem = (orderId: number, item: OrderItemResponse) => {
    setModalState({
      isOpen: true,
      type: 'item',
      orderId,
      item,
    })
  }

  // Open cancel modal for entire order
  const handleOpenCancelOrder = (order: OrderResponse) => {
    setModalState({
      isOpen: true,
      type: 'order',
      orderId: order.id,
    })
  }

  // Execute cancel request
  const handleConfirmCancel = async (reason: string) => {
    setIsCancelling(true)
    try {
      if (modalState.type === 'item' && modalState.item) {
        await orderApi.cancelOrderItem(
          modalState.orderId,
          modalState.item.id,
          reason
        )
        toast.success(`Đã hủy món "${modalState.item.menuItemName}" thành công!`)
      } else if (modalState.type === 'order') {
        await orderApi.cancelOrder(modalState.orderId, reason)
        toast.success(`Đã hủy đơn hàng #${modalState.orderId} thành công!`)
      }
      await refetch()
    } catch (err) {
      const msg = getApiErrorMessage(err)
      toast.error(msg)
    } finally {
      setIsCancelling(false)
      setModalState((prev) => ({ ...prev, isOpen: false }))
    }
  }

  // Filter orders by status tab
  const filteredOrders = orders.filter((order) => {
    if (selectedFilter === 'ALL') return true
    return order.status === selectedFilter
  })

  const filterTabs = [
    { label: 'Tất cả', value: 'ALL', count: orders.length },
    {
      label: 'Chờ tiếp nhận',
      value: 'PENDING',
      count: orders.filter((o) => o.status === 'PENDING').length,
    },
    {
      label: 'Đang nấu',
      value: 'COOKING',
      count: orders.filter((o) => o.status === 'COOKING').length,
    },
    {
      label: 'Hoàn thành',
      value: 'COMPLETED',
      count: orders.filter((o) => o.status === 'COMPLETED').length,
    },
    {
      label: 'Đã hủy',
      value: 'CANCELLED',
      count: orders.filter((o) => o.status === 'CANCELLED').length,
    },
  ]

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-text flex items-center gap-2">
            <Clock className="w-6 h-6 text-accent" />
            Theo dõi trạng thái món ăn
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Cập nhật tiến độ chế biến và phục vụ tại{' '}
            <strong className="text-text font-semibold">
              {user?.tableName ? `Bàn ${user.tableName}` : `Bàn #${user?.tableId || 'T01'}`}
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="text-xs h-9"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 mr-1.5 ${
                isRefetching ? 'animate-spin' : ''
              }`}
            />
            Làm mới
          </Button>

          <Link to="/tablet/menu">
            <Button variant="primary" size="sm" className="text-xs h-9 font-semibold">
              <Utensils className="w-3.5 h-3.5 mr-1.5" />
              Gọi thêm món
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border">
        {filterTabs.map((tab) => {
          const isActive = selectedFilter === tab.value
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setSelectedFilter(tab.value as OrderStatus | 'ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted hover:bg-surface/50 hover:text-text'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-muted-bg text-muted'
                }`}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Main List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted">Đang tải danh sách đơn món ăn...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center flex flex-col items-center justify-center my-6">
          <div className="w-16 h-16 rounded-full bg-surface/60 flex items-center justify-center text-accent mb-3">
            <AlertCircle className="w-8 h-8 text-muted" />
          </div>
          <h3 className="text-base font-bold text-text mb-1">
            Không tìm thấy đơn hàng nào
          </h3>
          <p className="text-xs text-muted max-w-sm mb-5">
            {selectedFilter === 'ALL'
              ? 'Bàn của bạn hiện chưa gửi đơn món ăn nào. Hãy xem thực đơn để bắt đầu gọi món nhé!'
              : 'Không có đơn hàng nào ở trạng thái này.'}
          </p>
          <Link to="/tablet/menu">
            <Button variant="primary" size="md" className="font-semibold shadow-sm">
              <Utensils className="w-4 h-4 mr-2" />
              Xem thực đơn gọi món
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {filteredOrders.map((order) => (
            <OrderProgressCard
              key={order.id}
              order={order}
              onCancelItem={handleOpenCancelItem}
              onCancelOrder={handleOpenCancelOrder}
            />
          ))}
        </div>
      )}

      {/* Cancel Item / Order Modal */}
      <CancelItemModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmCancel}
        title={
          modalState.type === 'item'
            ? 'Xác nhận hủy món ăn'
            : `Xác nhận hủy toàn bộ đơn #${modalState.orderId}`
        }
        itemName={modalState.item?.menuItemName}
        isLoading={isCancelling}
      />
    </div>
  )
}
export default TabletOrderTrackingPage
