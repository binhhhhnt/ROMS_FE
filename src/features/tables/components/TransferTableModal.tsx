import { useState } from 'react'
import { X, ArrowRightLeft, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

import { tableApi } from '@/features/tables/api/tableApi'
import type { TableItem } from '@/features/tables/types/table.types'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { Button } from '@/shared/components/ui/button'

interface TransferTableModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  currentTable: TableItem | null
  availableEmptyTables: TableItem[]
}

export function TransferTableModal({
  isOpen,
  onClose,
  onSuccess,
  currentTable,
  availableEmptyTables,
}: TransferTableModalProps) {
  const [selectedTargetTableId, setSelectedTargetTableId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !currentTable || !currentTable.activeSessionId) return null

  // Filter out the current table from destination options
  const targetOptions = availableEmptyTables.filter(
    (t) => t.id !== currentTable.id && t.realtimeStatus === 'EMPTY' && t.isActive
  )

  const handleTransfer = async () => {
    if (!selectedTargetTableId) {
      toast.error('Vui lòng chọn bàn ăn đích để chuyển đến')
      return
    }

    setIsSubmitting(true)
    try {
      await tableApi.transferTable(currentTable.activeSessionId!, Number(selectedTargetTableId))
      const targetTable = targetOptions.find((t) => t.id === Number(selectedTargetTableId))
      toast.success(
        `Chuyển phiên phục vụ từ Bàn ${currentTable.tableCode} sang Bàn ${
          targetTable?.tableCode || selectedTargetTableId
        } thành công!`
      )
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50 duration-200">
      <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center font-bold">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text">
                Chuyển bàn: Bàn {currentTable.tableCode}
              </h2>
              <span className="text-[11px] text-muted">
                Chuyển toàn bộ đơn hàng và phiên phục vụ sang bàn trống mới
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted hover:text-text hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4 text-left">
          <div className="p-3 bg-surface/50 border border-border rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-[11px] text-muted block">Bàn xuất phát:</span>
              <strong className="text-sm font-bold text-text">
                Bàn {currentTable.tableCode} ({currentTable.capacity} chỗ)
              </strong>
            </div>
            <ArrowRightLeft className="w-5 h-5 text-accent" />
            <div className="text-right">
              <span className="text-[11px] text-muted block">Phiên phục vụ:</span>
              <span className="font-mono font-semibold text-primary">
                #{currentTable.activeSessionId}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="targetTable" className="text-xs font-semibold text-text">
              Chọn bàn ăn trống chuyển tới:
            </label>
            {targetOptions.length === 0 ? (
              <div className="p-3 bg-status-cancelled/10 border border-status-cancelled/20 text-status-cancelled rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Hiện không có bàn ăn nào đang trống để thực hiện chuyển bàn.</span>
              </div>
            ) : (
              <select
                id="targetTable"
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-text shadow-xs focus:outline-hidden focus:ring-2 focus:ring-accent"
                value={selectedTargetTableId}
                onChange={(e) => setSelectedTargetTableId(e.target.value)}
              >
                <option value="">-- Chọn bàn ăn đích --</option>
                {targetOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    Bàn {t.tableCode} (Sức chứa: {t.capacity} khách {t.area ? `- Khu ${t.area}` : ''})
                  </option>
                ))}
              </select>
            )}
          </div>

          <p className="text-[11px] text-muted leading-relaxed">
            * Lưu ý: Khi chuyển bàn, toàn bộ các món ăn đang phục vụ, đã gọi hoặc đang chế biến trong bếp sẽ được tự động đồng bộ sang bàn mới.
          </p>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Hủy bỏ
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              disabled={!selectedTargetTableId || targetOptions.length === 0 || isSubmitting}
              onClick={handleTransfer}
            >
              <ArrowRightLeft className="w-4 h-4 mr-1.5" />
              Xác nhận chuyển bàn
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
