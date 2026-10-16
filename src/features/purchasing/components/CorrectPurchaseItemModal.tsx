import { useState, useEffect, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { purchaseApi } from '@/features/purchasing/api/purchaseApi'
import type { PurchaseItemResponse } from '@/features/purchasing/types/purchase.types'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import {
  X,
  Edit3,
  Loader2,
  AlertTriangle,
  FileText,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import type { AxiosError } from 'axios'
import type { ApiResponse } from '@/shared/types/api.types'

interface CorrectPurchaseItemModalProps {
  purchaseId: number
  item: PurchaseItemResponse | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function CorrectPurchaseItemModal({
  purchaseId,
  item,
  isOpen,
  onClose,
  onSuccess,
}: CorrectPurchaseItemModalProps) {
  const queryClient = useQueryClient()

  const [quantity, setQuantity] = useState<string>('')
  const [unitPrice, setUnitPrice] = useState<string>('')
  const [reason, setReason] = useState<string>('')

  // Sync state when item changes
  useEffect(() => {
    if (item) {
      setQuantity(item.quantity.toString())
      setUnitPrice(item.unitPrice.toString())
      setReason('')
    }
  }, [item])

  // Calculate Deltas
  const deltas = useMemo(() => {
    if (!item) return { deltaQty: 0, newSubtotal: 0, deltaSubtotal: 0, isValid: false }

    const q = parseFloat(quantity)
    const p = parseFloat(unitPrice)

    if (isNaN(q) || q <= 0 || isNaN(p) || p < 0) {
      return { deltaQty: 0, newSubtotal: 0, deltaSubtotal: 0, isValid: false }
    }

    const newSubtotal = q * p
    const deltaQty = q - item.quantity
    const deltaSubtotal = newSubtotal - item.subtotal

    return {
      deltaQty,
      newSubtotal,
      deltaSubtotal,
      isValid: true,
    }
  }, [item, quantity, unitPrice])

  // Mutation
  const correctMutation = useMutation({
    mutationFn: () =>
      purchaseApi.correctPurchaseItem(purchaseId, item!.id, {
        quantity: parseFloat(quantity),
        unitPrice: parseFloat(unitPrice),
        reason: reason.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Đã điều chỉnh dòng phiếu nhập và bù trừ tồn kho thành công')
      queryClient.invalidateQueries({ queryKey: ['purchase', purchaseId] })
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
      queryClient.invalidateQueries({ queryKey: ['stockMovements'] })
      if (onSuccess) onSuccess()
      onClose()
    },
    onError: (err: AxiosError<ApiResponse<unknown>>) => {
      const msg = err.response?.data?.message || 'Không thể điều chỉnh dòng phiếu nhập'
      toast.error(msg)
    },
  })

  if (!isOpen || !item) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const q = parseFloat(quantity)
    if (isNaN(q) || q <= 0) {
      toast.error('Số lượng điều chỉnh phải lớn hơn 0')
      return
    }

    const p = parseFloat(unitPrice)
    if (isNaN(p) || p < 0) {
      toast.error('Đơn giá không được âm')
      return
    }

    correctMutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-surface/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text">Điều chỉnh dòng phiếu nhập</h2>
              <p className="text-xs text-muted-foreground">Phiếu #{purchaseId} • Dòng #{item.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:bg-surface hover:text-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Target Ingredient Info */}
          <div className="p-3 rounded-lg bg-surface/50 border border-border space-y-1">
            <div className="text-xs text-muted-foreground">Nguyên liệu điều chỉnh:</div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text text-sm">{item.ingredientName}</span>
              <Badge variant="outline" className="text-xs bg-card">
                ĐVT: {item.unit}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground pt-1 flex items-center justify-between border-t border-border/40 mt-1">
              <span>Giá trị ban đầu:</span>
              <span>
                {item.quantity} {item.unit} × {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.unitPrice)} ={' '}
                <strong className="text-text">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.subtotal)}
                </strong>
              </span>
            </div>
          </div>

          {/* Quantity & Unit Price inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text flex items-center justify-between">
                <span>Số lượng thực tế mới</span>
                <span className="text-accent font-semibold">({item.unit})</span>
              </label>
              <Input
                type="number"
                step="0.001"
                min="0.001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text">Đơn giá mới (VNĐ)</label>
              <Input
                type="number"
                step="1000"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Reason input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Lý do điều chỉnh (ghi nhận kiểm toán kho)</span>
            </label>
            <Input
              type="text"
              placeholder="VD: Cân lại thực tế bị hụt 0.5kg, sửa sai sót đơn giá..."
              maxLength={255}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          {/* Delta Calculation Preview */}
          {deltas.isValid && (
            <div className="p-3.5 rounded-lg border border-border bg-card space-y-2 text-xs">
              <div className="font-semibold text-text flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Dự kiến thay đổi sau điều chỉnh:</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
                <div>
                  <span className="text-muted-foreground">Tồn kho biến động:</span>
                  <div className="font-bold mt-0.5">
                    {deltas.deltaQty > 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        +{deltas.deltaQty.toFixed(3)} {item.unit} (Cộng thêm)
                      </span>
                    ) : deltas.deltaQty < 0 ? (
                      <span className="text-amber-600 dark:text-amber-400">
                        {deltas.deltaQty.toFixed(3)} {item.unit} (Khấu trừ)
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Không đổi</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground">Thành tiền mới:</span>
                  <div className="font-bold mt-0.5 text-text">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                      deltas.newSubtotal
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={correctMutation.isPending}
              className="text-xs"
            >
              Hủy bỏ
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={correctMutation.isPending || !deltas.isValid}
              className="text-xs bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shadow-sm"
            >
              {correctMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang xử lý bù trừ kho...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác nhận Điều chỉnh</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
