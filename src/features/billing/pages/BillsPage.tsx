import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Search,
  RotateCcw,
  Eye,
  Printer,
  Copy,
  ChevronLeft,
  ChevronRight,
  Tag,
  FileText,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import { billApi } from '@/features/billing/api/billApi'
import { printReceiptViaBrowser } from '@/features/billing/utils/receiptPrinter'
import { BillDetailModal } from '@/features/billing/components/BillDetailModal'
import { getApiErrorMessage } from '@/shared/lib/axios'
import type { BillResponse } from '@/features/billing/types/bill.types'

export function BillsPage() {
  // Filter states
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 15

  // Selected bill for detail modal
  const [selectedBill, setSelectedBill] = useState<BillResponse | null>(null)

  // Query: Get bills
  const {
    data: pageData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['bills', { page, size: pageSize, search }],
    queryFn: () => billApi.getBills(page, pageSize, search || undefined),
  })

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    setSearch(searchInput.trim())
  }

  const handleResetFilters = () => {
    setSearchInput('')
    setSearch('')
    setPage(0)
  }

  const formatVnd = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)
  }

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return isNaN(d.getTime())
      ? dateStr
      : `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString('vi-VN')}`
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success(`Đã sao chép mã HĐ: ${code}`)
  }

  const handleQuickPrint = async (bill: BillResponse) => {
    try {
      await billApi.printBill(bill.id)
      toast.success('Đã gửi lệnh in tới máy in nhiệt!')
    } catch {
      // Ignored if physical thermal printer is not connected
    }

    printReceiptViaBrowser({
      title: 'HÓA ĐƠN THANH TOÁN',
      billCode: bill.billCode,
      tableCode: bill.tableCode,
      cashierName: bill.createdByName || 'Thu ngân',
      openedAt: bill.openedAt,
      closedAt: bill.closedAt || bill.createdAt,
      items: (bill.items || []).map((it, idx) => ({
        index: idx + 1,
        itemName: it.itemName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        subtotal: it.subtotal || it.unitPrice * it.quantity,
      })),
      amountBeforeDiscount: bill.amountBeforeDiscount,
      discountAmount: bill.discountAmount,
      promotionCode: bill.promotionCode,
      totalAmount: bill.totalAmount,
      payments: (bill.payments || []).map((p) => ({
        method: p.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản',
        amount: p.amount,
      })),
    })
  }

  return (
    <div className="space-y-5">
      {/* Tầng 1: Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-border">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-text">Lịch sử hóa đơn</h1>
          <p className="text-xs text-muted mt-0.5">
            Tra cứu danh sách hóa đơn bán hàng, xem chi tiết món và in lại hóa đơn
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="h-9 px-3 text-xs self-start sm:self-auto shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Làm mới
        </Button>
      </div>

      {/* Tầng 2: Filter Bar */}
      <div className="bg-card border border-border rounded-lg p-3.5 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo mã HĐ (VD: BILL-20261107-0001) hoặc mã bàn..."
              className="pl-9 h-9 text-xs"
            />
          </div>
          <Button type="submit" variant="primary" size="sm" className="h-9 px-4 text-xs">
            Tìm
          </Button>
        </form>

        {search && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            className="text-xs h-9 px-3 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Xóa tìm kiếm
          </Button>
        )}
      </div>

      {/* Tầng 3: Bills Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted text-xs">
            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Đang tải danh sách hóa đơn...
          </div>
        ) : isError ? (
          <div className="p-12 text-center text-status-cancelled">
            <p className="font-semibold text-sm mb-1">Đã xảy ra lỗi khi tải dữ liệu</p>
            <p className="text-xs text-muted mb-4">{getApiErrorMessage(error)}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Thử lại
            </Button>
          </div>
        ) : !pageData?.content || pageData.content.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-8 h-8 text-muted/60 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-text mb-1">Chưa có hóa đơn nào</h3>
            <p className="text-xs text-muted max-w-sm mx-auto mb-4">
              {search
                ? 'Không tìm thấy hóa đơn nào phù hợp với từ khóa tìm kiếm.'
                : 'Các hóa đơn sau khi thu ngân hoàn tất thanh toán sẽ được lưu trữ tại đây.'}
            </p>
            {search && (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Xóa tìm kiếm
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface/60 font-medium text-muted border-b border-border">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">Mã Hóa đơn</th>
                  <th className="py-3 px-4 whitespace-nowrap">Bàn</th>
                  <th className="py-3 px-4 whitespace-nowrap">Thời gian</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Tiền món</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Khuyến mãi</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Tổng thanh toán</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Phương thức</th>
                  <th className="py-3 px-4 whitespace-nowrap">Thu ngân</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageData.content.map((bill) => {
                  const paymentTypes = bill.payments?.map((p) => p.paymentMethod) || []
                  const hasCash = paymentTypes.includes('CASH')
                  const hasBank = paymentTypes.includes('BANK_TRANSFER')

                  return (
                    <tr
                      key={bill.id}
                      className="hover:bg-muted-bg/40 transition-colors"
                    >
                      {/* Bill Code */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 font-mono font-semibold text-xs text-primary">
                          <span>{bill.billCode}</span>
                          <button
                            onClick={() => copyCode(bill.billCode)}
                            title="Sao chép mã"
                            className="text-muted hover:text-text transition-colors p-0.5 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Bàn */}
                      <td className="py-3 px-4 font-semibold text-text whitespace-nowrap">
                        {bill.tableCode}
                      </td>

                      {/* Thời gian */}
                      <td className="py-3 px-4 text-muted tabular-nums whitespace-nowrap">
                        {formatDateTime(bill.closedAt || bill.createdAt)}
                      </td>

                      {/* Tiền món */}
                      <td className="py-3 px-4 text-right text-muted tabular-nums whitespace-nowrap">
                        {formatVnd(bill.amountBeforeDiscount)}
                      </td>

                      {/* Giảm giá */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {bill.discountAmount > 0 ? (
                          <div className="inline-flex flex-col items-end tabular-nums">
                            <span className="font-semibold text-status-completed">-{formatVnd(bill.discountAmount)}</span>
                            {bill.promotionCode && (
                              <span className="text-[11px] font-mono text-muted inline-flex items-center gap-0.5">
                                <Tag className="w-2.5 h-2.5" /> {bill.promotionCode}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>

                      {/* TỔNG THANH TOÁN */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="font-bold text-sm text-text tabular-nums">
                          {formatVnd(bill.totalAmount)}
                        </span>
                      </td>

                      {/* Phương thức TT */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {hasCash && <Badge variant="ready">Tiền mặt</Badge>}
                          {hasBank && <Badge variant="cooking">CK</Badge>}
                          {!hasCash && !hasBank && <span className="text-muted">—</span>}
                        </div>
                      </td>

                      {/* Thu ngân */}
                      <td className="py-3 px-4 font-medium text-text whitespace-nowrap">
                        {bill.createdByName || 'Thu ngân'}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedBill(bill)}
                            className="h-8 px-2.5 text-xs"
                            title="Xem chi tiết hóa đơn"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Xem
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickPrint(bill)}
                            className="h-8 px-2.5 text-xs"
                            title="In lại hóa đơn"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pageData && pageData.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card text-xs">
            <span className="text-muted">
              Trang <strong className="text-text tabular-nums">{page + 1}</strong> /{' '}
              <strong className="text-text tabular-nums">{pageData.totalPages}</strong> ({pageData.totalElements} hóa đơn)
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
                onClick={() => setPage((p) => Math.min(pageData.totalPages - 1, p + 1))}
                disabled={page >= pageData.totalPages - 1}
                className="h-8 px-2.5 text-xs"
              >
                Sau
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <BillDetailModal
        isOpen={Boolean(selectedBill)}
        onClose={() => setSelectedBill(null)}
        bill={selectedBill}
      />
    </div>
  )
}

