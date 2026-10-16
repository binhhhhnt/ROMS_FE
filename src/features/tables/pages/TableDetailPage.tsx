import { useState } from 'react'
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
} from 'lucide-react'
import { toast } from 'sonner'

import { tableApi } from '@/features/tables/api/tableApi'
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
    <div className="flex flex-col gap-6 max-w-4xl mx-auto text-left">
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
            <div className="flex flex-col gap-5">
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
                          ? new Date(sessionDetail.openedAt).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
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
                              {new Date(item.transferredAt).toLocaleTimeString('vi-VN')}
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
            queryClient.invalidateQueries({ queryKey: ['sessionTransfers', activeSessionId] })
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
