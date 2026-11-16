import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { purchaseApi } from '@/features/purchasing/api/purchaseApi'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import {
  ShoppingBag,
  Plus,
  Calendar,
  RefreshCw,
  Receipt,
  Banknote,
  ArrowRight,
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react'

export function PurchasesPage() {
  const navigate = useNavigate()
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [page, setPage] = useState<number>(0)
  const pageSize = 15

  // Fetch Purchases
  const {
    data: purchasesData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['purchases', fromDate, toDate, page],
    queryFn: () =>
      purchaseApi.getPurchases({
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page,
        size: pageSize,
        sort: 'purchaseDate,desc',
      }),
  })

  const purchases = purchasesData?.content || []
  const totalElements = purchasesData?.totalElements || 0
  const totalPages = purchasesData?.totalPages || 0

  // Calculate sum of total amount on current page
  const pageTotalAmount = useMemo(() => {
    return purchases.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0)
  }, [purchases])

  // Quick Date Range Helpers
  const handleSetToday = () => {
    const today = new Date().toISOString().split('T')[0]
    setFromDate(today)
    setToDate(today)
    setPage(0)
  }

  const handleSetLast7Days = () => {
    const today = new Date()
    const past = new Date()
    past.setDate(today.getDate() - 7)
    setFromDate(past.toISOString().split('T')[0])
    setToDate(today.toISOString().split('T')[0])
    setPage(0)
  }

  const handleSetThisMonth = () => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    setFromDate(firstDay.toISOString().split('T')[0])
    setToDate(today.toISOString().split('T')[0])
    setPage(0)
  }

  const handleClearFilter = () => {
    setFromDate('')
    setToDate('')
    setPage(0)
  }

  return (
    <div className="space-y-5">
      {/* Tầng 1: Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-text">
              Quản lý Phiếu Nhập Hàng
            </h1>
            <Badge variant="outline" className="text-muted">
              Thực tế kho
            </Badge>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Lịch sử các đợt nhập nguyên vật liệu thực tế vào kho và cập nhật số dư tồn kho.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-9 px-3 text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/inventory/purchases/new')}
            className="h-9 px-3.5 text-xs font-semibold"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Tạo phiếu nhập mới
          </Button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-4 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-muted font-medium">Tổng số phiếu (Kỳ này)</div>
            <div className="text-xl font-bold text-text tabular-nums mt-0.5">{totalElements}</div>
          </div>
          <Receipt className="w-5 h-5 text-muted/60 shrink-0" />
        </div>

        <div className="bg-card border border-border p-4 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-muted font-medium">Tổng tiền hiện tại</div>
            <div className="text-xl font-bold text-status-completed tabular-nums mt-0.5">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                pageTotalAmount
              )}
            </div>
          </div>
          <Banknote className="w-5 h-5 text-status-completed/60 shrink-0" />
        </div>

        <div className="bg-card border border-border p-4 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-muted font-medium">Trạng thái</div>
            <div className="text-sm font-semibold text-text mt-1">Đã nhập trực tiếp vào kho</div>
          </div>
          <ShoppingBag className="w-5 h-5 text-muted/60 shrink-0" />
        </div>
      </div>

      {/* Tầng 2: Filters Bar */}
      <div className="bg-card border border-border p-4 rounded-lg space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-3 space-y-1">
            <label className="text-xs font-medium text-text flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-muted" />
              Từ ngày
            </label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value)
                setPage(0)
              }}
              className="h-9 text-xs"
            />
          </div>

          <div className="sm:col-span-3 space-y-1">
            <label className="text-xs font-medium text-text flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-muted" />
              Đến ngày
            </label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value)
                setPage(0)
              }}
              className="h-9 text-xs"
            />
          </div>

          <div className="sm:col-span-6 flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSetToday}
              className="h-9 text-xs px-3"
            >
              Hôm nay
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSetLast7Days}
              className="h-9 text-xs px-3"
            >
              7 ngày qua
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSetThisMonth}
              className="h-9 text-xs px-3"
            >
              Tháng này
            </Button>
            {(fromDate || toDate) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearFilter}
                className="h-9 text-xs px-3 text-muted hover:text-text"
              >
                Đặt lại
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-border">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 shrink-0" />
            <span>
              Tìm thấy <strong className="text-text tabular-nums">{totalElements}</strong> phiếu nhập
              {fromDate && toDate && ` từ ${fromDate} đến ${toDate}`}
            </span>
          </div>
        </div>
      </div>

      {/* Tầng 3: Purchases Data Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-surface/60 border-b border-border text-muted font-medium">
              <tr>
                <th className="px-4 py-3 text-left w-20 whitespace-nowrap">Mã phiếu</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Ngày nhập kho</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Người tạo</th>
                <th className="px-4 py-3 text-left">Ghi chú</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Tổng tiền</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Thời gian ghi nhận</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                      <span>Đang tải danh sách phiếu nhập...</span>
                    </div>
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShoppingBag className="w-8 h-8 text-muted/40" />
                      <span className="font-medium text-sm text-text">Chưa có phiếu nhập hàng nào</span>
                      <span className="text-xs">
                        Tạo phiếu nhập mới để cập nhật nguyên liệu thực tế vào kho.
                      </span>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate('/inventory/purchases/new')}
                        className="mt-2 text-xs"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Tạo phiếu nhập ngay
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                purchases.map((purchase) => (
                  <tr
                    key={purchase.id}
                    className="hover:bg-muted-bg/40 transition-colors cursor-pointer"
                    onClick={() => navigate(`/inventory/purchases/${purchase.id}`)}
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-primary whitespace-nowrap">
                      #{purchase.id}
                    </td>

                    <td className="px-4 py-3 font-medium text-text tabular-nums whitespace-nowrap">
                      {purchase.purchaseDate}
                    </td>

                    <td className="px-4 py-3 text-text whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-muted shrink-0" />
                        <span>{purchase.createdByName || '—'}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-muted">
                      {purchase.note ? (
                        <span className="line-clamp-1 max-w-xs">{purchase.note}</span>
                      ) : (
                        <span>—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className="font-semibold text-status-completed text-sm tabular-nums">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(purchase.totalAmount)}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-muted tabular-nums whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-muted/70 shrink-0" />
                        <span>{new Date(purchase.createdAt).toLocaleString('vi-VN')}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <Link to={`/inventory/purchases/${purchase.id}`}>
                        <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs gap-1">
                          <span>Chi tiết</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border bg-card flex items-center justify-between text-xs text-muted">
            <div>
              Trang <strong className="text-text tabular-nums">{page + 1}</strong> /{' '}
              <span className="tabular-nums">{totalPages}</span> (Tổng{' '}
              <span className="tabular-nums">{totalElements}</span> phiếu)
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="h-8 px-2.5 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="h-8 px-2.5 text-xs"
              >
                Sau
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
