import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Receipt,
  Search,
  Calendar,
  Filter,
  RefreshCw,
  Eye,
  Printer,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Tag,
  DollarSign,
  X,
  FileText,
  Clock,
  User,
  Layers,
  UtensilsCrossed,
} from 'lucide-react'

import { invoiceApi } from '@/features/invoices/api/invoiceApi'
import { tableApi } from '@/features/tables/api/tableApi'
import type { InvoiceResponse } from '@/features/invoices/types/invoice.types'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'

export function InvoiceHistoryPage() {
  const [selectedTableId, setSelectedTableId] = useState<number | ''>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [page, setPage] = useState<number>(0)
  const pageSize = 15

  // Selected invoice for detail/print modal
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null)

  // Quick date presets
  const handlePresetDate = (preset: 'today' | '7days' | 'thisMonth' | 'all') => {
    const now = new Date()
    setPage(0)
    if (preset === 'today') {
      const todayStr = now.toISOString().split('T')[0]
      setStartDate(todayStr)
      setEndDate(todayStr)
    } else if (preset === '7days') {
      const past = new Date()
      past.setDate(now.getDate() - 7)
      setStartDate(past.toISOString().split('T')[0])
      setEndDate(now.toISOString().split('T')[0])
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      setStartDate(firstDay.toISOString().split('T')[0])
      setEndDate(now.toISOString().split('T')[0])
    } else {
      setStartDate('')
      setEndDate('')
    }
  }

  // Fetch tables list for table dropdown
  const { data: tablesData } = useQuery({
    queryKey: ['allTablesListForInvoices'],
    queryFn: () => tableApi.getTables({ size: 100 }),
  })
  const tables = tablesData?.content || []

  // Fetch invoices with pagination and filters
  const {
    data: invoicesData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['invoicesList', selectedTableId, startDate, endDate, page],
    queryFn: () =>
      invoiceApi.getInvoices({
        tableId: selectedTableId !== '' ? Number(selectedTableId) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        size: pageSize,
        sort: 'createdAt,desc',
      }),
  })

  // Fetch full details of the selected invoice for modal
  const { data: selectedInvoiceDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['invoiceDetail', selectedInvoiceId],
    queryFn: () => invoiceApi.getInvoiceById(selectedInvoiceId!),
    enabled: !!selectedInvoiceId,
  })

  const invoices = invoicesData?.content || []
  const totalPages = invoicesData?.totalPages || 0
  const totalElements = invoicesData?.totalElements || 0

  // Filter client-side by search query (invoiceCode or tableCode or closedByName)
  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoices
    const q = searchQuery.toLowerCase().trim()
    return invoices.filter(
      (inv) =>
        inv.invoiceCode.toLowerCase().includes(q) ||
        inv.tableCode.toLowerCase().includes(q) ||
        (inv.closedByName && inv.closedByName.toLowerCase().includes(q))
    )
  }, [invoices, searchQuery])

  // Aggregate statistics for the current page
  const stats = useMemo(() => {
    const totalSubtotal = filteredInvoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0)
    const totalDiscount = filteredInvoices.reduce((sum, inv) => sum + (inv.discountAmount || 0), 0)
    const totalFinal = filteredInvoices.reduce((sum, inv) => sum + (inv.finalAmount || 0), 0)
    return { totalSubtotal, totalDiscount, totalFinal }
  }, [filteredInvoices])

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex flex-col gap-6 text-left max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Receipt className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text">
              Lịch sử hóa đơn thanh toán
            </h1>
            <p className="text-xs text-muted mt-0.5">
              Tra cứu danh sách hóa đơn đã xuất, chi tiết món ăn, giảm giá và doanh thu từng bàn.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Quick Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-muted">Số lượng hóa đơn</span>
            <div className="text-lg font-bold text-text mt-0.5">
              {totalElements} <span className="text-xs font-normal text-muted">hóa đơn</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-muted">Tổng thực thu (trang hiện tại)</span>
            <div className="text-lg font-bold text-emerald-600 mt-0.5">
              {formatPrice(stats.totalFinal)}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-muted">Tổng tiền giảm giá (trang hiện tại)</span>
            <div className="text-lg font-bold text-amber-600 mt-0.5">
              {formatPrice(stats.totalDiscount)}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px] sm:min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <Input
              type="text"
              placeholder="Tìm theo mã HĐ, tên bàn, nhân viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Table filter */}
          <div className="w-full sm:w-44">
            <select
              className="flex h-9 w-full rounded-md border border-border bg-card px-3 py-1.5 text-xs text-text shadow-xs focus:outline-hidden focus:ring-1 focus:ring-accent"
              value={selectedTableId}
              onChange={(e) => {
                setSelectedTableId(e.target.value ? Number(e.target.value) : '')
                setPage(0)
              }}
            >
              <option value="">Tất cả các bàn</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  Bàn {t.tableCode} ({t.area || 'Chung'})
                </option>
              ))}
            </select>
          </div>

          {/* Date range pickers */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setPage(0)
                }}
                className="h-9 rounded-md border border-border bg-card px-2.5 py-1 text-xs text-text shadow-xs focus:outline-hidden focus:ring-1 focus:ring-accent"
                title="Từ ngày"
              />
            </div>
            <span className="text-xs text-muted">đến</span>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setPage(0)
                }}
                className="h-9 rounded-md border border-border bg-card px-2.5 py-1 text-xs text-text shadow-xs focus:outline-hidden focus:ring-1 focus:ring-accent"
                title="Đến ngày"
              />
            </div>
          </div>
        </div>

        {/* Quick Date Buttons */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-border/60 text-xs text-muted">
          <span className="mr-1">Lọc nhanh:</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePresetDate('today')}
            className="h-7 px-2 text-xs"
          >
            Hôm nay
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePresetDate('7days')}
            className="h-7 px-2 text-xs"
          >
            7 ngày qua
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePresetDate('thisMonth')}
            className="h-7 px-2 text-xs"
          >
            Tháng này
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePresetDate('all')}
            className="h-7 px-2 text-xs text-muted"
          >
            Tất cả
          </Button>
        </div>
      </div>

      {/* Invoices Data Table */}
      <div className="bg-card border border-border shadow-md rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/50 text-muted uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Mã hóa đơn</th>
                <th className="py-3 px-4">Bàn phục vụ</th>
                <th className="py-3 px-4">Thời gian xuất</th>
                <th className="py-3 px-4">Nhân viên đóng bàn</th>
                <th className="py-3 px-4 text-right">Tạm tính</th>
                <th className="py-3 px-4 text-right">Giảm giá</th>
                <th className="py-3 px-4 text-right">Tổng thực thu</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted">
                    <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Đang tải danh sách hóa đơn...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted">
                    <Receipt className="w-9 h-9 mx-auto mb-2 text-muted/40" />
                    <p className="font-medium text-text">Không tìm thấy hóa đơn nào</p>
                    <p className="text-xs text-muted mt-1">
                      Hãy thử đổi bộ lọc ngày, chọn bàn khác hoặc kiểm tra lại từ khóa tìm kiếm.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-primary">
                      {inv.invoiceCode}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-text">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface border border-border text-xs font-semibold">
                        Bàn {inv.tableCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-muted">
                      {new Date(inv.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3.5 px-4 text-text">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-muted" />
                        {inv.closedByName || 'Hệ thống'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-muted font-medium">
                      {formatPrice(inv.subtotal)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {inv.discountAmount > 0 ? (
                        <div className="text-amber-600 font-medium">
                          -{formatPrice(inv.discountAmount)}
                          <div className="text-[10px] text-muted">
                            {inv.discountType === 'PERCENTAGE'
                              ? `(${inv.discountValue}%)`
                              : 'Giảm số tiền'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted/60">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600 text-sm">
                      {formatPrice(inv.finalAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedInvoiceId(inv.id)}
                          className="h-8 px-2.5 text-xs text-primary hover:text-primary hover:bg-primary/10"
                          title="Xem chi tiết hóa đơn"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Xem
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface/30">
            <span className="text-xs text-muted">
              Hiển thị trang <strong className="text-text">{page + 1}</strong> trên tổng số{' '}
              <strong className="text-text">{totalPages}</strong> trang ({totalElements} hóa đơn)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="h-8 px-2.5 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
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
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Detail & Print Modal */}
      {selectedInvoiceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-card border border-border shadow-2xl rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-surface/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-text">Chi tiết hóa đơn</h3>
                  <p className="text-xs font-mono text-muted">
                    {selectedInvoiceDetail?.invoiceCode || 'Đang tải...'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoiceId(null)}
                className="p-1 rounded-md text-muted hover:text-text hover:bg-surface transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs print:p-0">
              {isLoadingDetail || !selectedInvoiceDetail ? (
                <div className="py-16 text-center text-muted">
                  <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Đang tải thông tin món ăn...
                </div>
              ) : (
                <div id="invoice-print-area" className="space-y-5">
                  {/* Bill Top Metadata */}
                  <div className="text-center pb-4 border-b border-dashed border-border space-y-1">
                    <h2 className="text-base font-black tracking-tight uppercase text-text">
                      Nhà Hàng ROMS
                    </h2>
                    <p className="text-[11px] text-muted">Hóa đơn thanh toán</p>
                    <div className="inline-block mt-1 px-2.5 py-0.5 bg-surface rounded text-[11px] font-mono font-semibold text-primary">
                      Mã HĐ: {selectedInvoiceDetail.invoiceCode}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-1 border-b border-border/60">
                    <div>
                      <span className="text-muted block text-[11px]">Bàn phục vụ</span>
                      <strong className="text-text font-bold">
                        Bàn {selectedInvoiceDetail.tableCode}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted block text-[11px]">Mã phiên</span>
                      <span className="text-text font-mono">#{selectedInvoiceDetail.sessionId}</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[11px]">Thời gian thanh toán</span>
                      <span className="text-text">
                        {new Date(selectedInvoiceDetail.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted block text-[11px]">Nhân viên thu ngân</span>
                      <span className="text-text font-medium">
                        {selectedInvoiceDetail.closedByName || 'Hệ thống'}
                      </span>
                    </div>
                  </div>

                  {/* Dishes breakdown */}
                  <div>
                    <h4 className="font-semibold text-muted uppercase tracking-wider mb-2.5 text-[11px]">
                      Danh sách món ăn ({selectedInvoiceDetail.items?.length || 0} món)
                    </h4>
                    <div className="space-y-2 border-b border-border/80 pb-3">
                      {selectedInvoiceDetail.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start text-xs">
                          <div className="flex-1 pr-2">
                            <span className="font-medium text-text block">{item.menuItemName}</span>
                            <span className="text-muted text-[11px]">
                              {item.quantity} x {formatPrice(item.unitPrice)}
                            </span>
                          </div>
                          <div className="font-medium text-text text-right">
                            {formatPrice(item.subtotal)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Financial breakdown */}
                  <div className="space-y-1.5 pt-1 text-xs">
                    <div className="flex justify-between text-muted">
                      <span>Tạm tính (Tổng tiền món):</span>
                      <span className="font-medium text-text">
                        {formatPrice(selectedInvoiceDetail.subtotal)}
                      </span>
                    </div>

                    {selectedInvoiceDetail.discountAmount > 0 && (
                      <div className="flex justify-between text-amber-600 font-medium">
                        <span>
                          Giảm giá
                          {selectedInvoiceDetail.discountType === 'PERCENTAGE' &&
                            ` (${selectedInvoiceDetail.discountValue}%)`}
                          {selectedInvoiceDetail.discountReason &&
                            ` - ${selectedInvoiceDetail.discountReason}`}
                          :
                        </span>
                        <span>-{formatPrice(selectedInvoiceDetail.discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm font-bold text-text pt-2 border-t border-border">
                      <span>Tổng tiền thanh toán:</span>
                      <span className="text-base text-emerald-600 font-extrabold">
                        {formatPrice(selectedInvoiceDetail.finalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Note if any */}
                  {selectedInvoiceDetail.note && (
                    <div className="p-2.5 bg-surface rounded-lg text-muted text-[11px]">
                      <strong className="text-text">Ghi chú:</strong> {selectedInvoiceDetail.note}
                    </div>
                  )}

                  <div className="text-center pt-2 text-[11px] text-muted italic">
                    Cảm ơn Quý khách và Hẹn gặp lại!
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-border bg-surface/40 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedInvoiceId(null)}
                className="text-xs"
              >
                Đóng
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handlePrint}
                disabled={isLoadingDetail || !selectedInvoiceDetail}
                className="text-xs font-semibold"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                In hóa đơn
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default InvoiceHistoryPage

