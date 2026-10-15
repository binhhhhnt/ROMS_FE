import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { purchaseApi } from '@/features/purchasing/api/purchaseApi'
import { ingredientApi } from '@/features/inventory/api/ingredientApi'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  FileText,
  Boxes,
  Loader2,
  AlertCircle,
  Receipt,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import type { AxiosError } from 'axios'
import type { ApiResponse } from '@/shared/types/api.types'

interface FormItemRow {
  tempId: string
  ingredientId: number | ''
  quantity: string
  unitPrice: string
}

export function CreatePurchasePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Form general state
  const [purchaseDate, setPurchaseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [note, setNote] = useState<string>('')

  // Item rows state (starts with 1 empty row)
  const [rows, setRows] = useState<FormItemRow[]>([
    {
      tempId: 'row-1',
      ingredientId: '',
      quantity: '',
      unitPrice: '',
    },
  ])

  // Fetch active ingredients list
  const { data: ingredientsData, isLoading: isLoadingIngredients } = useQuery({
    queryKey: ['ingredients', 'active-for-purchase'],
    queryFn: () => ingredientApi.getIngredients({ isActive: true, size: 300 }),
  })

  const ingredients = ingredientsData?.content || []

  // Map ingredients by ID for quick lookup
  const ingredientMap = useMemo(() => {
    const map = new Map<number, (typeof ingredients)[0]>()
    ingredients.forEach((ing) => map.set(ing.id, ing))
    return map
  }, [ingredients])

  // Calculate row subtotal and grand total
  const totals = useMemo(() => {
    let grandTotal = 0
    const rowSubtotals = rows.map((row) => {
      const q = parseFloat(row.quantity)
      const p = parseFloat(row.unitPrice)
      if (!isNaN(q) && q > 0 && !isNaN(p) && p >= 0) {
        const sub = q * p
        grandTotal += sub
        return sub
      }
      return 0
    })
    return { rowSubtotals, grandTotal }
  }, [rows])

  // Add row
  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        tempId: `row-${Date.now()}-${Math.random()}`,
        ingredientId: '',
        quantity: '',
        unitPrice: '',
      },
    ])
  }

  // Remove row
  const handleRemoveRow = (tempId: string) => {
    if (rows.length === 1) {
      toast.warning('Phiếu nhập hàng cần ít nhất 1 dòng nguyên liệu')
      return
    }
    setRows((prev) => prev.filter((r) => r.tempId !== tempId))
  }

  // Update row field
  const handleUpdateRow = (
    tempId: string,
    field: keyof Omit<FormItemRow, 'tempId'>,
    value: string | number
  ) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.tempId === tempId) {
          return { ...r, [field]: value }
        }
        return r
      })
    )
  }

  // Mutation
  const createMutation = useMutation({
    mutationFn: purchaseApi.createPurchase,
    onSuccess: (res) => {
      toast.success('Tạo phiếu nhập hàng thành công! Đã tự động cập nhật kho.')
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
      queryClient.invalidateQueries({ queryKey: ['stockMovements'] })
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      navigate(`/inventory/purchases/${res.id}`)
    },
    onError: (err: AxiosError<ApiResponse<unknown>>) => {
      const msg = err.response?.data?.message || 'Không thể tạo phiếu nhập hàng'
      toast.error(msg)
    },
  })

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!purchaseDate) {
      toast.error('Vui lòng chọn ngày nhập hàng')
      return
    }

    if (rows.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 nguyên liệu vào phiếu nhập')
      return
    }

    // Validate rows
    const itemsPayload: { ingredientId: number; quantity: number; unitPrice: number }[] = []
    const seenIngredientIds = new Set<number>()

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (row.ingredientId === '') {
        toast.error(`Dòng ${i + 1}: Vui lòng chọn nguyên liệu`)
        return
      }

      const q = parseFloat(row.quantity)
      if (isNaN(q) || q <= 0) {
        toast.error(`Dòng ${i + 1}: Số lượng nhập phải lớn hơn 0`)
        return
      }

      const p = parseFloat(row.unitPrice)
      if (isNaN(p) || p < 0) {
        toast.error(`Dòng ${i + 1}: Đơn giá không được âm`)
        return
      }

      if (seenIngredientIds.has(row.ingredientId)) {
        const ingName = ingredientMap.get(row.ingredientId)?.name || `ID ${row.ingredientId}`
        toast.warning(
          `Nguyên liệu "${ingName}" bị lặp lại ở nhiều dòng. Bạn có thể gộp số lượng vào 1 dòng duy nhất.`
        )
      }
      seenIngredientIds.add(row.ingredientId)

      itemsPayload.push({
        ingredientId: row.ingredientId,
        quantity: q,
        unitPrice: p,
      })
    }

    createMutation.mutate({
      purchaseDate,
      note: note.trim() || undefined,
      items: itemsPayload,
    })
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header & Back link */}
      <div>
        <Link
          to="/inventory/purchases"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại danh sách phiếu nhập</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text flex items-center gap-2">
              <Receipt className="w-6 h-6 text-accent" />
              Tạo Phiếu Nhập Hàng Mới
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Ghi nhận nguyên vật liệu mua vào thực tế để tăng số lượng tồn kho tương ứng.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: General Info */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-text uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent" />
            Thông tin chung phiếu nhập
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            {/* Purchase Date */}
            <div className="sm:col-span-4 space-y-1.5">
              <label className="text-xs font-medium text-text flex items-center gap-1">
                <span>Ngày nhập kho</span>
                <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            {/* Note */}
            <div className="sm:col-span-8 space-y-1.5">
              <label className="text-xs font-medium text-text flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Ghi chú / Nguồn nhập (Tối đa 255 ký tự)</span>
              </label>
              <Input
                type="text"
                placeholder="VD: Nhập thịt bò tươi sáng sớm từ chợ đầu mối..."
                maxLength={255}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Items List */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-text uppercase tracking-wider flex items-center gap-2">
                <Boxes className="w-4 h-4 text-accent" />
                Danh sách nguyên vật liệu nhập
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Mỗi dòng nguyên liệu sẽ được tự động cộng dồn vào tồn kho ngay khi lưu phiếu.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddRow}
              className="text-xs flex items-center gap-1 border-accent/30 text-accent hover:bg-accent/10"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm dòng
            </Button>
          </div>

          {/* Table */}
          <div className="border border-border rounded-lg overflow-x-auto bg-surface/10">
            <table className="w-full text-xs">
              <thead className="bg-surface/50 border-b border-border text-muted-foreground font-medium">
                <tr>
                  <th className="px-3 py-2.5 text-center w-10">STT</th>
                  <th className="px-3 py-2.5 text-left min-w-[200px]">Nguyên liệu</th>
                  <th className="px-3 py-2.5 text-center w-20">ĐVT</th>
                  <th className="px-3 py-2.5 text-right w-24">Tồn hiện tại</th>
                  <th className="px-3 py-2.5 text-right min-w-[110px]">Số lượng nhập</th>
                  <th className="px-3 py-2.5 text-right min-w-[130px]">Đơn giá (VNĐ)</th>
                  <th className="px-3 py-2.5 text-right min-w-[130px]">Thành tiền (VNĐ)</th>
                  <th className="px-2 py-2.5 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row, idx) => {
                  const selectedIng =
                    row.ingredientId !== '' ? ingredientMap.get(row.ingredientId) : null
                  const rowSubtotal = totals.rowSubtotals[idx] || 0

                  return (
                    <tr key={row.tempId} className="hover:bg-surface/30 transition-colors">
                      {/* STT */}
                      <td className="px-3 py-2.5 text-center text-muted-foreground font-mono">
                        {idx + 1}
                      </td>

                      {/* Ingredient Selector */}
                      <td className="px-3 py-2.5">
                        <select
                          value={row.ingredientId}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Number(e.target.value)
                            handleUpdateRow(row.tempId, 'ingredientId', val)
                          }}
                          disabled={isLoadingIngredients}
                          className="w-full h-8 px-2.5 rounded border border-input bg-card text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                        >
                          <option value="">-- Chọn nguyên liệu kho --</option>
                          {ingredients.map((ing) => (
                            <option key={ing.id} value={ing.id}>
                              {ing.name} ({ing.unit})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Unit */}
                      <td className="px-3 py-2.5 text-center">
                        {selectedIng ? (
                          <Badge variant="outline" className="text-[11px] bg-card">
                            {selectedIng.unit}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground italic">—</span>
                        )}
                      </td>

                      {/* Current Stock */}
                      <td className="px-3 py-2.5 text-right text-muted-foreground font-mono">
                        {selectedIng ? (
                          <span>{selectedIng.currentStock}</span>
                        ) : (
                          <span className="italic">—</span>
                        )}
                      </td>

                      {/* Quantity */}
                      <td className="px-3 py-2.5 text-right">
                        <Input
                          type="number"
                          step="0.001"
                          min="0.001"
                          placeholder="0.0"
                          value={row.quantity}
                          onChange={(e) =>
                            handleUpdateRow(row.tempId, 'quantity', e.target.value)
                          }
                          className="h-8 text-xs text-right py-0"
                          required
                        />
                      </td>

                      {/* Unit Price */}
                      <td className="px-3 py-2.5 text-right">
                        <Input
                          type="number"
                          step="1000"
                          min="0"
                          placeholder="0"
                          value={row.unitPrice}
                          onChange={(e) =>
                            handleUpdateRow(row.tempId, 'unitPrice', e.target.value)
                          }
                          className="h-8 text-xs text-right py-0"
                          required
                        />
                      </td>

                      {/* Subtotal */}
                      <td className="px-3 py-2.5 text-right font-semibold text-text">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(rowSubtotal)}
                      </td>

                      {/* Delete */}
                      <td className="px-2 py-2.5 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRow(row.tempId)}
                          disabled={rows.length === 1}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Xóa dòng"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Table Summary Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-accent" />
              <span>
                Tổng cộng: <strong>{rows.length}</strong> dòng nguyên liệu
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Tổng tiền phiếu nhập:
              </span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(totals.grandTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/inventory/purchases')}
            disabled={createMutation.isPending}
            className="text-xs"
          >
            Hủy bỏ
          </Button>

          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="text-xs bg-accent hover:bg-accent-hover text-white flex items-center gap-1.5 px-5 shadow-sm"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang ghi nhận nhập kho...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác nhận Nhập kho</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
