import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, CheckCircle, PackageOpen, AlertCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { orderApi } from '@/features/ordering/api/orderApi'
import type { DirectSaleItemDto } from '@/features/ordering/types/ordering.types'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { handleNumericKeyDown, handleNumericPaste } from '@/shared/utils/numericInput'

interface TableItemReturnModalProps {
  isOpen: boolean
  onClose: () => void
  sessionId: number
  sessionCode?: string
  tableCode?: string
  onSuccess?: () => void
}

interface AggregatedDirectSaleItem {
  menuItemId: number
  menuItemName: string
  unitPrice: number
  totalOrdered: number
  totalReturned: number
  totalAvailableToReturn: number
  orderIds: number[]
  rawItems: DirectSaleItemDto[]
}

export function TableItemReturnModal({
  isOpen,
  onClose,
  sessionId,
  sessionCode,
  tableCode,
  onSuccess,
}: TableItemReturnModalProps) {
  const queryClient = useQueryClient()

  // State mapping menuItemId -> aggregated returnQuantity input value (number)
  const [returnInputs, setReturnInputs] = useState<Record<number, number>>({})

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

  // Group direct-sale items by menuItemId
  const aggregatedItems = useMemo<AggregatedDirectSaleItem[]>(() => {
    const map = new Map<number, AggregatedDirectSaleItem>()

    directSaleItems.forEach((item) => {
      let group = map.get(item.menuItemId)
      if (!group) {
        group = {
          menuItemId: item.menuItemId,
          menuItemName: item.menuItemName,
          unitPrice: item.unitPrice,
          totalOrdered: 0,
          totalReturned: 0,
          totalAvailableToReturn: 0,
          orderIds: [],
          rawItems: [],
        }
        map.set(item.menuItemId, group)
      }

      group.totalOrdered += item.orderedQuantity
      const alreadyReturned = item.returnedQuantity || 0
      group.totalReturned += alreadyReturned
      group.totalAvailableToReturn += Math.max(0, item.orderedQuantity - alreadyReturned)
      if (item.orderId && !group.orderIds.includes(item.orderId)) {
        group.orderIds.push(item.orderId)
      }
      group.rawItems.push(item)
    })

    // Sort rawItems inside each group for LIFO (latest order first)
    map.forEach((group) => {
      group.rawItems.sort((a, b) => {
        if (a.orderCreatedAt && b.orderCreatedAt) {
          const timeA = new Date(a.orderCreatedAt).getTime()
          const timeB = new Date(b.orderCreatedAt).getTime()
          if (timeB !== timeA) return timeB - timeA
        }
        return b.orderItemId - a.orderItemId
      })
    })

    return Array.from(map.values())
  }, [directSaleItems])

  // Handle target total return quantity input change per aggregated menuItemId
  const handleQuantityChange = (menuItemId: number, maxOrdered: number, valueStr: string) => {
    const val = valueStr.trim() === '' ? 0 : parseInt(valueStr, 10)
    const clampedVal = isNaN(val) ? 0 : Math.max(0, Math.min(val, maxOrdered))
    setReturnInputs((prev) => ({
      ...prev,
      [menuItemId]: clampedVal,
    }))
  }

  // Track groups whose target returned quantity differs from current totalReturned
  const changedGroups = useMemo(() => {
    return aggregatedItems.filter((group) => {
      const target = returnInputs[group.menuItemId] ?? group.totalReturned
      return target !== group.totalReturned
    })
  }, [aggregatedItems, returnInputs])

  const netDeltaCount = useMemo(() => {
    return changedGroups.reduce((sum, group) => {
      const target = returnInputs[group.menuItemId] ?? group.totalReturned
      return sum + (target - group.totalReturned)
    }, 0)
  }, [changedGroups, returnInputs])

  // Mutation to submit target returned quantities with LIFO distribution
  const returnMutation = useMutation({
    mutationFn: async () => {
      const itemsToReturn: { orderItemId: number; returnQuantity: number }[] = []

      changedGroups.forEach((group) => {
        let remainingTarget = returnInputs[group.menuItemId] ?? group.totalReturned

        // Distribute target total via LIFO (from latest order to oldest order)
        for (const raw of group.rawItems) {
          const assignQty = Math.min(remainingTarget, raw.orderedQuantity)
          remainingTarget -= assignQty

          if (assignQty !== (raw.returnedQuantity || 0)) {
            itemsToReturn.push({
              orderItemId: raw.orderItemId,
              returnQuantity: assignQty,
            })
          }
        }
      })

      if (itemsToReturn.length === 0) return

      return orderApi.returnSessionDirectSaleItems(sessionId, {
        items: itemsToReturn,
      })
    },
    onSuccess: () => {
      toast.success('Đã cập nhật kiểm đồ và đồng bộ tồn kho thành công!')
      setReturnInputs({})
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['sessionOrders', sessionId] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['sessionDetail', sessionId] })
      queryClient.invalidateQueries({ queryKey: ['sessionDirectSaleItems', sessionId] })
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
      queryClient.invalidateQueries({ queryKey: ['tableDetail'] })
      queryClient.invalidateQueries({ queryKey: ['tablesOverview'] })
      if (onSuccess) onSuccess()
      onClose()
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err) || 'Không thể ghi nhận kiểm đồ trả hàng. Vui lòng thử lại.')
    },
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="relative flex w-full max-w-3xl flex-col max-h-[90vh] rounded-lg bg-card border border-border shadow-md overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-surface/60">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-text">
              Kiểm đồ toàn phiên {tableCode ? `— Bàn ${tableCode}` : ''}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Phiên phục vụ {sessionCode || `#${sessionId}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 border border-border bg-card text-muted hover:bg-muted-bg hover:text-text transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
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
          ) : aggregatedItems.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 text-center text-muted">
              <PackageOpen className="h-10 w-10 text-muted/50" />
              <p className="text-sm font-medium text-text">Không có hàng bán trực tiếp nào đã phục vụ trong phiên này</p>
              <p className="text-xs max-w-md">
                Chỉ các món được đánh dấu &ldquo;Hàng bán trực tiếp&rdquo; (như bia lon, chai nước ngọt, rượu đóng chai, khăn lạnh) và đã hoàn tất phục vụ mới hiển thị tại đây để kiểm đồ trả kho.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface/60 font-medium text-muted border-b border-border">
                    <tr>
                      <th className="px-4 py-3">Món ăn / Đồ uống</th>
                      <th className="px-4 py-3 text-center whitespace-nowrap">Đã gọi</th>
                      <th className="px-4 py-3 text-center whitespace-nowrap w-36">Tổng SL trả</th>
                      <th className="px-4 py-3 text-center whitespace-nowrap">Thực dùng</th>
                      <th className="px-4 py-3 text-right whitespace-nowrap">Đơn giá</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border tabular-nums">
                    {aggregatedItems.map((group) => {
                      const alreadyReturned = group.totalReturned
                      const targetReturned = returnInputs[group.menuItemId] ?? alreadyReturned
                      const finalUsed = Math.max(0, group.totalOrdered - targetReturned)

                      return (
                        <tr key={group.menuItemId} className="hover:bg-muted-bg/40 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-sm text-text">{group.menuItemName}</div>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted">
                              <span>
                                {group.orderIds.length > 1
                                  ? `${group.orderIds.length} đơn (#${group.orderIds.join(', #')})`
                                  : `Đơn #${group.orderIds[0]}`}
                              </span>
                              {alreadyReturned > 0 && (
                                <Badge variant="pending">
                                  Đã trả trước: {alreadyReturned}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm font-semibold tabular-nums text-text whitespace-nowrap">
                            {group.totalOrdered}
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <input
                                type="number"
                                min={0}
                                max={group.totalOrdered}
                                value={targetReturned}
                                onKeyDown={(e) => handleNumericKeyDown(e, 'integer')}
                                onPaste={(e) => handleNumericPaste(e, 'integer')}
                                onChange={(e) =>
                                  handleQuantityChange(group.menuItemId, group.totalOrdered, e.target.value)
                                }
                                className="w-16 h-9 text-center text-sm font-semibold tabular-nums rounded-md border border-border bg-card text-text focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
                              />
                              <span className="text-xs font-medium text-muted tabular-nums">/ {group.totalOrdered}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm font-semibold tabular-nums text-text whitespace-nowrap">
                            {finalUsed}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium tabular-nums text-text whitespace-nowrap">
                            {group.unitPrice.toLocaleString('vi-VN')} đ
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3.5 bg-card">
          <div className="text-xs text-muted">
            {changedGroups.length > 0 ? (
              <span className="text-text font-medium">
                Đang điều chỉnh <strong className="text-primary font-mono">{changedGroups.length}</strong> món (
                <strong className="text-primary font-mono">
                  {netDeltaCount > 0 ? `+${netDeltaCount}` : netDeltaCount}
                </strong>{' '}
                sản phẩm trả)
              </span>
            ) : (
              <span>Chỉnh số lượng ở cột &ldquo;Tổng SL trả&rdquo; (tăng hoặc giảm) để cập nhật</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={returnMutation.isPending} className="h-9 px-3.5 text-xs">
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => returnMutation.mutate()}
              disabled={changedGroups.length === 0 || returnMutation.isPending}
              isLoading={returnMutation.isPending}
              className="h-9 px-4 text-xs font-semibold"
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              Xác nhận kiểm đồ
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
