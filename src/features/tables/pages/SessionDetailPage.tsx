import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowRightLeft,
  AlertCircle,
} from 'lucide-react'

import { tableApi } from '@/features/tables/api/tableApi'
import type { TableTransferHistoryItem } from '@/features/tables/types/table.types'
import { orderApi } from '@/features/ordering/api/orderApi'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'

export function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const sId = Number(sessionId)
  const navigate = useNavigate()

  // Fetch orders belonging to this session
  const { data: sessionOrders = [] } = useQuery({
    queryKey: ['sessionOrders', sId],
    queryFn: () => orderApi.getOrders(sId),
    enabled: !!sId,
  })

  // Fetch session detail
  const {
    data: session,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['sessionDetail', sId],
    queryFn: () => tableApi.getSessionById(sId),
    enabled: !!sId,
  })

  // Fetch table detail if available
  const { data: table } = useQuery({
    queryKey: ['tableDetail', session?.tableId],
    queryFn: () => tableApi.getTableById(session!.tableId),
    enabled: !!session?.tableId,
  })

  // Fetch transfer history
  const { data: transfersData } = useQuery({
    queryKey: ['sessionTransfers', sId],
    queryFn: () => tableApi.getTransferHistory(sId, 0, 50),
    enabled: !!sId,
  })

  // Group direct-sale returned items across all session orders
  const aggregatedReturnedItems = useMemo(() => {
    const map = new Map<
      number,
      {
        menuItemId: number
        menuItemName: string
        totalReturned: number
        unitPrice: number
        totalDeduction: number
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
            }
            map.set(item.menuItemId, entry)
          }
          entry.totalReturned += retQty
          entry.totalDeduction += retQty * item.unitPrice
        }
      })
    })

    return Array.from(map.values())
  }, [sessionOrders])

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(val)
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isError || !session) {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger/10 p-6 text-center text-danger">
        <AlertCircle className="mx-auto h-10 w-10 mb-2" />
        <h3 className="text-lg font-bold">Không tìm thấy thông tin phiên phục vụ</h3>
        <p className="text-sm mt-1 mb-4">{getApiErrorMessage(error) || 'Phiên không tồn tại hoặc bạn không có quyền truy cập'}</p>
        <Button variant="outline" onClick={() => navigate('/sessions/history')}>
          Quay lại lịch sử phiên
        </Button>
      </div>
    )
  }

  const isActive = session.status === 'ACTIVE'
  const transfers: TableTransferHistoryItem[] = transfersData?.content || []

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-12">
      {/* Tầng 1: Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="h-9 px-3 text-xs shrink-0"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Quay lại
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-text">
                Phiên phục vụ {session.sessionCode || `#${session.id}`}
              </h1>
              <Badge variant={isActive ? 'cooking' : 'completed'}>
                {isActive ? 'Đang phục vụ' : 'Đã kết thúc'}
              </Badge>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Bàn {session.tableCode} {table?.area ? `• ${table.area}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Tầng 2: Main Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-4 sm:p-5 space-y-3">
          <h2 className="text-sm font-semibold text-text border-b border-border pb-2.5">
            Thời gian &amp; Nhân sự
          </h2>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted block">Thời điểm mở</span>
              <span className="font-medium text-text tabular-nums mt-0.5 block">
                {new Date(session.openedAt).toLocaleString('vi-VN')}
              </span>
            </div>
            <div>
              <span className="text-muted block">Người mở phiên</span>
              <span className="font-medium text-text mt-0.5 block">
                {session.openedByName || 'Hệ thống'}
              </span>
            </div>
            <div>
              <span className="text-muted block">Thời điểm đóng</span>
              <span className="font-medium text-text tabular-nums mt-0.5 block">
                {session.closedAt ? new Date(session.closedAt).toLocaleString('vi-VN') : '—'}
              </span>
            </div>
            <div>
              <span className="text-muted block">Người đóng phiên</span>
              <span className="font-medium text-text mt-0.5 block">
                {session.closedByName || '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 sm:p-5 space-y-3">
          <h2 className="text-sm font-semibold text-text border-b border-border pb-2.5">
            Thông tin Bàn
          </h2>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted block">Bàn phục vụ</span>
              <span className="font-medium text-text mt-0.5 block">
                Bàn {session.tableCode} (ID: {session.tableId})
              </span>
            </div>
            <div>
              <span className="text-muted block">Khu vực bàn</span>
              <span className="font-medium text-text mt-0.5 block">
                {table?.area || 'Chung'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Returned Items Card */}
      {aggregatedReturnedItems.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 sm:px-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
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
                  <th className="py-2.5 px-4 sm:px-5">Đồ đã trả</th>
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

      {/* Tầng 3: Session Orders List */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-text">
          Các đơn gọi món trong phiên ({sessionOrders.length})
        </h2>

        {sessionOrders.length === 0 ? (
          <div className="text-center py-8 text-muted text-xs bg-card border border-border rounded-lg">
            Phiên phục vụ này chưa có đơn gọi món nào.
          </div>
        ) : (
          <div className="space-y-4">
            {sessionOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-lg border border-border bg-card overflow-hidden"
              >
                {/* Order Header (Hàng cha: bg-surface/60) */}
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
                      <Badge variant="completed">Hoàn thành</Badge>
                    )}
                    {order.status === 'CANCELLED' && (
                      <Badge variant="cancelled">Đã hủy</Badge>
                    )}

                    <span className="text-muted">
                      • {order.createdByName || 'Khách tại bàn'} •{' '}
                      {new Date(order.createdAt).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="font-bold font-mono text-sm text-text tabular-nums shrink-0">
                    {formatPrice(order.totalAmount)}
                  </div>
                </div>

                {/* Items List (Hàng con: nền trắng bg-card) */}
                <div className="divide-y divide-border bg-card">
                  {order.items.map((item) => {
                    const isCancelled = item.status === 'CANCELLED'
                    return (
                      <div
                        key={item.id}
                        className={`px-4 py-3.5 sm:pl-7 sm:pr-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                          isCancelled ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="min-w-0 flex-1 flex items-start gap-3">
                          <span className="font-mono font-bold text-base text-text shrink-0 w-9 pt-0.5 tabular-nums">
                            {item.quantity}x
                          </span>
                          <div className="min-w-0 flex-1">
                            <div
                              className={`font-semibold text-sm text-text ${
                                isCancelled ? 'line-through text-muted' : ''
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

                        <div className="shrink-0 flex items-center justify-between sm:justify-end gap-4 pl-12 sm:pl-0">
                          <span className="font-semibold font-mono text-sm text-text tabular-nums">
                            {formatPrice(item.subtotal || item.unitPrice * item.quantity)}
                          </span>

                          <div className="shrink-0">
                            {item.status === 'PENDING' ? (
                              <Badge variant="pending">Chờ nấu</Badge>
                            ) : item.status === 'READY' ? (
                              <Badge variant="ready">Sẵn sàng</Badge>
                            ) : item.status === 'COMPLETED' ? (
                              <Badge variant="completed">Đã phục vụ</Badge>
                            ) : item.status === 'COOKING' ? (
                              <Badge variant="cooking">Đang nấu</Badge>
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
            ))}
          </div>
        )}
      </div>

      {/* Transfer History */}
      {transfers.length > 0 && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 sm:px-5 border-b border-border">
            <h2 className="text-sm font-semibold text-text">
              Lịch sử chuyển bàn ({transfers.length})
            </h2>
          </div>

          <div className="divide-y divide-border">
            {transfers.map((t) => (
              <div key={t.id} className="px-4 py-3 sm:px-5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text">
                    Bàn {t.fromTableCode || `#${t.fromTableId}`}
                  </span>
                  <ArrowRightLeft className="h-3.5 w-3.5 text-muted" />
                  <span className="font-semibold text-primary">
                    Bàn {t.toTableCode || `#${t.toTableId}`}
                  </span>
                </div>
                <div className="text-right text-muted">
                  <span className="tabular-nums">{new Date(t.transferredAt).toLocaleString('vi-VN')}</span>
                  {t.transferredByName && <span className="ml-2 text-text font-medium">• {t.transferredByName}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
