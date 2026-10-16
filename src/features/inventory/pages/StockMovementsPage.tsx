import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  History,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Receipt,
  FileSpreadsheet,
  UtensilsCrossed,
} from 'lucide-react'

import { stockMovementApi } from '@/features/inventory/api/stockMovementApi'
import { ingredientApi } from '@/features/inventory/api/ingredientApi'
import type { StockMovementType } from '@/features/inventory/types/stockMovement.types'
import { MovementTypeBadge } from '@/features/inventory/components/MovementTypeBadge'
import { Button } from '@/shared/components/ui/button'

const PAGE_SIZE = 20

export function StockMovementsPage() {
  // Filter state
  const [page, setPage] = useState(0)
  const [selectedIngredientId, setSelectedIngredientId] = useState<number | undefined>(undefined)
  const [selectedMovementType, setSelectedMovementType] = useState<StockMovementType | undefined>(undefined)

  // Fetch ingredients for filter dropdown
  const { data: ingredientsData } = useQuery({
    queryKey: ['ingredients-for-filter'],
    queryFn: () => ingredientApi.getIngredients({ size: 100 }),
    staleTime: 5 * 60 * 1000,
  })

  // Fetch stock movements
  const {
    data: pageData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['stock-movements', { selectedIngredientId, selectedMovementType, page, size: PAGE_SIZE }],
    queryFn: () =>
      stockMovementApi.getStockMovements({
        ingredientId: selectedIngredientId,
        movementType: selectedMovementType,
        page,
        size: PAGE_SIZE,
        sort: 'occurredAt,desc',
      }),
  })

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '0'
    return Number(num).toLocaleString('vi-VN', {
      maximumFractionDigits: 3,
    })
  }

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date)
  }

  const handleResetFilters = () => {
    setSelectedIngredientId(undefined)
    setSelectedMovementType(undefined)
    setPage(0)
  }

  const hasActiveFilters = selectedIngredientId !== undefined || selectedMovementType !== undefined

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-surface text-primary shadow-xs">
            <History className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-primary">
              Lịch sử Biến động Kho
            </h1>
            <p className="text-xs md:text-sm text-muted">
              Nhật ký kiểm toán toàn bộ giao dịch nhập hàng, xuất kho chế biến và điều chỉnh kiểm kê (Append-only).
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
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text">
            <Filter className="w-4 h-4 text-accent" />
            <span>Bộ lọc:</span>
          </div>

          {/* Filter by Ingredient */}
          <select
            value={selectedIngredientId ?? ''}
            onChange={(e) => {
              const val = e.target.value
              setSelectedIngredientId(val ? Number(val) : undefined)
              setPage(0)
            }}
            className="text-xs border border-border rounded-lg px-3 py-2 bg-background text-text focus:outline-none focus:border-accent min-w-[200px]"
          >
            <option value="">Tất cả nguyên liệu</option>
            {ingredientsData?.content?.map((item) => (
              <option key={item.id} value={item.id}>
                #{item.id} - {item.name} ({item.unit})
              </option>
            ))}
          </select>

          {/* Filter by Movement Type */}
          <select
            value={selectedMovementType ?? ''}
            onChange={(e) => {
              const val = e.target.value as StockMovementType | ''
              setSelectedMovementType(val ? val : undefined)
              setPage(0)
            }}
            className="text-xs border border-border rounded-lg px-3 py-2 bg-background text-text focus:outline-none focus:border-accent min-w-[180px]"
          >
            <option value="">Tất cả loại giao dịch</option>
            <option value="PURCHASE">Nhập mua hàng</option>
            <option value="ORDER_CONSUMPTION">Xuất chế biến</option>
            <option value="INVENTORY_ADJUSTMENT">Điều chỉnh kiểm kê</option>
          </select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs text-status-cancelled hover:bg-status-cancelled/10 h-8"
            >
              Đặt lại lọc
            </Button>
          )}
        </div>

        {pageData && (
          <div className="text-xs text-muted font-medium">
            Tìm thấy <strong className="text-primary">{pageData.totalElements}</strong> giao dịch
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface/60 border-b border-border text-xs uppercase text-primary font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4 w-16">Mã</th>
                <th className="py-3 px-4 w-44">Thời gian</th>
                <th className="py-3 px-4">Nguyên liệu</th>
                <th className="py-3 px-4 w-40">Loại giao dịch</th>
                <th className="py-3 px-4 w-36 text-right">Biến động</th>
                <th className="py-3 px-4 w-36 text-right">Tồn sau GD</th>
                <th className="py-3 px-4 w-44">Chứng từ liên quan</th>
                <th className="py-3 px-4">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td colSpan={8} className="py-4 px-4">
                      <div className="h-4 bg-surface/70 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : !pageData?.content || pageData.content.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted">
                    <History className="w-10 h-10 mx-auto text-muted/60 mb-2" />
                    <p className="font-medium">Chưa có bản ghi biến động kho nào</p>
                    <p className="text-xs text-muted/80 mt-1">
                      Các giao dịch nhập hàng, kiểm kê hoặc trừ kho khi gọi món sẽ tự động lưu vết tại đây.
                    </p>
                  </td>
                </tr>
              ) : (
                pageData.content.map((item) => {
                  const isPositive = item.quantityChange > 0
                  const isNegative = item.quantityChange < 0

                  return (
                    <tr key={item.id} className="hover:bg-surface/20 transition-colors">
                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono text-xs text-muted">
                        #{item.id}
                      </td>

                      {/* Occurred At */}
                      <td className="py-3.5 px-4 text-xs font-mono text-text">
                        {formatDateTime(item.occurredAt)}
                      </td>

                      {/* Ingredient */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-text">
                            {item.ingredientName}
                          </span>
                          <span className="text-[11px] font-mono text-muted">
                            Mã NL: #{item.ingredientId}
                          </span>
                        </div>
                      </td>

                      {/* Movement Type */}
                      <td className="py-3.5 px-4">
                        <MovementTypeBadge type={item.movementType} />
                      </td>

                      {/* Quantity Change */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        <span
                          className={
                            isPositive
                              ? 'text-status-ready'
                              : isNegative
                              ? 'text-status-cancelled'
                              : 'text-muted'
                          }
                        >
                          {isPositive && '+'}
                          {formatNumber(item.quantityChange)}
                        </span>
                        <span className="text-xs text-muted ml-1 font-normal">
                          {item.unit}
                        </span>
                      </td>

                      {/* Balance After */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-text">
                        {formatNumber(item.balanceAfter)}
                        <span className="text-xs text-muted ml-1 font-normal">
                          {item.unit}
                        </span>
                      </td>

                      {/* Linked Reference */}
                      <td className="py-3.5 px-4 text-xs">
                        {item.purchaseItemId && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-status-ready/10 text-status-ready font-medium border border-status-ready/20">
                            <Receipt className="w-3 h-3" />
                            <span>Dòng phiếu mua #{item.purchaseItemId}</span>
                          </div>
                        )}
                        {item.orderItemId && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-status-cooking/10 text-status-cooking font-medium border border-status-cooking/20">
                            <UtensilsCrossed className="w-3 h-3" />
                            <span>Món đơn #{item.orderItemId}</span>
                          </div>
                        )}
                        {item.inventoryCheckItemId && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-status-pending/10 text-status-pending font-medium border border-status-pending/20">
                            <FileSpreadsheet className="w-3 h-3" />
                            <span>Dòng kiểm kê #{item.inventoryCheckItemId}</span>
                          </div>
                        )}
                        {!item.purchaseItemId && !item.orderItemId && !item.inventoryCheckItemId && (
                          <span className="text-muted">—</span>
                        )}
                      </td>

                      {/* Note */}
                      <td className="py-3.5 px-4 text-xs text-muted max-w-xs truncate" title={item.note || ''}>
                        {item.note || '—'}
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
              {pageData.totalElements} giao dịch)
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
    </div>
  )
}

export default StockMovementsPage
