import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Clock,
  Play,
  ArrowRightLeft,
  CheckCircle,
  AlertCircle,
  CheckCircle2,
  Receipt,
  Plus,
  PackageOpen,
} from 'lucide-react'
import { toast } from 'sonner'

import { tableApi } from '@/features/tables/api/tableApi'
import { orderApi } from '@/features/ordering/api/orderApi'
import { kitchenApi } from '@/features/kitchen/api/kitchenApi'
import { subscribeToTopic } from '@/shared/lib/stomp'
import { TransferTableModal } from '@/features/tables/components/TransferTableModal'
import { StaffOrderModal } from '@/features/ordering/components/StaffOrderModal'
import { TableItemReturnModal } from '@/features/ordering/components/TableItemReturnModal'
import { CancelItemModal } from '@/features/ordering/components/CancelItemModal'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { useReadyDishesStore } from '@/features/tables/store/readyDishesStore'
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'

export function TableDetailPage() {
  const { tableId } = useParams<{ tableId: string }>()
  const id = Number(tableId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)

  const [servingItemId, setServingItemId] = useState<number | null>(null)
  const [isServingAll, setIsServingAll] = useState(false)

  // Target for cancelling an Order or an OrderItem
  const [cancelTarget, setCancelTarget] = useState<
    | { type: 'ORDER'; orderId: number }
    | { type: 'ITEM'; orderId: number; itemId: number; itemName: string; maxQuantity: number }
    | null
  >(null)
  const [isCancelling, setIsCancelling] = useState(false)

  // Fetch table detail
  const {
    data: table,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tableDetail', id],
    queryFn: () => tableApi.getTableById(id),
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: 'always',
  })

  // Fetch all tables to get empty ones for transfer
  const { data: allTablesData } = useQuery({
    queryKey: ['allTablesList'],
    queryFn: () => tableApi.getTables({ size: 100 }),
    enabled: isTransferModalOpen,
  })

  // Fetch active session detail if present
  const activeSessionId = table?.activeSessionId
  const { data: sessionDetail } = useQuery({
    queryKey: ['sessionDetail', activeSessionId],
    queryFn: () => tableApi.getSessionById(activeSessionId!),
    enabled: !!activeSessionId,
    staleTime: 0,
    refetchOnMount: 'always',
  })

  // Fetch orders for active session
  const {
    data: sessionOrders = [],
    isLoading: isOrdersLoading,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['sessionOrders', activeSessionId],
    queryFn: () =>
      activeSessionId ? orderApi.getOrders(activeSessionId) : Promise.resolve([]),
    enabled: !!activeSessionId,
    staleTime: 0,
    refetchOnMount: 'always',
  })

  // Realtime STOMP Subscription
  useEffect(() => {
    if (!activeSessionId) return

    const unsubSession = subscribeToTopic<{ newStatus?: string; itemName?: string }>(
      `/topic/session/${activeSessionId}/orders`,
      (payload) => {
        refetchOrders()
        if (payload?.newStatus === 'READY') {
          toast.success(
            `Bàn ${table?.tableCode}: Món "${payload.itemName || 'Món ăn'}" đã nấu xong, hãy bưng ra bàn!`,
            { duration: 8000 }
          )
        }
      }
    )

    const unsubKitchen = subscribeToTopic('/topic/kitchen/orders', () => {
      refetchOrders()
    })

    return () => {
      unsubSession()
      unsubKitchen()
    }
  }, [activeSessionId, refetchOrders, table?.tableCode])

  // Extract all READY items waiting to be served
  const allReadyItems = useMemo(() => {
    const list: {
      orderId: number
      itemId: number
      itemName: string
      quantity: number
    }[] = []
    sessionOrders.forEach((o) => {
      o.items.forEach((item) => {
        if (item.status === 'READY') {
          list.push({
            orderId: o.id,
            itemId: item.id,
            itemName: item.menuItemName,
            quantity: item.quantity,
          })
        }
      })
    })
    return list
  }, [sessionOrders])

  // Handle serving an individual item to table
  const handleCompleteItem = async (
    orderId: number,
    itemId: number
  ) => {
    setServingItemId(itemId)
    try {
      await kitchenApi.updateOrderItemStatus(orderId, itemId, 'COMPLETED')
      useReadyDishesStore.getState().removeReadyDish(itemId)
      await refetchOrders()
      queryClient.invalidateQueries({ queryKey: ['tablesOverview'] })
      queryClient.invalidateQueries({ queryKey: ['tablesOverviewReadyOrders'] })
      queryClient.invalidateQueries({ queryKey: ['readyDishesPanelOrders'] })
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setServingItemId(null)
    }
  }

  // Handle serving all ready items to table
  const handleCompleteAllReady = async () => {
    if (allReadyItems.length === 0) return
    setIsServingAll(true)
    try {
      const { removeReadyDish } = useReadyDishesStore.getState()
      for (const item of allReadyItems) {
        await kitchenApi.updateOrderItemStatus(
          item.orderId,
          item.itemId,
          'COMPLETED'
        )
        removeReadyDish(item.itemId)
      }
      await refetchOrders()
      queryClient.invalidateQueries({ queryKey: ['tablesOverview'] })
      queryClient.invalidateQueries({ queryKey: ['tablesOverviewReadyOrders'] })
      queryClient.invalidateQueries({ queryKey: ['readyDishesPanelOrders'] })
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsServingAll(false)
    }
  }

  // Handle cancellation for Order or Item
  const handleCancelConfirm = async (reason: string, quantity?: number) => {
    if (!cancelTarget) return
    setIsCancelling(true)
    try {
      if (cancelTarget.type === 'ORDER') {
        await orderApi.cancelOrder(cancelTarget.orderId, reason)
        toast.success(
          `Đã hủy đơn hàng #${cancelTarget.orderId} thành công, nguyên liệu đã được hoàn lại vào kho!`
        )
      } else {
        await orderApi.cancelOrderItem(
          cancelTarget.orderId,
          cancelTarget.itemId,
          reason,
          quantity
        )
        toast.success(
          quantity && quantity < cancelTarget.maxQuantity
            ? `Đã hủy ${quantity} phần "${cancelTarget.itemName}" thành công, nguyên liệu đã được hoàn lại!`
            : `Đã hủy món "${cancelTarget.itemName}" thành công, nguyên liệu đã được hoàn lại!`
        )
      }
      await refetchOrders()
      refetch()
      queryClient.invalidateQueries({ queryKey: ['tablesOverview'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    } catch (err) {
      toast.error(getApiErrorMessage(err) || 'Không thể hủy. Vui lòng thử lại.')
    } finally {
      setIsCancelling(false)
      setCancelTarget(null)
    }
  }

  // Fetch transfer history if active session exists
  const { data: transferHistory } = useQuery({
    queryKey: ['sessionTransfers', activeSessionId],
    queryFn: () => tableApi.getTransferHistory(activeSessionId!),
    enabled: !!activeSessionId,
  })

  // Open session mutation
  const openSessionMutation = useMutation({
    mutationFn: () => tableApi.openSession(id),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['tableDetail', id] })
      queryClient.invalidateQueries({ queryKey: ['tablesOverview'] })
      toast.success(`Đã mở phiên phục vụ ${session.sessionCode || `#${session.id}`} cho Bàn ${session.tableCode}!`)
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err))
    },
  })

  // Check order status before close / checkout
  const hasUnfinishedDishes = useMemo(() => {
    return sessionOrders.some(
      (o) =>
        o.status === 'PENDING' ||
        o.status === 'COOKING' ||
        o.items?.some(
          (i) => i.status === 'PENDING' || i.status === 'COOKING' || i.status === 'READY'
        )
    )
  }, [sessionOrders])

  // Check if session has any non-cancelled order/dishes that need checkout
  const hasBillableOrders = useMemo(() => {
    return sessionOrders.some(
      (order) =>
        order.status !== 'CANCELLED' &&
        order.items?.some((item) => item.status !== 'CANCELLED')
    )
  }, [sessionOrders])

  // Extract all returned direct-sale items across session orders
  const aggregatedReturnedItems = useMemo(() => {
    const map = new Map<
      number,
      {
        menuItemId: number
        menuItemName: string
        totalReturned: number
        unitPrice: number
        totalDeduction: number
        orders: number[]
      }
    >()

    sessionOrders.forEach((o) => {
      o.items?.forEach((item) => {
        const retQty = item.returnedQuantity ?? item.returned_quantity ?? 0
        if (retQty > 0) {
          let entry = map.get(item.menuItemId)
          if (!entry) {
            entry = {
              menuItemId: item.menuItemId,
              menuItemName: item.menuItemName,
              totalReturned: 0,
              unitPrice: item.unitPrice,
              totalDeduction: 0,
              orders: [],
            }
            map.set(item.menuItemId, entry)
          }
          entry.totalReturned += retQty
          entry.totalDeduction += retQty * item.unitPrice
          if (!entry.orders.includes(o.id)) {
            entry.orders.push(o.id)
          }
        }
      })
    })

    return Array.from(map.values())
  }, [sessionOrders])

  const handleOpenCheckout = () => {
    if (hasUnfinishedDishes) {
      toast.error(
        'Bàn vẫn còn món chưa hoàn thành (đang chờ, đang nấu hoặc chưa bưng ra bàn). Vui lòng hoàn tất hoặc hủy trước khi thanh toán!',
        { duration: 6000 }
      )
      return
    }
    if (activeSessionId) {
      navigate(`/sessions/${activeSessionId}/checkout`, {
        state: { from: `/tables/${id}`, tableCode: table?.tableCode },
      })
    }
  }

  const handleOpenCloseConfirm = () => {
    if (hasUnfinishedDishes) {
      toast.error(
        'Bàn vẫn còn món chưa hoàn thành (đang chờ, đang nấu hoặc chưa bưng ra bàn). Vui lòng hoàn tất hoặc hủy trước khi đóng phiên!',
        { duration: 6000 }
      )
      return
    }
    setIsCloseConfirmOpen(true)
  }

  // Close session mutation
  const closeSessionMutation = useMutation({
    mutationFn: () => tableApi.closeSession(activeSessionId!),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['tableDetail', id] })
      queryClient.invalidateQueries({ queryKey: ['tablesOverview'] })
      toast.success(`Đã đóng phiên phục vụ ${session.sessionCode || `#${session.id}`} thành công!`)
      navigate('/tables', { replace: true })
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err))
    },
  })

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(val)
  }

  if (isLoading) {
    return (
      <div className="py-20 text-center text-muted">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Đang tải thông tin chi tiết bàn...
      </div>
    )
  }

  if (isError || !table) {
    return (
      <div className="py-16 text-center text-status-cancelled flex flex-col items-center gap-3">
        <AlertCircle className="w-8 h-8" />
        <p className="font-semibold text-sm">Không tìm thấy thông tin bàn ăn</p>
        <span className="text-xs text-muted">{getApiErrorMessage(error)}</span>
        <Button variant="outline" size="sm" onClick={() => navigate('/tables')}>
          Quay lại danh sách bàn
        </Button>
      </div>
    )
  }

  const isOccupied = table.realtimeStatus === 'OCCUPIED'
  const isEmpty = table.realtimeStatus === 'EMPTY' && table.isActive
  const transfers = transferHistory?.content || []

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto text-left pb-12">
      {/* Tầng 1: Top Navigation */}
      <div>
        <Link to="/tables" className="inline-block">
          <Button type="button" variant="outline" size="sm" className="h-9 px-3 text-xs font-medium gap-1.5">
            <ArrowLeft className="w-4 h-4 shrink-0" />
            Quay lại Sơ đồ bàn
          </Button>
        </Link>
      </div>

      {/* Tầng 2: Main Table & Session Card (Single Container, Flat) */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold text-text">
                Bàn {table.tableCode}
              </h1>
              {isOccupied ? (
                <Badge variant="cooking">
                  <span className="w-2 h-2 rounded-full bg-status-cooking shrink-0" />
                  Đang có khách
                </Badge>
              ) : isEmpty ? (
                <Badge variant="ready">
                  <span className="w-2 h-2 rounded-full bg-status-ready shrink-0" />
                  Bàn trống
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted">
                  <span className="w-2 h-2 rounded-full bg-muted shrink-0" />
                  Tạm ngừng phục vụ
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted mt-1">
              {table.area ? `${table.area} • ` : ''}Sức chứa {table.capacity} khách
            </p>
          </div>
        </div>

        {/* Empty State */}
        {isEmpty && (
          <div className="p-6 text-center flex flex-col items-center gap-3">
            <div>
              <h3 className="text-sm font-semibold text-text">Bàn hiện đang trống</h3>
              <p className="text-xs text-muted mt-0.5">
                Mở phiên phục vụ để bắt đầu ghi nhận gọi món cho khách tại bàn này.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => openSessionMutation.mutate()}
              isLoading={openSessionMutation.isPending}
              className="h-11 px-5 text-sm font-semibold"
            >
              <Play className="w-4 h-4 mr-1.5 fill-current" />
              Mở phiên phục vụ ngay
            </Button>
          </div>
        )}

        {/* Occupied Session Strip + Actions */}
        {isOccupied && (
          <div className="px-4 py-3.5 sm:px-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-sm font-semibold text-text font-mono">
                  Phiên {sessionDetail?.sessionCode || table?.activeSessionCode || `#${activeSessionId}`}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-muted">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  Mở lúc{' '}
                  {sessionDetail?.openedAt
                    ? new Date(sessionDetail.openedAt).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                    : 'Vừa xong'}
                </span>
                {sessionDetail?.openedByName && (
                  <span className="text-xs text-muted">
                    • {sessionDetail.openedByName}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsOrderModalOpen(true)}
                className="h-9 px-3.5 text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Đặt món
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReturnModalOpen(true)}
                className="h-9 px-3 text-xs"
              >
                <PackageOpen className="w-3.5 h-3.5 mr-1" />
                Kiểm đồ
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTransferModalOpen(true)}
                className="h-9 px-3 text-xs"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 mr-1" />
                Chuyển bàn
              </Button>

              {hasBillableOrders ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenCheckout}
                  className="h-9 px-3 text-xs font-semibold text-primary border-primary/40 hover:bg-muted-bg"
                >
                  <Receipt className="w-3.5 h-3.5 mr-1" />
                  Thanh toán
                </Button>
              ) : (
                <Button
                  variant="destructiveOutline"
                  size="sm"
                  onClick={handleOpenCloseConfirm}
                  isLoading={closeSessionMutation.isPending}
                  className="h-9 px-3 text-xs"
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  Đóng phiên
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tầng 3: Nội dung phiên đang phục vụ */}
      {isOccupied && (
        <div className="flex flex-col gap-5">
          {/* Ready Dishes Banner */}
          {allReadyItems.length > 0 && (
            <div className="bg-card border border-border border-l-4 border-l-status-ready rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm text-text">
                  Có {allReadyItems.reduce((s, i) => s + i.quantity, 0)} suất món đã nấu xong
                </div>
                <p className="text-xs text-muted mt-0.5">
                  Sẵn sàng bưng ra phục vụ Bàn {table.tableCode}.
                </p>
              </div>

              {allReadyItems.length > 1 && (
                <Button
                  variant="primary"
                  onClick={handleCompleteAllReady}
                  disabled={isServingAll}
                  className="h-11 px-4 text-sm font-semibold shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Bưng tất cả ({allReadyItems.length} món)
                </Button>
              )}
            </div>
          )}

          {/* Returned Items Summary Card */}
          {aggregatedReturnedItems.length > 0 && (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 sm:px-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-sm text-text">
                    Hàng đã trả lại kho ({aggregatedReturnedItems.reduce((sum, item) => sum + item.totalReturned, 0)} món)
                  </h4>
                  <p className="text-xs text-muted mt-0.5">
                    Đã hoàn kho và trừ trực tiếp vào hóa đơn bàn.
                  </p>
                </div>
                <div className="text-left sm:text-right shrink-0 tabular-nums">
                  <span className="text-xs text-muted block">Tổng giảm trừ</span>
                  <span className="text-sm font-bold font-mono text-status-cancelled">
                    -{formatPrice(aggregatedReturnedItems.reduce((sum, item) => sum + item.totalDeduction, 0))}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface/60 text-muted font-medium border-b border-border">
                    <tr>
                      <th className="py-2.5 px-4 sm:px-5">Tên món</th>
                      <th className="py-2.5 px-3 text-center">SL trả</th>
                      <th className="py-2.5 px-3 text-right">Đơn giá</th>
                      <th className="py-2.5 px-4 sm:px-5 text-right">Giảm trừ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border tabular-nums">
                    {aggregatedReturnedItems.map((item) => (
                      <tr key={item.menuItemId}>
                        <td className="py-2.5 px-4 sm:px-5 font-medium text-text">
                          {item.menuItemName}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-semibold text-status-cancelled">
                          -{item.totalReturned}
                        </td>
                        <td className="py-2.5 px-3 text-right text-muted font-mono">
                          {formatPrice(item.unitPrice)}
                        </td>
                        <td className="py-2.5 px-4 sm:px-5 text-right font-mono font-semibold text-status-cancelled">
                          -{formatPrice(item.totalDeduction)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Orders & Dishes Progress Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text">
                Danh sách đơn gọi món ({sessionOrders.length})
              </h2>
            </div>

            {isOrdersLoading ? (
              <div className="py-8 text-center text-xs text-muted bg-card border border-border rounded-lg">
                Đang tải danh sách món ăn của bàn...
              </div>
            ) : sessionOrders.length === 0 ? (
              <div className="text-center py-8 bg-card border border-dashed border-border rounded-lg text-xs text-muted">
                Chưa có đơn gọi món nào trong phiên phục vụ này.
              </div>
            ) : (
              <div className="space-y-4">
                {sessionOrders.map((order) => {
                  const isOrderPending = order.status === 'PENDING'

                  return (
                    <div
                      key={order.id}
                      className="border border-border rounded-lg overflow-hidden bg-card"
                    >
                      {/* Order Header (Hàng cha: nền bg-surface/60 tách biệt với cả nền trang lẫn OrderItem) */}
                      <div className="bg-surface/60 px-4 py-3 sm:px-5 border-b border-border flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                          <span className="font-bold text-sm text-text font-mono">
                            Đơn #{order.id}
                          </span>

                          {order.status === 'PENDING' && (
                            <Badge variant="pending">
                              <span className="w-2 h-2 rounded-full bg-status-pending shrink-0" />
                              Chờ tiếp nhận
                            </Badge>
                          )}
                          {order.status === 'COOKING' && (
                            <Badge variant="cooking">
                              <span className="w-2 h-2 rounded-full bg-status-cooking shrink-0" />
                              Đang nấu
                            </Badge>
                          )}
                          {order.status === 'COMPLETED' && (
                            <Badge variant="completed">
                              <span className="w-2 h-2 rounded-full bg-status-completed shrink-0" />
                              Hoàn thành
                            </Badge>
                          )}
                          {order.status === 'CANCELLED' && (
                            <Badge variant="cancelled">
                              <span className="w-2 h-2 rounded-full bg-status-cancelled shrink-0" />
                              Đã hủy
                            </Badge>
                          )}

                          <span className="text-muted">
                            • {order.createdByName || 'Khách tại bàn'} •{' '}
                            {new Date(order.createdAt).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-bold font-mono text-sm text-text tabular-nums">
                            {formatPrice(order.totalAmount)}
                          </span>

                          {isOrderPending && (
                            <Button
                              type="button"
                              variant="destructiveOutline"
                              size="sm"
                              onClick={() =>
                                setCancelTarget({
                                  type: 'ORDER',
                                  orderId: order.id,
                                })
                              }
                              className="h-8 px-2.5 text-xs"
                            >
                              Hủy đơn hàng
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Items List (Hàng con: nền trắng bg-card, thụt nhẹ trên desktop) */}
                      <div className="divide-y divide-border bg-card">
                        {order.items.map((item) => {
                          const isCancelled = item.status === 'CANCELLED'
                          return (
                            <div
                              key={item.id}
                              className={`px-4 py-3.5 sm:pl-7 sm:pr-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isCancelled ? 'opacity-60' : ''
                                }`}
                            >
                              {/* Trái: Số lượng (anchor) + Tên món + Ghi chú */}
                              <div className="min-w-0 flex-1 flex items-start gap-3">
                                <span className="font-mono font-bold text-base text-text shrink-0 w-9 pt-0.5 tabular-nums">
                                  {item.quantity}x
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div
                                    className={`font-semibold text-sm text-text ${isCancelled ? 'line-through text-muted' : ''
                                      }`}
                                  >
                                    {item.menuItemName}
                                  </div>
                                  {item.note && (
                                    <p className="text-xs text-text mt-1">
                                      <span className="font-semibold">Ghi chú:</span> {item.note}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Phải: Giá + Trạng thái/Thao tác */}
                              <div className="shrink-0 flex items-center justify-between sm:justify-end gap-4 pl-12 sm:pl-0">
                                <span className="font-semibold font-mono text-sm text-text tabular-nums shrink-0">
                                  {formatPrice(item.subtotal || item.unitPrice * item.quantity)}
                                </span>

                                <div className="shrink-0 flex items-center gap-2">
                                  {item.status === 'PENDING' ? (
                                    <>
                                      <Badge variant="pending">
                                        <span className="w-2 h-2 rounded-full bg-status-pending shrink-0" />
                                        Chờ nấu
                                      </Badge>
                                      <Button
                                        type="button"
                                        variant="destructiveOutline"
                                        size="sm"
                                        onClick={() =>
                                          setCancelTarget({
                                            type: 'ITEM',
                                            orderId: order.id,
                                            itemId: item.id,
                                            itemName: item.menuItemName,
                                            maxQuantity: item.quantity,
                                          })
                                        }
                                        className="h-9 px-2.5 text-xs"
                                      >
                                        Hủy món
                                      </Button>
                                    </>
                                  ) : item.status === 'READY' ? (
                                    <Button
                                      type="button"
                                      variant="primary"
                                      size="sm"
                                      onClick={() =>
                                        handleCompleteItem(
                                          order.id,
                                          item.id
                                        )
                                      }
                                      disabled={servingItemId === item.id}
                                      className="h-9 px-3.5 text-xs font-semibold"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                      Đã bưng ra bàn
                                    </Button>
                                  ) : item.status === 'COMPLETED' ? (
                                    <Badge variant="completed">Đã phục vụ</Badge>
                                  ) : item.status === 'COOKING' ? (
                                    <Badge variant="cooking">
                                      <span className="w-2 h-2 rounded-full bg-status-cooking shrink-0" />
                                      Đang nấu
                                    </Badge>
                                  ) : item.status === 'CANCELLED' ? (
                                    <Badge variant="cancelled">Đã hủy</Badge>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Transfer History Table */}
          {transfers.length > 0 && (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 sm:px-5 border-b border-border">
                <h3 className="text-sm font-semibold text-text">
                  Lịch sử chuyển bàn ({transfers.length})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface/60 border-b border-border text-muted font-medium">
                    <tr>
                      <th className="py-2.5 px-4 sm:px-5">Thời gian</th>
                      <th className="py-2.5 px-3">Từ bàn</th>
                      <th className="py-2.5 px-3">Đến bàn</th>
                      <th className="py-2.5 px-4 sm:px-5">Nhân viên</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {transfers.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2.5 px-4 sm:px-5 text-muted font-mono">
                          {new Date(item.transferredAt).toLocaleTimeString('vi-VN')}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-text">
                          Bàn {item.fromTableCode}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-primary">
                          Bàn {item.toTableCode}
                        </td>
                        <td className="py-2.5 px-4 sm:px-5 text-muted">
                          {item.transferredByName || 'Hệ thống'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )
      }

      {/* Staff Order Modal */}
      {
        activeSessionId && table && (
          <StaffOrderModal
            isOpen={isOrderModalOpen}
            onClose={() => setIsOrderModalOpen(false)}
            initialSessionId={activeSessionId}
            initialTableCode={table.tableCode}
            onSuccess={() => {
              refetchOrders()
              refetch()
              queryClient.invalidateQueries({ queryKey: ['tablesOverview'] })
            }}
          />
        )
      }

      {/* Aggregated Item Return Modal */}
      {
        activeSessionId && (
          <TableItemReturnModal
            isOpen={isReturnModalOpen}
            onClose={() => setIsReturnModalOpen(false)}
            sessionId={activeSessionId}
            sessionCode={sessionDetail?.sessionCode}
            tableCode={table?.tableCode}
            onSuccess={() => {
              refetchOrders()
              refetch()
              queryClient.invalidateQueries({ queryKey: ['tablesOverview'] })
            }}
          />
        )
      }

      {/* Cancel Order or Item Modal */}
      <CancelItemModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelConfirm}
        title={
          cancelTarget?.type === 'ORDER'
            ? `Hủy đơn hàng #${cancelTarget.orderId}`
            : `Hủy món: ${cancelTarget?.itemName || ''}`
        }
        itemName={cancelTarget?.type === 'ITEM' ? cancelTarget.itemName : undefined}
        maxQuantity={cancelTarget?.type === 'ITEM' ? cancelTarget.maxQuantity : undefined}
        isLoading={isCancelling}
      />

      {/* Transfer Modal */}
      {
        table && (
          <TransferTableModal
            isOpen={isTransferModalOpen}
            onClose={() => setIsTransferModalOpen(false)}
            onSuccess={() => {
              refetch()
              queryClient.invalidateQueries({
                queryKey: ['sessionTransfers', activeSessionId],
              })
            }}
            currentTable={table}
            availableEmptyTables={allTablesData?.content || []}
          />
        )
      }

      {/* Modern Center Modal Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isCloseConfirmOpen}
        onClose={() => setIsCloseConfirmOpen(false)}
        onConfirm={() => {
          setIsCloseConfirmOpen(false)
          closeSessionMutation.mutate()
        }}
        isLoading={closeSessionMutation.isPending}
        title={`Xác nhận đóng phiên Bàn ${table?.tableCode}`}
        description={
          <span>
            {hasBillableOrders ? (
              <>
                Phiên phục vụ của <strong className="text-text">Bàn {table?.tableCode}</strong> đang có món ăn phát sinh. Bạn có chắc chắn muốn đóng phiên trực tiếp mà không qua bước lập hóa đơn thanh toán?
              </>
            ) : (
              <>
                Bàn này hiện không có đơn gọi món nào (hoặc đã hủy hết). Bạn có chắc chắn muốn đóng phiên phục vụ cho{' '}
                <strong className="text-text">Bàn {table?.tableCode}</strong> để giải phóng bàn?
              </>
            )}
            <span className="block mt-1 text-[11px] text-muted">
              Lưu ý: Sau khi đóng phiên, bàn sẽ trở về trạng thái trống và sẵn sàng đón lượt khách mới.
            </span>
          </span>
        }
        confirmText="Đóng phiên"
        cancelText="Hủy bỏ"
        variant="warning"
      />
    </div>
  )
}
export default TableDetailPage
