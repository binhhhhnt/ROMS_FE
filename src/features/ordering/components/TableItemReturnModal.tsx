import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, CheckCircle, PackageOpen, AlertCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { orderApi } from '@/features/ordering/api/orderApi'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'

interface TableItemReturnModalProps {
  isOpen: boolean
  onClose: () => void
  sessionId: number
  tableCode?: string
  onSuccess?: () => void
}

export function TableItemReturnModal({
  isOpen,
  onClose,
  sessionId,
  tableCode,
  onSuccess,
}: TableItemReturnModalProps) {
  const queryClient = useQueryClient()

  // State mapping orderItemId -> returnQuantity input value (number)
  const [returnInputs, setReturnInputs] = useState<Record<number, number>>({})
  const [returnNote, setReturnNote] = useState('')

  // Query direct-sale items of this session
  const {
    data: directSaleItems = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['sessionDirectSaleItems', sessionId],
    queryFn: () => orderApi.getSessionDirectSaleItems(sessionId),
    enabled: isOpen && !!sessionId,
  })

  // Handle return quantity input change
  const handleQuantityChange = (itemId: number, maxAvailableToReturn: number, valueStr: string) => {
    const val = parseInt(valueStr, 10)
    if (isNaN(val) || val <= 0) {
      setReturnInputs((prev) => {
        const next = { ...prev }
        delete next[itemId]
        return next
      })
      return
    }
    const clampedVal = Math.min(val, maxAvailableToReturn)
    setReturnInputs((prev) => ({
      ...prev,
      [itemId]: clampedVal,
    }))
  }

  // Calculate total return count entered across items
  const totalReturningCount = useMemo(() => {
    return Object.values(returnInputs).reduce((sum, qty) => sum + (qty || 0), 0)
  }, [returnInputs])

  // Mutation to submit returns
  const returnMutation = useMutation({
    mutationFn: async () => {
      const itemsToReturn = Object.entries(returnInputs)
        .filter(([_, qty]) => qty > 0)
        .map(([itemIdStr, qty]) => ({
          orderItemId: Number(itemIdStr),
          returnQuantity: qty,
        }))

      if (itemsToReturn.length === 0) return

      return orderApi.returnSessionDirectSaleItems(sessionId, {
        items: itemsToReturn,
        note: returnNote.trim() || undefined,
      })
    },
    onSuccess: () => {
      toast.success(`Đã kiểm đồ và hoàn kho ${totalReturningCount} sản phẩm thành công!`)
      setReturnInputs({})
      setReturnNote('')
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['sessionOrders', sessionId] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['sessionDetail', sessionId] })
      queryClient.invalidateQueries({ queryKey: ['sessionDirectSaleItems', sessionId] })
      queryClient.invalidateQueries({ queryKey: ['stockMovements'] })
      if (onSuccess) onSuccess()
      onClose()
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err) || 'Không thể ghi nhận kiểm đồ trả hàng. Vui lòng thử lại.')
    },
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div
        className="relative flex w-full max-w-3xl flex-col max-h-[90vh] rounded-2xl bg-card border border-border shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-surface/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <PackageOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text">
                Kiểm đồ trả kho {tableCode ? `— Bàn ${tableCode}` : ''}
              </h2>
              <p className="text-xs text-muted">
                Phiên phục vụ #{sessionId} • Trả lại các sản phẩm bán trực tiếp nguyên vẹn (bia, nước ngọt, rượu...)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted hover:bg-surface hover:text-text transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted">Đang tải danh sách đồ bán trực tiếp...</p>
            </div>
          ) : isError ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 text-status-cancelled">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm font-medium">Không thể tải danh sách món</p>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-1.5" /> Thử lại
              </Button>
            </div>
          ) : directSaleItems.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 text-center text-muted">
              <PackageOpen className="h-10 w-10 text-muted/50" />
              <p className="text-sm font-medium text-text">Không có hàng bán trực tiếp nào trong phiên này</p>
              <p className="text-xs max-w-md">
                Chỉ các món được đánh dấu "Hàng bán trực tiếp" (như bia lon, chai nước ngọt, rượu đóng chai) mới hiển thị tại đây để kiểm đồ trả kho.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface/60 text-xs font-semibold uppercase tracking-wider text-muted border-b border-border">
                    <tr>
                      <th className="px-4 py-3">Món ăn / Đồ uống</th>
                      <th className="px-4 py-3 text-center">Số lượng gọi</th>
                      <th className="px-4 py-3 text-center w-36">Số lượng trả</th>
                      <th className="px-4 py-3 text-center">Số lượng dùng</th>
                      <th className="px-4 py-3 text-right">Đơn giá</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {directSaleItems.map((item) => {
                      const alreadyReturned = item.returnedQuantity || 0
                      const maxCanReturnNow = Math.max(0, item.orderedQuantity - alreadyReturned)
                      const returningNow = returnInputs[item.orderItemId] || 0
                      const finalUsed = Math.max(0, item.orderedQuantity - (alreadyReturned + returningNow))

                      return (
                        <tr key={item.orderItemId} className="hover:bg-surface/30 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-text">{item.menuItemName}</div>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted">
                              <span>Đơn #{item.orderId}</span>
                              {alreadyReturned > 0 && (
                                <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/40 text-[10px] py-0">
                                  Đã trả trước: {alreadyReturned}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold text-text">
                            {item.orderedQuantity}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {maxCanReturnNow > 0 ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <input
                                  type="number"
                                  min={0}
                                  max={maxCanReturnNow}
                                  value={returnInputs[item.orderItemId] ?? ''}
                                  onChange={(e) =>
                                    handleQuantityChange(item.orderItemId, maxCanReturnNow, e.target.value)
                                  }
                                  placeholder="0"
                                  className="w-16 h-8 text-center font-bold rounded-md border border-border bg-background text-text focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary text-sm"
                                />
                                <span className="text-xs text-muted">/ {maxCanReturnNow}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted italic">Đã trả hết</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
                              {finalUsed}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right font-medium text-muted">
                            {item.unitPrice.toLocaleString('vi-VN')} đ
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Note input */}
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">
                  Ghi chú kiểm đồ (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={returnNote}
                  onChange={(e) => setReturnNote(e.target.value)}
                  placeholder="Ví dụ: Khách chỉ dùng 7 lon, còn 3 lon nguyên vẹn để lại bàn..."
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-background text-text placeholder:text-muted/60 focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Notice */}
              <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3.5 text-xs text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300 flex items-start gap-2.5">
                <CheckCircle className="h-4 w-4 shrink-0 text-sky-600 mt-0.5" />
                <div>
                  <strong>Cơ chế tự động:</strong> Khi xác nhận kiểm đồ, hệ thống sẽ tự động hoàn số lượng nguyên liệu vào kho, ghi nhận lịch sử biến động với loại <code className="font-mono font-bold">ORDER_RETURN</code>, và tự động khấu trừ thành tiền của bàn theo số lượng thực dùng (<strong className="underline">Gọi - Trả</strong>).
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-surface/50">
          <div className="text-xs text-muted">
            {totalReturningCount > 0 ? (
              <span className="text-text font-semibold">
                Đang chọn trả: <span className="text-primary font-bold">{totalReturningCount}</span> sản phẩm
              </span>
            ) : (
              <span>Nhập số lượng vào cột "Số lượng trả" để thực hiện</span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <Button variant="outline" onClick={onClose} disabled={returnMutation.isPending}>
              Hủy
            </Button>
            <Button
              className="bg-primary hover:bg-primary-hover text-white font-bold"
              onClick={() => returnMutation.mutate()}
              disabled={totalReturningCount === 0 || returnMutation.isPending}
              isLoading={returnMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Xác nhận kiểm đồ {totalReturningCount > 0 ? `(${totalReturningCount})` : ''}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

