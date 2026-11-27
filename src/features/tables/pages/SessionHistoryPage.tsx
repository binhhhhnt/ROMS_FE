import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw, Filter, Search, RotateCcw } from 'lucide-react'

import { tableApi } from '@/features/tables/api/tableApi'
import type { ServiceSessionStatus } from '@/features/tables/types/table.types'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'

export function SessionHistoryPage() {
  const [statusFilter, setStatusFilter] = useState<ServiceSessionStatus | ''>('')
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(0)

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['sessionsHistory', statusFilter, search, fromDate, toDate, page],
    queryFn: () =>
      tableApi.getSessions({
        status: statusFilter || undefined,
        search: search.trim() || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page,
        size: 15,
        sort: 'openedAt,desc',
      }),
  })

  const hasActiveFilters = Boolean(statusFilter || search.trim() || fromDate || toDate)

  const handleResetFilters = () => {
    setStatusFilter('')
    setSearch('')
    setFromDate('')
    setToDate('')
    setPage(0)
  }

  const sessions = data?.content || []
  const totalPages = data?.totalPages || 0
  const totalElements = data?.totalElements || 0

  return (
    <div className="flex flex-col gap-5 text-left">
      {/* Tầng 1: Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-text">
            Lịch sử phiên phục vụ
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Tra cứu toàn bộ các phiên phục vụ tại bàn, thời gian mở/đóng và người phụ trách.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-9 px-3 text-xs shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Tầng 2: Filter Toolbar */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3 p-3.5 bg-card border border-border rounded-lg">
        <div className="flex-1 min-w-0">
          <Input
            placeholder="Tìm theo mã phiên (vd: S-2026...) hoặc mã bàn..."
            leftIcon={<Search className="w-4 h-4 text-muted" />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
          />
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
            <span className="text-xs text-muted whitespace-nowrap">Từ</span>
            <Input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(e) => {
                setFromDate(e.target.value)
                setPage(0)
              }}
              className="h-10 text-xs w-full sm:w-36"
              aria-label="Từ ngày"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
            <span className="text-xs text-muted whitespace-nowrap">Đến</span>
            <Input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => {
                setToDate(e.target.value)
                setPage(0)
              }}
              className="h-10 text-xs w-full sm:w-36"
              aria-label="Đến ngày"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-muted shrink-0" />
            <select
              className="flex h-10 w-full sm:w-48 rounded-md border border-border bg-card px-3 py-2 text-xs text-text focus:outline-hidden focus:ring-2 focus:ring-accent"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter((e.target.value as ServiceSessionStatus) || '')
                setPage(0)
              }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
              <option value="CLOSED">Đã hoàn tất (CLOSED)</option>
            </select>
          </div>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="h-10 px-3 text-xs shrink-0"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Tầng 3: Sessions Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/60 text-muted font-medium">
                <th className="py-3 px-4 whitespace-nowrap">Mã phiên</th>
                <th className="py-3 px-4 whitespace-nowrap">Bàn ăn</th>
                <th className="py-3 px-4 whitespace-nowrap">Trạng thái</th>
                <th className="py-3 px-4 whitespace-nowrap">Thời gian mở</th>
                <th className="py-3 px-4 whitespace-nowrap">Người mở</th>
                <th className="py-3 px-4 whitespace-nowrap">Thời gian đóng</th>
                <th className="py-3 px-4 whitespace-nowrap">Người đóng</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted">
                    <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Đang tải lịch sử phiên...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-muted">
                    Không có phiên phục vụ nào trong hệ thống.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-muted-bg/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-text whitespace-nowrap">
                      {s.sessionCode || `#${s.id}`}
                    </td>
                    <td className="py-3 px-4 font-semibold text-text whitespace-nowrap">
                      Bàn {s.tableCode}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {s.status === 'ACTIVE' ? (
                        <Badge variant="cooking">
                          <span className="w-2 h-2 rounded-full bg-status-cooking shrink-0" />
                          Đang phục vụ
                        </Badge>
                      ) : (
                        <Badge variant="completed">Đã đóng</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted tabular-nums whitespace-nowrap">
                      {new Date(s.openedAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 text-text font-medium whitespace-nowrap">
                      {s.openedByName || '—'}
                    </td>
                    <td className="py-3 px-4 text-muted tabular-nums whitespace-nowrap">
                      {s.closedAt ? new Date(s.closedAt).toLocaleString('vi-VN') : '—'}
                    </td>
                    <td className="py-3 px-4 text-text font-medium whitespace-nowrap">
                      {s.closedByName || '—'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Link to={`/sessions/${s.id}`}>
                        <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs">
                          Chi tiết
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between bg-card text-xs">
            <span className="text-muted">
              Tổng số: <strong className="text-text">{totalElements}</strong> phiên phục vụ
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="h-8 px-2.5"
              >
                Trước
              </Button>
              <span className="px-2 font-mono font-medium tabular-nums">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 px-2.5"
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
export default SessionHistoryPage
