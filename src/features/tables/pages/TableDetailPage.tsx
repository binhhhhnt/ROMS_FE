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
} from 'lucide-react'
import { toast } from 'sonner'

import { tableApi } from '@/features/tables/api/tableApi'
import { orderApi } from '@/features/ordering/api/orderApi'
import { kitchenApi } from '@/features/kitchen/api/kitchenApi'
import { subscribeToTopic } from '@/shared/lib/stomp'
import { TransferTableModal } from '@/features/tables/components/TransferTableModal'
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
  const [servingItemId, setServingItemId] = useState<number | null>(null)
  const [isServingAll, setIsServingAll] = useState(false)

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
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsServingAll(false)
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
                Đang có khách (#{activeSessionId})
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
              {/* Session Meta Card */}
              <div className="p-5 bg-surface/50 border border-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsTransferModalOpen(true)}
                    className="text-xs"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 mr-1 text-accent" />
                    Chuyển bàn
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCloseConfirmOpen(true)}
                    isLoading={closeSessionMutation.isPending}
                    className="text-xs text-status-cancelled hover:bg-status-cancelled/10 border-status-cancelled/30"
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    Đóng phiên
                  </Button>
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

              {/* Orders & Dishes Progress Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-accent" />
                    Danh sách đơn gọi món & Tiến độ phục vụ
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
                    {sessionOrders.map((order) => (
                      <div
                        key={order.id}
                        className="border border-border rounded-xl overflow-hidden bg-card shadow-2xs"
                      >
                        {/* Order Header */}
                        <div className="bg-surface/50 px-4 py-2.5 border-b border-border flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <span className="font-extrabold text-text">
                              Đơn #{order.id}
                            </span>
                            <span className="text-muted">
                              (
                              {order.createdByName
                                ? `Tạo bởi: ${order.createdByName}`
                                : 'Khách gọi từ Tablet'}
                              )
                            </span>
                            <span className="text-muted">
                              {new Date(order.createdAt).toLocaleTimeString(
                                'vi-VN',
                                {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )}
                            </span>
                          </div>
                          <div className="font-bold text-primary">
                            {formatPrice(order.totalAmount)}
                          </div>
                        </div>

                        {/* Items List */}
                        <div className="divide-y divide-border">
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                                item.status === 'READY'
                                  ? 'bg-status-ready/10'
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
                                  <p className="text-[11px] text-amber-800 mt-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                                    Ghi chú: {item.note}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                <div className="text-right">
                                  <span className="font-semibold text-text">
                                    {formatPrice(
                                      item.subtotal ||
                                        item.unitPrice * item.quantity
                                    )}
                                  </span>
                                </div>

                                {/* Status & Serving Action */}
                                <div className="min-w-[130px] flex justify-end items-center gap-2">
                                  {item.status === 'READY' ? (
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
                                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-700 font-semibold text-[11px] border border-emerald-500/20">
                                      Đã phục vụ
                                    </span>
                                  ) : item.status === 'COOKING' ? (
                                    <span className="px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-700 font-semibold text-[11px] border border-amber-500/20">
                                      Bếp đang nấu
                                    </span>
                                  ) : item.status === 'CANCELLED' ? (
                                    <span className="px-2.5 py-1 rounded-md bg-red-500/15 text-red-700 font-semibold text-[11px] border border-red-500/20">
                                      Đã hủy
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-1 rounded-md bg-surface text-muted font-semibold text-[11px] border border-border">
                                      Chờ tiếp nhận
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Transfer History Table */}
              <div className="mt-2">
                <h3 className="text-xs font-bold text-text uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-accent" />
                  Lịch sử chuyển bàn trong phiên này
                </h3>

                {transfers.length === 0 ? (
                  <p className="text-xs text-muted italic bg-surface/20 p-4 rounded-lg border border-border">
                    Chưa có lần chuyển bàn nào trong phiên phục vụ này.
                  </p>
                ) : (
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
                )}
              </div>
            </div>
          )}
        </div>
      </div>

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
            Bạn có chắc chắn muốn hoàn tất và đóng phiên phục vụ cho{' '}
            <strong className="text-text">Bàn {table?.tableCode}</strong>?
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
