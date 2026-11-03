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
} from 'lucide-react'
import { toast } from 'sonner'

import { tableApi } from '@/features/tables/api/tableApi'
import { orderApi } from '@/features/ordering/api/orderApi'
import type { TableTransferHistoryItem } from '@/features/tables/types/table.types'
import { TransferTableModal } from '@/features/tables/components/TransferTableModal'
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'

export function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const sId = Number(sessionId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false)
  const [isCheckingOrders, setIsCheckingOrders] = useState(false)

  const handleInitiateClose = async () => {
    if (!sId) return
    setIsCheckingOrders(true)
    try {
      const orders = await orderApi.getOrders(sId)
      const hasUnfinished = orders.some(
        (o) =>
          o.status === 'PENDING' ||
          o.status === 'COOKING' ||
          o.items?.some(
            (i) => i.status === 'PENDING' || i.status === 'COOKING' || i.status === 'READY'
          )
      )

      if (hasUnfinished) {
        toast.error(
          'Bàn vẫn còn món chưa hoàn thành (đang chờ, đang nấu hoặc chưa bưng ra bàn). Vui lòng hoàn tất hoặc hủy trước khi đóng phiên!',
          { duration: 6000 }
        )
        return
      }

      const hasCompleted = orders.some(
        (o) =>
          o.status === 'COMPLETED' ||
          o.items?.some((i) => i.status === 'COMPLETED')
      )

      if (hasCompleted) {
        navigate(`/staff/sessions/${sId}/checkout`)
        return
      }

      // Không có món nào hoàn tất -> mở popup xác nhận đóng trực tiếp
      setIsCloseConfirmOpen(true)
    } catch (err) {
      toast.error(getApiErrorMessage(err) || 'Không thể kiểm tra đơn gọi món của phiên')
    } finally {
      setIsCheckingOrders(false)
    }
  }

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
                variant="outline"
                onClick={() => setIsTransferModalOpen(true)}
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Chuyển bàn
              </Button>
              <Button
                variant="destructive"
                onClick={handleInitiateClose}
                disabled={closeSessionMutation.isPending || isCheckingOrders}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isCheckingOrders ? 'Đang kiểm tra...' : 'Kết thúc phiên'}
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
          <ConfirmDialog
        isOpen={isCloseConfirmOpen}
        onClose={() => setIsCloseConfirmOpen(false)}
        onConfirm={() => {
          setIsCloseConfirmOpen(false)
          closeSessionMutation.mutate()
        }}
        title="Xác nhận kết thúc phiên"
        description="Phiên phục vụ này không có món ăn nào cần thanh toán. Bạn có chắc chắn muốn kết thúc phiên phục vụ này? Sau khi đóng, bàn sẽ trở về trạng thái trống."
        confirmText="Kết thúc phiên"
        cancelText="Hủy"
        variant="destructive"
        isLoading={closeSessionMutation.isPending}
      />
    </div>
  )
}
