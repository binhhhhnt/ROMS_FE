import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Clock,
  ArrowRightLeft,
  CheckCircle,
  History,
  Layers,
  AlertCircle,
  User,
  Utensils,
  ClipboardList,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'

import { tableApi } from '@/features/tables/api/tableApi'
import type { TableTransferHistoryItem } from '@/features/tables/types/table.types'
import { TransferTableModal } from '@/features/tables/components/TransferTableModal'
import { StaffOrderModal } from '@/features/ordering/components/StaffOrderModal'
import { orderApi } from '@/features/ordering/api/orderApi'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'

export function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const sId = Number(sessionId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)

  // Fetch orders belonging to this session
  const { data: sessionOrders = [], refetch: refetchOrders } = useQuery({
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

  // Fetch tables for transfer options
  const { data: allTablesData } = useQuery({
    queryKey: ['allTablesList'],
    queryFn: () => tableApi.getTables({ size: 100 }),
    enabled: isTransferModalOpen,
  })

  // Fetch transfer history
  const { data: transfersData } = useQuery({
    queryKey: ['sessionTransfers', sId],
    queryFn: () => tableApi.getTransferHistory(sId, 0, 50),
    enabled: !!sId,
  })

  // Close session mutation
  const closeSessionMutation = useMutation({
    mutationFn: () => tableApi.closeSession(sId),
    onSuccess: () => {
      toast.success('Đã kết thúc phiên phục vụ thành công!')
      queryClient.invalidateQueries({ queryKey: ['sessionDetail', sId] })
      queryClient.invalidateQueries({ queryKey: ['tableDetail'] })
      queryClient.invalidateQueries({ queryKey: ['tablesOverview'] })
      queryClient.invalidateQueries({ queryKey: ['sessionsHistory'] })
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err) || 'Không thể kết thúc phiên phục vụ')
    },
  })

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

        <div className="flex items-center gap-2">
          {table && (
            <Link to={`/tables/${table.id}`}>
              <Button variant="outline">
                <Layers className="h-4 w-4 mr-2" />
                Xem thông tin bàn
              </Button>
            </Link>
          )}

          {isActive && (
            <>
              <Button
                onClick={() => setIsOrderModalOpen(true)}
                className="bg-primary hover:bg-primary-hover text-white font-bold"
              >
                <Utensils className="h-4 w-4 mr-2" />
                + Đặt món cho bàn
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsTransferModalOpen(true)}
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Chuyển bàn
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm('Bạn có chắc chắn muốn kết thúc phiên phục vụ này? Sau khi đóng, bàn sẽ trở về trạng thái trống.')) {
                    closeSessionMutation.mutate()
                  }
                }}
                disabled={closeSessionMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Kết thúc phiên
              </Button>
            </>
          )}
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
            Thông tin vị trí & Bàn
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-muted block">Bàn phục vụ</span>
              <span className="font-medium text-text mt-1 block">
                Bàn {session.tableCode} (ID: {session.tableId})
              </span>
            </div>
            <div>
              <span className="text-xs text-muted block">Trạng thái bàn hiện tại</span>
              <span className="font-medium text-text mt-1 block">
                {table ? (
                  <Badge variant={table.realtimeStatus === 'EMPTY' ? 'ready' : 'cooking'}>
                    {table.realtimeStatus === 'EMPTY' ? 'Bàn trống' : 'Có khách'}
                  </Badge>
                ) : '—'}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted block">Khu vực bàn</span>
              <span className="font-medium text-text mt-1 block">
                {table?.area || 'Chung'}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted block">Sức chứa tối đa</span>
              <span className="font-medium text-text mt-1 block">
                {table?.capacity ? `${table.capacity} khách` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>


      {/* Session Orders List */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-base font-semibold text-text flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            Các đơn gọi món trong phiên ({sessionOrders.length})
          </h2>
          {isActive && (
            <Button
              size="sm"
              onClick={() => setIsOrderModalOpen(true)}
              className="text-xs h-8 bg-primary hover:bg-primary-hover text-white font-semibold gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm món
            </Button>
          )}
        </div>

        {sessionOrders.length === 0 ? (
          <div className="text-center py-8 text-muted text-sm">
            <Utensils className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>Phiên phục vụ này chưa có đơn gọi món nào.</p>
            {isActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOrderModalOpen(true)}
                className="mt-3 text-xs"
              >
                Bấm vào đây để đặt món ngay
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {sessionOrders.map((order) => (
              <div key={order.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-sm text-text">Đơn #{order.id}</span>
                    <Badge variant={
                      order.status === 'PENDING' ? 'pending' :
                      order.status === 'COOKING' ? 'cooking' :
                      order.status === 'COMPLETED' ? 'completed' : 'cancelled'
                    }>
                      {order.status === 'PENDING' ? 'Chờ tiếp nhận' :
                       order.status === 'COOKING' ? 'Đang nấu' :
                       order.status === 'COMPLETED' ? 'Hoàn thành' : 'Đã hủy'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted">
                    {order.items.map((i) => `${i.menuItemName} x${i.quantity}`).join(', ')}
                  </p>
                  <span className="text-[11px] text-muted block">
                    Đặt lúc: {new Date(order.createdAt).toLocaleTimeString('vi-VN')}
                  </span>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <span className="font-extrabold text-sm text-primary">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                  </span>
                  <Link to={`/staff/orders/${order.id}`}>
                    <Button variant="outline" size="sm" className="text-xs h-8">
                      Chi tiết
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Transfer History */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
        <h2 className="text-base font-semibold text-text flex items-center gap-2 border-b border-border pb-3">
          <History className="h-4 w-4 text-primary" />
          Lịch sử chuyển bàn trong phiên ({transfers.length})
        </h2>

        {transfers.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">
            Phiên này chưa có lịch sử đổi hoặc chuyển bàn.
          </p>
        ) : (
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
        )}
      </div>

      {/* Transfer Table Modal */}
      {table && (
        <TransferTableModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          currentTable={table}
          availableEmptyTables={allTablesData?.content || []}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['sessionDetail', sId] })
            queryClient.invalidateQueries({ queryKey: ['sessionTransfers', sId] })
            queryClient.invalidateQueries({ queryKey: ['tableDetail'] })
            queryClient.invalidateQueries({ queryKey: ['tablesOverview'] })
          }}
        />
      )}

      {/* Staff Direct Ordering Modal */}
      <StaffOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        initialSessionId={sId}
        initialTableCode={session.tableCode}
        onSuccess={() => {
          refetchOrders()
          queryClient.invalidateQueries({ queryKey: ['sessionOrders', sId] })
          queryClient.invalidateQueries({ queryKey: ['orders'] })
        }}
      />
    </div>
  )
}
