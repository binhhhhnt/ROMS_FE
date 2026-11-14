import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Clock, QrCode, XCircle, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { qrApi } from '../api/qrApi'
import type { QrOrderRequestResponse } from '../types/qr.types'
import { Button } from '@/shared/components/ui/button'
import { getApiErrorMessage } from '@/shared/lib/axios'

const formatPrice = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

export function StaffQrOrdersPage() {
  const queryClient = useQueryClient()
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [cancelTarget, setCancelTarget] = useState<QrOrderRequestResponse | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  const {
    data: pendingRequests = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['staffPendingQrOrders'],
    queryFn: qrApi.getPendingRequests,
    refetchInterval: 15000,
  })

  const handleConfirm = async (req: QrOrderRequestResponse) => {
    if (processingId !== null) return
    setProcessingId(req.id)
    try {
      await qrApi.confirmQrOrder(req.id)
      toast.success(`Đã xác nhận đơn QR bàn ${req.tableCode} và gửi xuống bếp!`)
      await queryClient.invalidateQueries({ queryKey: ['staffPendingQrOrders'] })
    } catch (err) {
      toast.error(getApiErrorMessage(err))
      await queryClient.invalidateQueries({ queryKey: ['staffPendingQrOrders'] })
    } finally {
      setProcessingId(null)
    }
  }

  const handleCancelSubmit = async () => {
    if (!cancelTarget || !cancelReason.trim() || processingId !== null) return
    setProcessingId(cancelTarget.id)
    try {
      await qrApi.cancelQrOrder(cancelTarget.id, cancelReason.trim())
      toast.success(`Đã hủy yêu cầu QR bàn ${cancelTarget.tableCode}`)
      setCancelTarget(null)
      setCancelReason('')
      await queryClient.invalidateQueries({ queryKey: ['staffPendingQrOrders'] })
    } catch (err) {
      toast.error(getApiErrorMessage(err))
      await queryClient.invalidateQueries({ queryKey: ['staffPendingQrOrders'] })
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <QrCode className="w-6 h-6 text-primary" />
            Xác nhận đơn QR
          </h1>
          <p className="text-sm text-muted mt-1">
            Kiểm tra món khách đặt qua mã QR và xác nhận để gửi xuống bếp.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Làm mới
        </Button>
      </div>

      {isLoading ? (
        <div className="py-16 flex flex-col items-center gap-2 text-muted">
          <Loader2 className="w-7 h-7 animate-spin text-accent" />
          <span>Đang tải danh sách yêu cầu QR...</span>
        </div>
      ) : pendingRequests.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center space-y-2">
          <QrCode className="w-10 h-10 text-muted mx-auto opacity-60" />
          <p className="font-semibold text-text">Không có đơn QR nào chờ xác nhận</p>
          <p className="text-sm text-muted">
            Khi khách hàng quét QR và gửi món, yêu cầu sẽ xuất hiện tại đây theo thời gian thực.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pendingRequests.map((req) => {
            const totalAmount = req.items.reduce(
              (sum, i) => sum + i.unitPrice * i.quantity,
              0
            )
            const isBusy = processingId === req.id

            return (
              <div
                key={req.id}
                className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between gap-4 shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                        Bàn {req.tableCode}
                      </span>
                      {req.area && (
                        <span className="text-xs text-muted ml-2">{req.area}</span>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" />
                      #{req.id}
                    </span>
                  </div>

                  <div className="divide-y divide-border/70 border-y border-border/70 py-1">
                    {req.items.map((item) => (
                      <div key={item.id} className="py-2 flex items-start justify-between gap-2 text-sm">
                        <div className="min-w-0">
                          <p className="font-semibold text-text">
                            {item.quantity}x {item.menuItemName}
                          </p>
                          {item.note && (
                            <p className="text-xs text-amber-700 mt-0.5">
                              Ghi chú: {item.note}
                            </p>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-muted shrink-0">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Tạm tính</span>
                    <span className="font-bold text-primary">{formatPrice(totalAmount)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    disabled={processingId !== null}
                    onClick={() => {
                      setCancelTarget(req)
                      setCancelReason('')
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-1.5" />
                    Hủy
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={processingId !== null}
                    onClick={() => void handleConfirm(req)}
                  >
                    {isBusy ? (
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-1.5" />
                    )}
                    Xác nhận
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Cancel Reason Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <h2 className="font-bold text-base text-text">
              Hủy yêu cầu QR — Bàn {cancelTarget.tableCode}
            </h2>
            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Lý do hủy (bắt buộc)
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ví dụ: Khách quét nhầm QR bàn khác..."
                className="w-full rounded-lg border border-border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCancelTarget(null)}>
                Đóng
              </Button>
              <Button
                variant="destructive"
                disabled={!cancelReason.trim() || processingId !== null}
                onClick={() => void handleCancelSubmit()}
              >
                Xác nhận hủy
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
