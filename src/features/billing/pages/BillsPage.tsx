import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Receipt,
  Search,
  RotateCcw,
  Eye,
  Printer,
  Copy,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Banknote,
  Tag,
  FileText,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-accent/10 text-accent">
            <Receipt className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text">Lịch Sử Hóa Đơn</h1>
            <p className="text-sm text-text-secondary">
              Tra cứu danh sách hóa đơn bán hàng, xem chi tiết món snapshot và in lại hóa đơn
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => refetch()}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <RotateCcw className="w-4 h-4 text-accent" />
          Làm mới
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm kiếm theo mã HĐ (VD: BILL-20261107-0001) hoặc tên/mã bàn..."
              className="pl-9 h-10 bg-background"
            />
          </div>
          <Button type="submit" variant="secondary" className="h-10">
            Tìm
          </Button>
        </form>

        {search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="text-xs text-text-secondary hover:text-text h-10 px-2.5"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Xóa tìm kiếm
          </Button>
        )}
      </div>

      {/* Bills Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-text-secondary">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Đang tải danh sách hóa đơn...
          </div>
        ) : isError ? (
          <div className="p-12 text-center text-error">
            <p className="font-semibold mb-2">Đã xảy ra lỗi khi tải dữ liệu</p>
            <p className="text-xs text-text-secondary mb-4">{getApiErrorMessage(error)}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Thử lại
            </Button>
          </div>
        ) : !pageData?.content || pageData.content.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto mb-3">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-text mb-1">Chưa có hóa đơn nào</h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto mb-4">
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
            <table className="w-full text-left text-sm">
              <thead className="bg-surface/60 text-xs font-semibold text-text-secondary uppercase border-b border-border">
                <tr>
                  <th className="py-3 px-4">Mã Hóa đơn</th>
                  <th className="py-3 px-4">Bàn</th>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4 text-right">Tiền món</th>
                  <th className="py-3 px-4 text-right">Khuyến mãi</th>
                  <th className="py-3 px-4 text-right">TỔNG THANH TOÁN</th>
                  <th className="py-3 px-4 text-center">Phương thức</th>
                  <th className="py-3 px-4">Thu ngân</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
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
                      className="hover:bg-surface/30 transition-colors group"
                    >
                      {/* Bill Code */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 font-mono font-bold text-xs text-primary bg-primary/5 px-2 py-1 rounded border border-primary/20">
                          {bill.billCode}
                          <button
                            onClick={() => copyCode(bill.billCode)}
                            title="Sao chép mã"
                            className="hover:text-accent transition-colors p-0.5"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Bàn */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-text px-2 py-0.5 rounded bg-surface border border-border text-xs">
                          {bill.tableCode}
                        </span>
                      </td>

                      {/* Thời gian */}
                      <td className="py-3.5 px-4 text-xs text-text-secondary">
                        {formatDateTime(bill.closedAt || bill.createdAt)}
                      </td>

                      {/* Tiền món */}
                      <td className="py-3.5 px-4 text-right text-xs font-medium text-text-secondary">
                        {formatVnd(bill.amountBeforeDiscount)}
                      </td>

                      {/* Giảm giá */}
                      <td className="py-3.5 px-4 text-right text-xs">
                        {bill.discountAmount > 0 ? (
                          <div className="inline-flex flex-col items-end">
                            <span className="font-bold text-accent">-{formatVnd(bill.discountAmount)}</span>
                            {bill.promotionCode && (
                              <span className="text-[10px] font-mono text-text-secondary flex items-center gap-0.5">
                                <Tag className="w-2.5 h-2.5" /> {bill.promotionCode}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-text-secondary/50">-</span>
                        )}
                      </td>

                      {/* TỔNG THANH TOÁN */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-sm text-primary">
                          {formatVnd(bill.totalAmount)}
                        </span>
                      </td>

                      {/* Phương thức TT */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          {hasCash && (
                            <span
                              className="inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                              title="Tiền mặt"
                            >
                              <Banknote className="w-3 h-3" /> TM
                            </span>
                          )}
                          {hasBank && (
                            <span
                              className="inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300"
                              title="Chuyển khoản ngân hàng"
                            >
                              <CreditCard className="w-3 h-3" /> CK
                            </span>
                          )}
                          {!hasCash && !hasBank && (
                            <span className="text-xs text-text-secondary">-</span>
                          )}
                        </div>
                      </td>

                      {/* Thu ngân */}
                      <td className="py-3.5 px-4 text-xs font-medium text-text">
                        {bill.createdByName || 'Thu ngân'}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Chi tiết */}
                          <button
                            onClick={() => setSelectedBill(bill)}
                            title="Xem chi tiết hóa đơn"
                            className="p-1.5 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* In lại */}
                          <button
                            onClick={() => handleQuickPrint(bill)}
                            title="In lại hóa đơn"
                            className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
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
          <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-surface/30">
            <span className="text-xs text-text-secondary">
              Hiển thị trang <span className="font-semibold text-text">{page + 1}</span> /{' '}
              <span className="font-semibold text-text">{pageData.totalPages}</span> (Tổng số{' '}
              {pageData.totalElements} hóa đơn)
            </span>
            <div className="flex items-center gap-2">
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

