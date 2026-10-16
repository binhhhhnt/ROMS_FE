import { useState } from 'react'
import { Edit2, Ban, Info, Receipt, ChevronLeft, ChevronRight, User, Calendar, AlertCircle } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import type { ExpenseResponse } from '@/features/expenses/types/expense.types'

interface ExpenseTableProps {
  expenses: ExpenseResponse[]
  isLoading: boolean
  currentPage: number
  totalPages: number
  totalElements: number
  onPageChange: (newPage: number) => void
  onEdit: (expense: ExpenseResponse) => void
  onCancel: (expense: ExpenseResponse) => void
}

export function ExpenseTable({
  expenses,
  isLoading,
  currentPage,
  totalPages,
  totalElements,
  onPageChange,
  onEdit,
  onCancel,
}: ExpenseTableProps) {
  const [viewingCancelReason, setViewingCancelReason] = useState<ExpenseResponse | null>(null)

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    try {
      const parts = dateStr.split('-')
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`
      }
      return dateStr
    } catch {
      return dateStr
    }
  }

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 shadow-xs">
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-10 bg-muted-bg rounded-md w-full" />
          <div className="h-16 bg-muted-bg/60 rounded-md w-full" />
          <div className="h-16 bg-muted-bg/60 rounded-md w-full" />
          <div className="h-16 bg-muted-bg/60 rounded-md w-full" />
        </div>
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center shadow-xs flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-surface/60 text-primary flex items-center justify-center mb-3">
          <Receipt className="w-7 h-7 text-accent" />
        </div>
        <h4 className="text-base font-bold text-text">Không có khoản chi phí nào</h4>
        <p className="text-xs text-muted max-w-sm mt-1">
          Chưa tìm thấy dữ liệu khoản chi phù hợp với bộ lọc hiện tại. Bạn có thể thêm mới hoặc đặt lại bộ lọc.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        {/* Table View for Desktop / Tablet */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface/40 border-b border-border text-text font-semibold">
                <th className="py-3.5 px-4 w-16 text-center">Mã</th>
                <th className="py-3.5 px-4 min-w-[180px]">Khoản chi / Mục đích</th>
                <th className="py-3.5 px-4 w-32 text-right">Số tiền</th>
                <th className="py-3.5 px-4 w-28 text-center">Ngày chi</th>
                <th className="py-3.5 px-4 min-w-[150px]">Người ghi nhận</th>
                <th className="py-3.5 px-4 min-w-[200px]">Ghi chú</th>
                <th className="py-3.5 px-4 w-28 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 w-28 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {expenses.map((item) => {
                const isCancelled = item.status === 'CANCELLED'

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-surface/20 transition-colors"
                  >
                    {/* ID */}
                    <td className="py-3.5 px-4 text-center font-mono font-medium text-muted">
                      #{item.id}
                    </td>

                    {/* Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-text text-sm">{item.name}</div>
                      {isCancelled && item.cancelReason && (
                        <div className="text-[11px] text-status-cancelled flex items-center gap-1 mt-0.5">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[200px]" title={item.cancelReason}>
                            Lý do: {item.cancelReason}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right font-bold font-mono text-sm">
                      <span className={isCancelled ? 'line-through text-muted' : 'text-text'}>
                        {formatVND(item.amount)}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-center text-text font-medium whitespace-nowrap">
                      {formatDate(item.expenseDate)}
                    </td>

                    {/* Created by */}
                    <td className="py-3.5 px-4 text-muted">
                      <div className="flex items-center gap-1.5 text-xs text-text">
                        <User className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span className="truncate">{item.createdByName || 'Hệ thống'}</span>
                      </div>
                    </td>

                    {/* Note */}
                    <td className="py-3.5 px-4 text-muted">
                      <p className="line-clamp-2 text-xs leading-relaxed" title={item.note || ''}>
                        {item.note || '-'}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {isCancelled ? (
                        <Badge variant="cancelled" className="cursor-pointer" onClick={() => setViewingCancelReason(item)}>
                          Đã hủy
                        </Badge>
                      ) : (
                        <Badge variant="ready">Hoạt động</Badge>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {!isCancelled ? (
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(item)}
                            className="h-8 w-8 p-0 text-accent hover:text-accent-hover hover:bg-surface/50"
                            title="Chỉnh sửa khoản chi"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onCancel(item)}
                            className="h-8 w-8 p-0 text-status-cancelled hover:text-status-cancelled/80 hover:bg-status-cancelled/10"
                            title="Hủy khoản chi"
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingCancelReason(item)}
                          className="text-xs text-muted hover:text-text h-7 px-2"
                        >
                          <Info className="w-3.5 h-3.5 mr-1" />
                          Chi tiết hủy
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-border bg-surface/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
          <div>
            Hiển thị <strong>{expenses.length}</strong> / <strong>{totalElements}</strong> khoản chi (Trang {currentPage + 1}/{Math.max(1, totalPages)})
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 0}
              className="h-8 px-2.5 text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Trang trước
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className="h-8 px-2.5 text-xs"
            >
              Trang sau
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Cancel Details Modal */}
      {viewingCancelReason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3 text-left">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-full bg-status-cancelled/15 text-status-cancelled">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-text">Thông tin hủy khoản chi</h4>
                <p className="text-xs text-muted">Mã: #{viewingCancelReason.id} - {viewingCancelReason.name}</p>
              </div>
            </div>

            <div className="bg-muted-bg/50 border border-border rounded-lg p-3 text-xs flex flex-col gap-2 mt-1">
              <div>
                <span className="text-muted block text-[11px]">Lý do hủy:</span>
                <span className="font-semibold text-status-cancelled">{viewingCancelReason.cancelReason || 'Không có lý do cụ thể'}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2 text-[11px]">
                <span className="text-muted flex items-center gap-1">
                  <User className="w-3 h-3 text-accent" />
                  Người hủy:
                </span>
                <span className="font-medium text-text">{viewingCancelReason.cancelledByName || 'Hệ thống'}</span>
              </div>
              {viewingCancelReason.cancelledAt && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-accent" />
                    Thời gian hủy:
                  </span>
                  <span className="text-text font-mono">
                    {new Date(viewingCancelReason.cancelledAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setViewingCancelReason(null)}
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
