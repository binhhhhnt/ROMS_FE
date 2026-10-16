import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { History, RefreshCw, Filter } from 'lucide-react'

import { tableApi } from '@/features/tables/api/tableApi'
import type { ServiceSessionStatus } from '@/features/tables/types/table.types'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'

export function SessionHistoryPage() {
  const [statusFilter, setStatusFilter] = useState<ServiceSessionStatus | ''>('')
  const [page, setPage] = useState(0)

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['sessionsHistory', statusFilter, page],
    queryFn: () =>
      tableApi.getSessions({
        status: statusFilter || undefined,
        page,
        size: 15,
        sort: 'openedAt,desc',
      }),
  })

  const sessions = data?.content || []
  const totalPages = data?.totalPages || 0
  const totalElements = data?.totalElements || 0

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <History className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text">
              Lịch sử phiên phục vụ
            </h1>
            <p className="text-xs text-muted">
              Tra cứu toàn bộ các phiên phục vụ tại bàn, thời gian mở/đóng và người phụ trách.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl shadow-xs">
        <Filter className="w-4 h-4 text-muted shrink-0" />
        <select
          className="flex h-10 w-48 rounded-lg border border-border bg-card px-3 py-2 text-xs text-text shadow-xs focus:outline-hidden focus:ring-2 focus:ring-accent"
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

      {/* Sessions Table */}
      <div className="bg-card border border-border shadow-md rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface/50 text-muted uppercase tracking-wider font-semibold">
              <th className="py-3 px-4">Mã phiên</th>
              <th className="py-3 px-4">Bàn ăn</th>
              <th className="py-3 px-4">Trạng thái</th>
              <th className="py-3 px-4">Thời gian mở</th>
              <th className="py-3 px-4">Người mở</th>
              <th className="py-3 px-4">Thời gian đóng</th>
              <th className="py-3 px-4">Người đóng</th>
              <th className="py-3 px-4 text-right">Thao tác</th>
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
                <tr key={s.id} className="hover:bg-surface/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-primary">#{s.id}</td>
                  <td className="py-3 px-4 font-semibold text-text uppercase">
                    Bàn {s.tableCode}
                  </td>
                  <td className="py-3 px-4">
                    {s.status === 'ACTIVE' ? (
                      <Badge variant="cooking">Đang phục vụ</Badge>
                    ) : (
                      <Badge variant="completed">Đã đóng</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-muted">
                    {new Date(s.openedAt).toLocaleString('vi-VN')}
                  </td>
                  <td className="py-3 px-4 text-text font-medium">{s.openedByName || '-'}</td>
                  <td className="py-3 px-4 text-muted">
                    {s.closedAt ? new Date(s.closedAt).toLocaleString('vi-VN') : '-'}
                  </td>
                  <td className="py-3 px-4 text-text font-medium">{s.closedByName || '-'}</td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/staff/sessions/${s.id}`}
                      className="inline-flex items-center text-xs font-semibold text-primary hover:underline"
                    >
                      Chi tiết &rarr;
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between bg-surface/20 text-xs">
            <span className="text-muted">
              Tổng số: <strong>{totalElements}</strong> phiên phục vụ
            </span>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="h-8 px-2"
              >
                Trước
              </Button>
              <span className="px-2 font-medium">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 px-2"
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
