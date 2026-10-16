import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ClipboardCheck,
  Plus,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertTriangle,
} from 'lucide-react'

import { inventoryCheckApi } from '@/features/inventory/api/inventoryCheckApi'
import { CreateInventoryCheckModal } from '@/features/inventory/components/CreateInventoryCheckModal'
import { InventoryCheckDetailDrawer } from '@/features/inventory/components/InventoryCheckDetailDrawer'
import { useAuthStore } from '@/app/store/authStore'
import { Button } from '@/shared/components/ui/button'

const PAGE_SIZE = 15

export function InventoryChecksPage() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const [page, setPage] = useState(0)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedCheckId, setSelectedCheckId] = useState<number | null>(null)

  const isOwner = user?.role === 'OWNER'
  const isInventoryStaff = user?.role === 'INVENTORY_STAFF'
  const canCreate = isOwner || isInventoryStaff

  const {
    data: pageData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['inventory-checks', { page, size: PAGE_SIZE }],
    queryFn: () => inventoryCheckApi.getInventoryChecks(page, PAGE_SIZE),
  })

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '—'
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr))
  }

  const handleCreateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory-checks'] })
    queryClient.invalidateQueries({ queryKey: ['ingredients'] })
    queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
  }

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-surface text-primary shadow-xs">
            <ClipboardCheck className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-primary">
              Kiểm kê & Điều chỉnh kho
            </h1>
            <p className="text-xs md:text-sm text-muted">
              Quản lý các đợt kiểm kê tồn kho thực tế, đối chiếu chênh lệch và tự động cập nhật số dư kho.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-text hover:bg-surface/50"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>

          {canCreate && (
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsCreateModalOpen(true)}
              className="shadow-sm font-semibold text-xs md:text-sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Tạo đợt kiểm kê
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted">Tổng đợt kiểm kê đã lập</p>
            <p className="text-2xl font-black text-primary mt-1">
              {pageData?.totalElements || 0}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-accent">
            <ClipboardCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted">Lần kiểm gần nhất</p>
            <p className="text-base font-bold text-text mt-1">
              {pageData?.content?.[0]
                ? formatDateTime(pageData.content[0].checkedAt)
                : 'Chưa có dữ liệu'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-accent">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface/60 border-b border-border text-xs uppercase text-primary font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4 w-20">Mã đợt</th>
                <th className="py-3 px-4 w-44">Thời điểm kiểm</th>
                <th className="py-3 px-4 w-48">Người thực hiện</th>
                <th className="py-3 px-4 w-36 text-center">Số mặt hàng</th>
                <th className="py-3 px-4 w-36 text-center">Có chênh lệch</th>
                <th className="py-3 px-4">Ghi chú</th>
                <th className="py-3 px-4 w-28 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td colSpan={7} className="py-4 px-4">
                      <div className="h-4 bg-surface/70 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : !pageData?.content || pageData.content.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted">
                    <ClipboardCheck className="w-10 h-10 mx-auto text-muted/60 mb-2" />
                    <p className="font-medium">Chưa có đợt kiểm kê nào được lập</p>
                    <p className="text-xs text-muted/80 mt-1">
                      Bấm nút "Tạo đợt kiểm kê" ở góc trên để tiến hành đối chiếu tồn kho định kỳ.
                    </p>
                  </td>
                </tr>
              ) : (
                pageData.content.map((check) => {
                  const itemsCount = check.items?.length || 0
                  const diffItemsCount =
                    check.items?.filter((i) => i.difference !== 0).length || 0

                  return (
                    <tr key={check.id} className="hover:bg-surface/20 transition-colors">
                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-text">
                        #{check.id}
                      </td>

                      {/* Checked At */}
                      <td className="py-3.5 px-4 text-xs font-mono text-text">
                        {formatDateTime(check.checkedAt)}
                      </td>

                      {/* Checked By */}
                      <td className="py-3.5 px-4 font-medium text-text">
                        {check.checkedByName || (check.checkedById ? `Tài khoản #${check.checkedById}` : '—')}
                      </td>

                      {/* Total items checked */}
                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-text">
                        {itemsCount} mặt hàng
                      </td>

                      {/* Diff count */}
                      <td className="py-3.5 px-4 text-center">
                        {diffItemsCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-status-pending/10 text-status-pending border border-status-pending/20">
                            <AlertTriangle className="w-3 h-3" />
                            {diffItemsCount} món lệch
                          </span>
                        ) : (
                          <span className="text-xs text-status-ready font-medium">
                            Khớp 100%
                          </span>
                        )}
                      </td>

                      {/* Note */}
                      <td className="py-3.5 px-4 text-xs text-muted max-w-xs truncate" title={check.note || ''}>
                        {check.note || '—'}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCheckId(check.id)}
                          className="text-accent hover:bg-surface/50 p-1.5 h-auto text-xs"
                          title="Xem biên bản chi tiết"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Xem
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pageData && pageData.totalPages > 1 && (
          <div className="p-3.5 border-t border-border flex items-center justify-between text-xs text-muted">
            <div>
              Hiển thị trang {pageData.page + 1} / {pageData.totalPages} (Tổng{' '}
              {pageData.totalElements} đợt kiểm kê)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                disabled={pageData.page === 0}
                className="h-8 px-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Trước</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.min(pageData.totalPages - 1, prev + 1))}
                disabled={pageData.page >= pageData.totalPages - 1}
                className="h-8 px-2"
              >
                <span>Sau</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateInventoryCheckModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <InventoryCheckDetailDrawer
        checkId={selectedCheckId}
        isOpen={selectedCheckId !== null}
        onClose={() => setSelectedCheckId(null)}
      />
    </div>
  )
}

export default InventoryChecksPage
