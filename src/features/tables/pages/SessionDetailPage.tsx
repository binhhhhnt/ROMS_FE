import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Clock,
  ArrowRightLeft,
  History,
  Layers,
  AlertCircle,
  User,
  Utensils,
  ClipboardList,
  PackageOpen,
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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
            title="Quay lại"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-text">
                Phiên phục vụ #{session.id}
              </h1>
              <Badge variant={isActive ? 'cooking' : 'completed'}>
                {isActive ? 'Đang phục vụ' : 'Đã kết thúc'}
              </Badge>
            </div>
            <p className="text-sm text-muted mt-0.5">
              Mã bàn: <strong className="text-text">Bàn {session.tableCode}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Main Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
          <h2 className="text-base font-semibold text-text flex items-center gap-2 border-b border-border pb-3">
            <Clock className="h-4 w-4 text-primary" />
            Thời gian & Nhân sự
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-muted block">Thời điểm mở</span>
              <span className="font-medium text-text mt-1 block">
                {new Date(session.openedAt).toLocaleString('vi-VN')}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted block">Người mở phiên</span>
              <span className="font-medium text-text mt-1 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted" />
                {session.openedByName || 'Hệ thống'}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted block">Thời điểm đóng</span>
              <span className="font-medium text-text mt-1 block">
                {session.closedAt ? new Date(session.closedAt).toLocaleString('vi-VN') : '—'}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted block">Người đóng phiên</span>
              <span className="font-medium text-text mt-1 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted" />
                {session.closedByName || '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
          <h2 className="text-base font-semibold text-text flex items-center gap-2 border-b border-border pb-3">
            <Layers className="h-4 w-4 text-primary" />
            Thông tin Bàn
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-muted block">Bàn phục vụ</span>
              <span className="font-medium text-text mt-1 block">
                Bàn {session.tableCode} (ID: {session.tableId})
              </span>
            </div>
            <div>
              <span className="text-xs text-muted block">Khu vực bàn</span>
              <span className="font-medium text-text mt-1 block">
                {table?.area || 'Chung'}
              </span>
            </div>
          </div>
        </div>
      </div>

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

      {/* Session Orders List */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-base font-semibold text-text flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            Các đơn gọi món trong phiên ({sessionOrders.length})
          </h2>
        </div>

        {sessionOrders.length === 0 ? (
          <div className="text-center py-8 text-muted text-sm">
            <Utensils className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>Phiên phục vụ này chưa có đơn gọi món nào.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessionOrders.map((order) => {
              return (
                <div
                  key={order.id}
                  className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs"
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
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(order.totalAmount)}
                      </div>
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
                              {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                              }).format(
                                item.subtotal || item.unitPrice * item.quantity
                              )}
                            </span>
                          </div>

                          {/* Status Badge per item */}
                          <div className="min-w-[100px] flex justify-end items-center">
                            {item.status === 'PENDING' ? (
                              <span className="px-2 py-1 rounded-md bg-surface text-muted font-semibold text-[11px] border border-border">
                                Chờ tiếp nhận
                              </span>
                            ) : item.status === 'READY' ? (
                              <span className="px-2.5 py-1 rounded-md bg-status-ready/15 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px] border border-status-ready/20">
                                Sẵn sàng phục vụ
                              </span>
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
      {/* Transfer History (Chỉ hiển thị khi có phát sinh chuyển bàn) */}
      {transfers.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
          <h2 className="text-base font-semibold text-text flex items-center gap-2 border-b border-border pb-3">
            <History className="h-4 w-4 text-primary" />
            Lịch sử chuyển bàn trong phiên ({transfers.length})
          </h2>

          <div className="divide-y divide-border/60">
            {transfers.map((t) => (
              <div key={t.id} className="py-3 flex items-start justify-between text-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text">
                      Bàn {t.fromTableCode || `#${t.fromTableId}`}
                    </span>
                    <ArrowRightLeft className="h-3.5 w-3.5 text-muted" />
                    <span className="font-medium text-primary">
                      Bàn {t.toTableCode || `#${t.toTableId}`}
                    </span>
                  </div>
                </div>
                <div className="text-right text-xs text-muted">
                  <p>{new Date(t.transferredAt).toLocaleString('vi-VN')}</p>
                  <p className="font-medium text-text mt-0.5">{t.transferredByName}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
