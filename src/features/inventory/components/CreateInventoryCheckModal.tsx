import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  X,
  Plus,
  Trash2,
  ClipboardCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { inventoryCheckApi } from '@/features/inventory/api/inventoryCheckApi'
import { ingredientApi } from '@/features/inventory/api/ingredientApi'
import type { IngredientResponse } from '@/features/inventory/types/ingredient.types'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

interface CheckDraftItem {
  ingredient: IngredientResponse
  actualQuantity: string
  reason: string
}

interface CreateInventoryCheckModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const COMMON_REASONS = [
  'Kiểm kê định kỳ khớp tồn',
  'Hao hụt tự nhiên trong bảo quản',
  'Nguyên liệu hỏng / rách bao / hết hạn',
  'Sai lệch nhập xuất chưa ghi nhận',
  'Đầu bếp dùng thử nghiệm món mới',
]

export function CreateInventoryCheckModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateInventoryCheckModalProps) {
  const [note, setNote] = useState('')
  const [checkDate, setCheckDate] = useState(() => {
    const now = new Date()
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
  })
  const [items, setItems] = useState<CheckDraftItem[]>([])
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch all ingredients for selection
  const { data: ingredientsData } = useQuery({
    queryKey: ['all-ingredients-for-check'],
    queryFn: () => ingredientApi.getIngredients({ size: 100, isActive: true }),
    enabled: isOpen,
  })

  if (!isOpen) return null

  const handleAddIngredient = () => {
    if (!selectedIngredientId) return
    const id = Number(selectedIngredientId)
    const exists = items.some((i) => i.ingredient.id === id)
    if (exists) {
      toast.warning('Nguyên liệu này đã có trong danh sách kiểm kê bên dưới')
      return
    }

    const ing = ingredientsData?.content?.find((i) => i.id === id)
    if (!ing) return

    setItems((prev) => [
      ...prev,
      {
        ingredient: ing,
        actualQuantity: String(ing.currentStock ?? 0),
        reason: 'Kiểm kê định kỳ khớp tồn',
      },
    ])
    setSelectedIngredientId('')
  }

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleQuantityChange = (index: number, val: string) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, actualQuantity: val } : item))
    )
  }

  const handleReasonChange = (index: number, val: string) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, reason: val } : item))
    )
  }

  const handleAddAllIngredients = () => {
    if (!ingredientsData?.content) return
    const allDrafts: CheckDraftItem[] = ingredientsData.content.map((ing) => ({
      ingredient: ing,
      actualQuantity: String(ing.currentStock ?? 0),
      reason: 'Kiểm kê định kỳ khớp tồn',
    }))
    setItems(allDrafts)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate
    if (items.length === 0) {
      toast.error('Vui lòng thêm ít nhất một nguyên liệu vào đợt kiểm kê')
      return
    }

    for (const item of items) {
      const parsed = Number(item.actualQuantity)
      if (isNaN(parsed) || parsed < 0) {
        toast.error(`Số lượng thực tế của "${item.ingredient.name}" phải là số >= 0`)
        return
      }
    }

    setIsSubmitting(true)
    try {
      await inventoryCheckApi.createInventoryCheck({
        note: note.trim() || null,
        checkedAt: checkDate ? new Date(checkDate).toISOString() : null,
        items: items.map((i) => ({
          ingredientId: i.ingredient.id,
          actualQuantity: Number(i.actualQuantity),
          reason: i.reason.trim() || null,
        })),
      })

      toast.success('Đã hoàn tất đợt kiểm kê & cập nhật số dư kho!')
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col gap-4 text-left overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-surface text-primary">
              <ClipboardCheck className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-text">Lập đợt kiểm kê & điều chỉnh kho</h3>
              <p className="text-xs text-muted">
                Đối chiếu số lượng thực đếm với tồn kho máy chủ, tự động cập nhật số dư kho và sinh biến động.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted hover:text-text hover:bg-surface/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
          {/* General Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-xl bg-surface/30 border border-border shrink-0">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text">
                Thời điểm kiểm đếm thực tế
              </label>
              <Input
                type="datetime-local"
                value={checkDate}
                onChange={(e) => setCheckDate(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text">
                Ghi chú đợt kiểm kê (Tùy chọn)
              </label>
              <Input
                placeholder="Ví dụ: Kiểm kê định kỳ cuối ca tối, Kiểm đếm đột xuất kho mát..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          {/* Add Item Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-card border border-border rounded-xl shrink-0">
            <div className="flex-1">
              <select
                value={selectedIngredientId}
                onChange={(e) => setSelectedIngredientId(e.target.value)}
                className="w-full text-xs border border-border rounded-lg px-3 py-2 bg-background text-text focus:outline-none focus:border-accent"
              >
                <option value="">-- Chọn nguyên liệu thêm vào kiểm kê --</option>
                {ingredientsData?.content?.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    #{ing.id} - {ing.name} (Tồn hiện tại: {ing.currentStock} {ing.unit})
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleAddIngredient}
              disabled={!selectedIngredientId}
              className="text-xs"
            >
              <Plus className="w-4 h-4 mr-1" />
              Thêm mặt hàng
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddAllIngredients}
              className="text-xs"
              title="Thêm toàn bộ nguyên liệu đang hoạt động để kiểm kê toàn diện"
            >
              Thêm tất cả nguyên liệu
            </Button>
          </div>

          {/* Items Table */}
          <div className="border border-border rounded-xl overflow-hidden shrink-0">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface/60 border-b border-border uppercase font-semibold text-primary">
                <tr>
                  <th className="py-2.5 px-3">Nguyên liệu</th>
                  <th className="py-2.5 px-3 w-28 text-right">Tồn hệ thống</th>
                  <th className="py-2.5 px-3 w-36 text-right">Thực tế đếm</th>
                  <th className="py-2.5 px-3 w-28 text-right">Chênh lệch</th>
                  <th className="py-2.5 px-3">Lý do điều chỉnh</th>
                  <th className="py-2.5 px-3 w-12 text-center">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted">
                      <HelpCircle className="w-6 h-6 mx-auto mb-1 text-muted/60" />
                      <span>Chưa có nguyên liệu nào trong đợt kiểm kê này. Vui lòng chọn ở trên.</span>
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => {
                    const actual = Number(item.actualQuantity) || 0
                    const system = item.ingredient.currentStock || 0
                    const diff = actual - system
                    const isDiff = diff !== 0

                    return (
                      <tr key={item.ingredient.id} className="hover:bg-surface/20">
                        {/* Name */}
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-text">
                            {item.ingredient.name}
                          </span>
                          <span className="text-[11px] font-mono text-muted block">
                            #{item.ingredient.id} &bull; {item.ingredient.unit}
                          </span>
                        </td>

                        {/* System Qty */}
                        <td className="py-2.5 px-3 text-right font-mono font-medium text-muted">
                          {system} {item.ingredient.unit}
                        </td>

                        {/* Actual Qty Input */}
                        <td className="py-2.5 px-3 text-right">
                          <Input
                            type="number"
                            step="any"
                            min="0"
                            value={item.actualQuantity}
                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                            className="text-right font-mono font-bold h-8 text-xs max-w-[130px] ml-auto"
                          />
                        </td>

                        {/* Difference */}
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          <span
                            className={
                              diff > 0
                                ? 'text-status-ready'
                                : diff < 0
                                ? 'text-status-cancelled'
                                : 'text-muted'
                            }
                          >
                            {diff > 0 && '+'}
                            {diff.toLocaleString('vi-VN', { maximumFractionDigits: 3 })}
                          </span>
                        </td>

                        {/* Reason Input with quick select */}
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col gap-1">
                            <input
                              list={`reasons-${index}`}
                              value={item.reason}
                              onChange={(e) => handleReasonChange(index, e.target.value)}
                              placeholder={isDiff ? 'Bắt buộc nhập lý do chênh lệch' : 'Khớp tồn kho'}
                              className="w-full text-xs border border-border rounded px-2 py-1 bg-background text-text focus:outline-none focus:border-accent"
                            />
                            <datalist id={`reasons-${index}`}>
                              {COMMON_REASONS.map((r) => (
                                <option key={r} value={r} />
                              ))}
                            </datalist>
                          </div>
                        </td>

                        {/* Delete */}
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-muted hover:text-status-cancelled p-1 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Warning callout */}
          <div className="p-3 bg-status-pending/10 border border-status-pending/30 rounded-xl flex items-start gap-2 text-xs text-text shrink-0">
            <AlertCircle className="w-4 h-4 text-status-pending shrink-0 mt-0.5" />
            <span>
              <strong>Lưu ý:</strong> Khi hoàn tất, hệ thống sẽ ghi nhận số dư tồn kho mới bằng đúng <em>Thực tế đếm</em>. Các chênh lệch sẽ tự động được ghi vết vào Lịch sử Biến động Kho dưới loại <code>INVENTORY_ADJUSTMENT</code>.
            </span>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border shrink-0">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              disabled={items.length === 0}
            >
              Hoàn tất kiểm kê & Cập nhật kho
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
