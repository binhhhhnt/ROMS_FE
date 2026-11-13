import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Users,
  MapPin,
  Clock,
  Play,
  ArrowRightLeft,
  CheckCircle,
  History,
  Layers,
  AlertCircle,
  BellRing,
  Utensils,
  CheckCircle2,
  Receipt,
  Plus,
  PackageOpen,
  Trash2,
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
import { TableCheckoutModal } from '@/features/billing/components/TableCheckoutModal'
import { getApiErrorMessage } from '@/shared/lib/axios'
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
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false)

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
  })

  // Realtime STOMP Subscription
  useEffect(() => {
    if (!activeSessionId) return

    const unsubSession = subscribeToTopic(
      `/topic/session/${activeSessionId}/orders`,
      (payload: any) => {
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
    itemId: number,
    itemName: string
  ) => {
    setServingItemId(itemId)
    try {
      await kitchenApi.updateOrderItemStatus(orderId, itemId, 'COMPLETED')
      toast.success(`Đã xác nhận bưng món "${itemName}" ra Bàn ${table?.tableCode}!`)
      await refetchOrders()
      queryClient.invalidateQueries({ queryKey: ['tablesOverview'] })
      queryClient.invalidateQueries({ queryKey: ['tablesOverviewReadyOrders'] })
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
      for (const item of allReadyItems) {
        await kitchenApi.updateOrderItemStatus(
          item.orderId,
          item.itemId,
          'COMPLETED'
        )
      }
      toast.success(
        `Đã bưng tất cả ${allReadyItems.length} món sẵn sàng ra Bàn ${table?.tableCode}!`
      )
      await refetchOrders()
      queryClient.invalidateQueries({ queryKey: ['tablesOverview'] })
      queryClient.invalidateQueries({ queryKey: ['tablesOverviewReadyOrders'] })
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
      toast.success(`Đã mở phiên phục vụ #${session.id} cho Bàn ${session.tableCode}!`)
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
    setIsCheckoutModalOpen(true)
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
      toast.success(`Đã đóng phiên phục vụ #${session.id} thành công!`)
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
    <div className="flex flex-col gap-6 max-w-5xl mx-auto text-left">
      {/* Back button */}
      <div>
        <Link
          to="/tables"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-text font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Quay lại Sơ đồ bàn
        </Link>
      </div>

      {/* Main Table Info Card */}
      <div className="bg-card border border-border shadow-xl rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center text-primary shadow-inner font-black text-xl">
              {table.tableCode}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-text tracking-tight uppercase">
                  Bàn {table.tableCode}
                </h1>
                {table.area && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted bg-surface px-2.5 py-0.5 rounded-full border border-border">
                    <MapPin className="w-3 h-3 text-accent" />
                    {table.area}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted mt-1 flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />
                Sức chứa: <strong>{table.capacity} khách</strong>
              </p>
            </div>
          </div>

          <div>
            {isOccupied ? (
              <Badge variant="cooking" className="text-sm px-3 py-1">
                Đang có khách
              </Badge>
            ) : isEmpty ? (
              <Badge variant="completed" className="text-sm px-3 py-1">
                Bàn trống
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-sm px-3 py-1">
                Tạm ngừng phục vụ
              </Badge>
            )}
          </div>
        </div>

        {/* Active Session Info or Open Action */}
        <div className="mt-6">
          {isEmpty && (
            <div className="p-6 bg-surface/40 border border-border rounded-xl text-center flex flex-col items-center gap-3">
              <Layers className="w-10 h-10 text-muted/50" />
              <div>
                <h3 className="text-sm font-bold text-text">Bàn hiện đang trống</h3>
                <p className="text-xs text-muted mt-0.5">
                  Mở phiên phục vụ để bắt đầu ghi nhận gọi món cho khách tại bàn này.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => openSessionMutation.mutate()}
                isLoading={openSessionMutation.isPending}
                className="mt-2 text-xs font-semibold shadow-md"
              >
                <Play className="w-4 h-4 mr-1.5 fill-current" />
                Mở phiên phục vụ ngay
              </Button>
            </div>
          )}

          {isOccupied && (
            <div className="flex flex-col gap-6">
              {/* Session Meta Card with Actions */}
              <div className="p-5 bg-surface/50 border border-border rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-muted uppercase font-semibold">
                    Thông tin phiên phục vụ hiện tại
                  </span>
                  <span className="text-base font-bold text-primary">
                    Phiên #{sessionDetail?.id || activeSessionId}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-muted mt-1">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Mở lúc:{' '}
                      <strong>
                        {sessionDetail?.openedAt
                          ? new Date(sessionDetail.openedAt).toLocaleTimeString(
                            'vi-VN',
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )
                          : 'Vừa xong'}
                      </strong>
                    </span>
                    {sessionDetail?.openedByName && (
                      <span>
                        Người mở: <strong>{sessionDetail.openedByName}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Session Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Nút Đặt món luôn hiển thị khi session active */}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsOrderModalOpen(true)}
                    className="text-xs font-semibold shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Đặt món
                  </Button>

                  {/* Nút Kiểm đồ gộp toàn phiên */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsReturnModalOpen(true)}
                    className="text-xs"
                  >
                    <PackageOpen className="w-3.5 h-3.5 mr-1 text-primary" />
                    Kiểm đồ
                  </Button>

                  {/* Nút Chuyển bàn */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsTransferModalOpen(true)}
                    className="text-xs"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 mr-1 text-accent" />
                    Chuyển bàn
                  </Button>

                  {/* Bàn có món phát sinh tiền -> Chỉ hiện nút Thanh toán */}
                  {hasBillableOrders ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenCheckout}
                      className="text-xs"
                    >
                      <Receipt className="w-3.5 h-3.5 mr-1 text-accent" />
                      Thanh toán
                    </Button>
                  ) : (
                    /* Bàn không có món nào (hoặc đã hủy hết) -> Chỉ hiện nút Đóng phiên */
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenCloseConfirm}
                      isLoading={closeSessionMutation.isPending}
                      className="text-xs text-status-cancelled hover:bg-status-cancelled/10 border-status-cancelled/30"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Đóng phiên
                    </Button>
                  )}
                </div>
              </div>

              {/* Ready Dishes Alert Banner */}
              {allReadyItems.length > 0 && (
                <div className="bg-emerald-500/10 border-2 border-emerald-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-status-ready text-white flex items-center justify-center font-black text-xl shrink-0 shadow-xs">
                      <BellRing className="w-6 h-6 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-status-ready">
                        Có {allReadyItems.reduce((s, i) => s + i.quantity, 0)} suất món đã nấu xong!
                      </h4>
                      <p className="text-xs text-muted mt-0.5">
                        Bếp đã đặt thức ăn ra quầy. Nhân viên hãy bưng ra phục vụ bàn {table.tableCode}.
                      </p>
                    </div>
                  </div>

                  {allReadyItems.length > 1 && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleCompleteAllReady}
                      disabled={isServingAll}
                      className="bg-status-ready hover:bg-emerald-600 font-bold text-xs shrink-0 text-white shadow-xs"
                    >
                      {isServingAll ? 'Đang cập nhật...' : `Bưng tất cả (${allReadyItems.length} món)`}
                    </Button>
                  )}
                </div>
              )}

              {/* Khung thông tin các đồ bị trả (chỉ hiện khi có đồ bị trả) */}
              {aggregatedReturnedItems.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4 sm:p-5 flex flex-col gap-3 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
                    <div className="flex items-center gap-2.5">
                      <PackageOpen className="w-4 h-4 text-primary" />
                      <div>
                        <h4 className="font-bold text-sm text-text flex items-center gap-2">
                          Thông tin hàng trả lại kho (Đã kiểm đồ)
                          <span className="text-xs px-2 py-0.5 rounded-md bg-surface border border-border text-text font-semibold">
                            {aggregatedReturnedItems.reduce((sum, item) => sum + item.totalReturned, 0)} món
                          </span>
                        </h4>
                        <p className="text-xs text-muted mt-0.5">
                          Các sản phẩm khách không dùng hết đã được hoàn kho và trừ trực tiếp vào hóa đơn bàn.
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-xs text-muted block">Tổng tiền giảm trừ:</span>
                      <span className="text-sm font-bold text-status-cancelled">
                        -{formatPrice(aggregatedReturnedItems.reduce((sum, item) => sum + item.totalDeduction, 0))}
                      </span>
                    </div>
                  </div>

                  {/* Bảng đơn giản - nền card chuẩn, viền border trung tính */}
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface/50 text-muted font-semibold border-b border-border">
                        <tr>
                          <th className="py-2.5 px-3">Đồ đã trả</th>
                          <th className="py-2.5 px-3 text-center">Số lượng trả</th>
                          <th className="py-2.5 px-3 text-right">Đơn giá</th>
                          <th className="py-2.5 px-3 text-right">Số tiền trừ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {aggregatedReturnedItems.map((item) => (
                          <tr key={item.menuItemId} className="hover:bg-surface/30 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-status-cancelled">
                              {item.menuItemName}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-status-cancelled">
                              -{item.totalReturned}
                            </td>
                            <td className="py-2.5 px-3 text-right text-muted">
                              {formatPrice(item.unitPrice)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-status-cancelled">
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
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-accent" />
                    Danh sách đơn gọi món &amp; Tiến độ phục vụ
                  </h3>
                  <span className="text-xs font-semibold text-muted">
                    {sessionOrders.length} lượt gọi món
                  </span>
                </div>

                {isOrdersLoading ? (
                  <div className="py-8 text-center text-xs text-muted">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Đang tải danh sách món ăn của bàn...
                  </div>
                ) : sessionOrders.length === 0 ? (
                  <div className="text-center py-8 bg-surface/30 border border-dashed border-border rounded-xl text-xs text-muted">
                    Chưa có đơn gọi món nào trong phiên phục vụ này.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessionOrders.map((order) => {
                      const isOrderPending = order.status === 'PENDING'

                      return (
                        <div
                          key={order.id}
                          className="border border-border rounded-xl overflow-hidden bg-card shadow-2xs"
                        >
                          {/* Order Header */}
                          <div className="bg-surface/50 px-4 py-3 border-b border-border flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <span className="font-black text-sm text-text">
                                Đơn #{order.id}
                              </span>

                              {/* Order Status Badge */}
                              {order.status === 'PENDING' && (
                                <Badge variant="pending" className="text-[11px] py-0.5">
                                  Chờ tiếp nhận
                                </Badge>
                              )}
                              {order.status === 'COOKING' && (
                                <Badge variant="cooking" className="text-[11px] py-0.5">
                                  Đang chế biến
                                </Badge>
                              )}
                              {order.status === 'COMPLETED' && (
                                <Badge variant="completed" className="text-[11px] py-0.5">
                                  Hoàn thành
                                </Badge>
                              )}
                              {order.status === 'CANCELLED' && (
                                <Badge variant="cancelled" className="text-[11px] py-0.5">
                                  Đã hủy
                                </Badge>
                              )}

                              <span className="text-muted">
                                ({order.createdByName ? `Tạo bởi: ${order.createdByName}` : 'Khách gọi từ Tablet'})
                              </span>
                              <span className="text-muted">
                                {new Date(order.createdAt).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="font-extrabold text-sm text-primary">
                                {formatPrice(order.totalAmount)}
                              </div>

                              {/* Hủy đơn nếu còn PENDING */}
                              {isOrderPending && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setCancelTarget({
                                      type: 'ORDER',
                                      orderId: order.id,
                                    })
                                  }
                                  className="h-7 px-2.5 text-xs text-status-cancelled hover:bg-status-cancelled/10 border-status-cancelled/30"
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                                  Hủy đơn
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Items List */}
                          <div className="divide-y divide-border">
                            {order.items.map((item) => (
                              <div
                                key={item.id}
                                className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${item.status === 'READY'
                                  ? 'bg-status-ready/10'
                                  : item.status === 'CANCELLED'
                                    ? 'opacity-60 bg-surface/20'
                                    : 'hover:bg-surface/20'
                                  }`}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-text text-sm">
                                      {item.menuItemName}
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-surface border border-border font-black text-primary text-xs">
                                      x{item.quantity}
                                    </span>
                                  </div>
                                  {item.note && (
                                    <p className="text-[11px] text-amber-800 mt-1 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/50 inline-block">
                                      Ghi chú: {item.note}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                  <div className="text-right">
                                    <span className="font-semibold text-text">
                                      {formatPrice(
                                        item.subtotal || item.unitPrice * item.quantity
                                      )}
                                    </span>
                                  </div>

                                  {/* Status & Actions per item */}
                                  <div className="min-w-[140px] flex justify-end items-center gap-2">
                                    {item.status === 'PENDING' ? (
                                      <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 rounded-md bg-surface text-muted font-semibold text-[11px] border border-border">
                                          Chờ tiếp nhận
                                        </span>
                                        <Button
                                          type="button"
                                          variant="outline"
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
                                          className="h-7 px-2 text-xs text-status-cancelled hover:bg-status-cancelled/10 border-status-cancelled/30"
                                        >
                                          <Trash2 className="w-3 h-3 mr-1" />
                                          Hủy món
                                        </Button>
                                      </div>
                                    ) : item.status === 'READY' ? (
                                      <Button
                                        type="button"
                                        variant="primary"
                                        size="sm"
                                        onClick={() =>
                                          handleCompleteItem(
                                            order.id,
                                            item.id,
                                            item.menuItemName
                                          )
                                        }
                                        disabled={servingItemId === item.id}
                                        className="bg-status-ready hover:bg-emerald-600 font-bold text-xs shadow-xs text-white h-8 px-3"
                                      >
                                        {servingItemId === item.id ? (
                                          'Đang lưu...'
                                        ) : (
                                          <>
                                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                            Đã bưng ra bàn
                                          </>
                                        )}
                                      </Button>
                                    ) : item.status === 'COMPLETED' ? (
                                      <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px] border border-emerald-500/20">
                                        Đã phục vụ
                                      </span>
                                    ) : item.status === 'COOKING' ? (
                                      <span className="px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold text-[11px] border border-amber-500/20">
                                        Bếp đang nấu
                                      </span>
                                    ) : item.status === 'CANCELLED' ? (
                                      <span className="px-2.5 py-1 rounded-md bg-red-500/15 text-red-700 dark:text-red-400 font-semibold text-[11px] border border-red-500/20">
                                        Đã hủy
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Transfer History Table (Chỉ hiển thị khi có phát sinh chuyển bàn) */}
              {transfers.length > 0 && (
                <div className="mt-2">
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-accent" />
                    Lịch sử chuyển bàn trong phiên này ({transfers.length})
                  </h3>

                  <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface/50 border-b border-border text-muted font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Thời gian</th>
                          <th className="py-2.5 px-3">Từ bàn</th>
                          <th className="py-2.5 px-3">Đến bàn</th>
                          <th className="py-2.5 px-3">Nhân viên thực hiện</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {transfers.map((item) => (
                          <tr key={item.id} className="hover:bg-surface/30">
                            <td className="py-2.5 px-3 text-muted">
                              {new Date(
                                item.transferredAt
                              ).toLocaleTimeString('vi-VN')}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-text">
                              Bàn {item.fromTableCode}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-primary">
                              Bàn {item.toTableCode}
                            </td>
                            <td className="py-2.5 px-3 text-muted">
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
          )}
        </div>
      </div>

      {/* Staff Order Modal */}
      {activeSessionId && table && (
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
      )}

      {/* Aggregated Item Return Modal */}
      {activeSessionId && (
        <TableItemReturnModal
          isOpen={isReturnModalOpen}
          onClose={() => setIsReturnModalOpen(false)}
          sessionId={activeSessionId}
          tableCode={table?.tableCode}
          onSuccess={() => {
            refetchOrders()
            refetch()
            queryClient.invalidateQueries({ queryKey: ['tablesOverview'] })
          }}
        />
      )}

      {/* Table Checkout & Payment Modal */}
      {activeSessionId && table && (
        <TableCheckoutModal
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
          sessionId={activeSessionId}
          tableCode={table.tableCode}
          onCheckoutSuccess={() => {
            setIsCheckoutModalOpen(false)
            refetch()
            queryClient.invalidateQueries({ queryKey: ['tableDetail', id] })
            queryClient.invalidateQueries({ queryKey: ['tablesOverview'] })
            toast.success(`Đã thanh toán và hoàn tất phiên Bàn ${table.tableCode}!`)
          }}
        />
      )}

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
      {table && (
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
      )}

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
