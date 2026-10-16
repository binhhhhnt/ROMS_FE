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
  DollarSign,
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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text">
              Quản lý Phiếu Nhập Hàng
            </h1>
            <Badge variant="outline" className="bg-surface text-muted-foreground border-border">
              Thực tế kho
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Lịch sử các đợt nhập nguyên vật liệu thực tế vào kho và cập nhật số dư tồn kho.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>

          <Button
            size="sm"
            onClick={() => navigate('/inventory/purchases/new')}
            className="text-xs bg-accent hover:bg-accent-hover text-white flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Tạo phiếu nhập mới
          </Button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-accent/15 border border-accent/20 flex items-center justify-center text-accent">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Tổng số phiếu (Kỳ này)</div>
            <div className="text-xl font-bold text-text">{totalElements}</div>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Tổng tiền trang hiện tại</div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                pageTotalAmount
              )}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-sky-500/15 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Trạng thái</div>
            <div className="text-sm font-semibold text-text mt-1">Đã nhập trực tiếp vào kho</div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-card border border-border p-4 rounded-xl space-y-3 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          {/* From Date */}
          <div className="sm:col-span-3 space-y-1">
            <label className="text-xs font-medium text-text flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-accent" />
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

          {/* To Date */}
          <div className="sm:col-span-3 space-y-1">
            <label className="text-xs font-medium text-text flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-accent" />
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

          {/* Quick Date Buttons */}
          <div className="sm:col-span-6 flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSetToday}
              className="h-9 text-xs px-2.5"
            >
              Hôm nay
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSetLast7Days}
              className="h-9 text-xs px-2.5"
            >
              7 ngày qua
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSetThisMonth}
              className="h-9 text-xs px-2.5"
            >
              Tháng này
            </Button>
            {(fromDate || toDate) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearFilter}
                className="h-9 text-xs text-muted-foreground hover:text-text px-2"
              >
                Đặt lại
              </Button>
            )}
          </div>
        </div>

        {/* Applied filter summary */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-accent" />
            <span>
              Tìm thấy <strong>{totalElements}</strong> phiếu nhập
              {fromDate && toDate && ` từ ${fromDate} đến ${toDate}`}
            </span>
          </div>
        </div>
      </div>

      {/* Purchases Data Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-surface/50 border-b border-border text-muted-foreground font-medium">
              <tr>
                <th className="px-4 py-3 text-left w-20">Mã phiếu</th>
                <th className="px-4 py-3 text-left">Ngày nhập kho</th>
                <th className="px-4 py-3 text-left">Người tạo</th>
                <th className="px-4 py-3 text-left">Ghi chú</th>
                <th className="px-4 py-3 text-right">Tổng tiền</th>
                <th className="px-4 py-3 text-left">Thời gian ghi nhận</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-accent" />
                      <span>Đang tải danh sách phiếu nhập...</span>
                    </div>
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShoppingBag className="w-8 h-8 text-muted-foreground/40" />
                      <span className="font-medium text-sm">Chưa có phiếu nhập hàng nào</span>
                      <span className="text-xs">
                        Tạo phiếu nhập mới để cập nhật nguyên liệu thực tế vào kho.
                      </span>
                      <Button
                        size="sm"
                        onClick={() => navigate('/inventory/purchases/new')}
                        className="mt-2 text-xs bg-accent hover:bg-accent-hover text-white"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Tạo phiếu nhập ngay
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                purchases.map((purchase) => {
                  return (
                    <tr
                      key={purchase.id}
                      className="hover:bg-surface/40 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/inventory/purchases/${purchase.id}`)}
                    >
                      {/* ID */}
                      <td className="px-4 py-3 font-mono font-semibold text-accent">
                        #{purchase.id}
                      </td>

                      {/* Purchase Date */}
                      <td className="px-4 py-3 font-medium text-text">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{purchase.purchaseDate}</span>
                        </div>
                      </td>

                      {/* Created By */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-text">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{purchase.createdByName || '—'}</span>
                        </div>
                      </td>

                      {/* Note */}
                      <td className="px-4 py-3 text-muted-foreground">
                        {purchase.note ? (
                          <span className="line-clamp-1 max-w-xs">{purchase.note}</span>
                        ) : (
                          <span className="italic">—</span>
                        )}
                      </td>

                      {/* Total Amount */}
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(purchase.totalAmount)}
                        </span>
                      </td>

                      {/* Created At */}
                      <td className="px-4 py-3 text-muted-foreground">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3 text-muted-foreground/70" />
                          <span>{new Date(purchase.createdAt).toLocaleString('vi-VN')}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <Link
                          to={`/inventory/purchases/${purchase.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium text-accent hover:bg-accent/10 transition-colors"
                        >
                          <span>Chi tiết</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border bg-surface/30 flex items-center justify-between text-xs text-muted-foreground">
            <div>
              Trang <strong>{page + 1}</strong> / {totalPages} (Tổng {totalElements} phiếu)
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="h-7 px-2 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="h-7 px-2 text-xs"
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
