import { useQuery } from '@tanstack/react-query'
import { X, Calendar, User, FileText, CheckCircle2, TrendingUp, TrendingDown, HelpCircle } from 'lucide-react'
import { inventoryCheckApi } from '@/features/inventory/api/inventoryCheckApi'
import { Button } from '@/shared/components/ui/button'

interface InventoryCheckDetailDrawerProps {
  checkId: number | null
  isOpen: boolean
  onClose: () => void
}

export function InventoryCheckDetailDrawer({
  checkId,
  isOpen,
  onClose,
}: InventoryCheckDetailDrawerProps) {
  const { data: check, isLoading } = useQuery({
    queryKey: ['inventory-check-detail', checkId],
    queryFn: () => (checkId ? inventoryCheckApi.getInventoryCheckById(checkId) : null),
    enabled: isOpen && checkId !== null,
  })

  if (!isOpen) return null

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '—'
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr))
  }

  const items = check?.items || []
  const matchedCount = items.filter((i) => i.difference === 0).length
  const surplusCount = items.filter((i) => i.difference > 0).length
  const deficitCount = items.filter((i) => i.difference < 0).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-3xl w-full max-h-[85vh] shadow-2xl flex flex-col gap-4 text-left overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-text">
                Chi tiết Phiếu kiểm kê #{checkId}
              </h3>
            </div>
            <p className="text-xs text-muted">
              Biên bản đối chiếu tồn kho và ghi nhận xử lý chênh lệch
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted hover:text-text hover:bg-surface/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-muted">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Đang nạp chi tiết đợt kiểm kê...</span>
          </div>
        ) : !check ? (
          <div className="py-12 text-center text-muted">
            <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Không tìm thấy thông tin phiếu kiểm kê này.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
            {/* Meta cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-surface/30 border border-border rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent shrink-0" />
                <div>
                  <span className="text-muted block text-[11px]">Thời điểm kiểm đếm</span>
                  <span className="font-semibold text-text">{formatDateTime(check.checkedAt)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-accent shrink-0" />
                <div>
                  <span className="text-muted block text-[11px]">Người thực hiện</span>
                  <span className="font-semibold text-text">
                    {check.checkedByName || (check.checkedById ? `Tài khoản #${check.checkedById}` : '—')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent shrink-0" />
                <div>
                  <span className="text-muted block text-[11px]">Ghi chú biên bản</span>
                  <span className="font-semibold text-text">{check.note || 'Không có ghi chú'}</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-surface/50 border border-border">
                <div className="flex items-center justify-center gap-1 text-status-ready font-semibold mb-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Khớp tồn kho</span>
                </div>
                <span className="text-lg font-bold text-text">{matchedCount}</span> mặt hàng
              </div>

              <div className="p-2.5 rounded-lg bg-status-ready/10 border border-status-ready/20">
                <div className="flex items-center justify-center gap-1 text-status-ready font-semibold mb-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Lệch thừa (+)</span>
                </div>
                <span className="text-lg font-bold text-status-ready">{surplusCount}</span> mặt hàng
              </div>

              <div className="p-2.5 rounded-lg bg-status-cancelled/10 border border-status-cancelled/20">
                <div className="flex items-center justify-center gap-1 text-status-cancelled font-semibold mb-0.5">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Lệch thiếu (-)</span>
                </div>
                <span className="text-lg font-bold text-status-cancelled">{deficitCount}</span> mặt hàng
              </div>
            </div>

            {/* Detailed Items Table */}
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface/60 border-b border-border uppercase font-semibold text-primary">
                  <tr>
                    <th className="py-2.5 px-3">Nguyên liệu</th>
                    <th className="py-2.5 px-3 text-right">Tồn hệ thống</th>
                    <th className="py-2.5 px-3 text-right">Thực tế đếm</th>
                    <th className="py-2.5 px-3 text-right">Chênh lệch</th>
                    <th className="py-2.5 px-3">Lý do điều chỉnh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted">
                        Đợt kiểm kê xác nhận không có mặt hàng nào.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const diff = item.difference
                      return (
                        <tr key={item.id} className="hover:bg-surface/20">
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-text">{item.ingredientName}</span>
                            <span className="text-[11px] font-mono text-muted block">
                              Mã NL: #{item.ingredientId}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-muted">
                            {item.systemQuantity.toLocaleString('vi-VN')} {item.unit}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-text">
                            {item.actualQuantity.toLocaleString('vi-VN')} {item.unit}
                          </td>
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
                              {diff.toLocaleString('vi-VN', { maximumFractionDigits: 3 })} {item.unit}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-muted">
                            {item.reason || '—'}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-border shrink-0">
          <Button variant="outline" size="md" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  )
}
