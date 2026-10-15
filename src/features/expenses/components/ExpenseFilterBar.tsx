import { Plus, RotateCcw, Filter, Calendar } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

interface ExpenseFilterBarProps {
  startDate: string
  endDate: string
  status: string
  onStartDateChange: (val: string) => void
  onEndDateChange: (val: string) => void
  onStatusChange: (val: string) => void
  onReset: () => void
  onOpenCreateModal: () => void
}

export function ExpenseFilterBar({
  startDate,
  endDate,
  status,
  onStartDateChange,
  onEndDateChange,
  onStatusChange,
  onReset,
  onOpenCreateModal,
}: ExpenseFilterBarProps) {
  const isFiltered = Boolean(startDate || endDate || status !== 'ALL')

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-text">
          <Filter className="w-4 h-4 text-accent" />
          <span>Bộ lọc:</span>
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <Calendar className="w-3.5 h-3.5 text-muted absolute left-2.5 pointer-events-none" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="text-xs pl-8 pr-2.5 py-1.5 h-9 rounded-md border border-border bg-card text-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              title="Từ ngày"
            />
          </div>
          <span className="text-xs text-muted">đến</span>
          <div className="relative flex items-center">
            <Calendar className="w-3.5 h-3.5 text-muted absolute left-2.5 pointer-events-none" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="text-xs pl-8 pr-2.5 py-1.5 h-9 rounded-md border border-border bg-card text-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              title="Đến ngày"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center">
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="text-xs px-3 py-1.5 h-9 rounded-md border border-border bg-card text-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>

        {/* Reset button */}
        {isFiltered && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-muted hover:text-text h-9 px-2 text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Đặt lại
          </Button>
        )}
      </div>

      {/* Action: Add Expense */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={onOpenCreateModal}
          className="font-semibold shadow-sm w-full md:w-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Thêm khoản chi
        </Button>
      </div>
    </div>
  )
}
