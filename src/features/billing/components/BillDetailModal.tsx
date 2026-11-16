import { X, Printer, Tag, CreditCard, Banknote } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { printReceiptViaBrowser } from '@/features/billing/utils/receiptPrinter'
import { billApi } from '@/features/billing/api/billApi'
import { toast } from 'sonner'
import type { BillResponse } from '@/features/billing/types/bill.types'

interface BillDetailModalProps {
  isOpen: boolean
  onClose: () => void
  bill: BillResponse | null
}

export function BillDetailModal({ isOpen, onClose, bill }: BillDetailModalProps) {
  if (!isOpen || !bill) return null

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

  const handlePrint = async () => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-lg shadow-md overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface/60">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-text">Chi tiết hóa đơn</h2>
              <span className="font-mono text-xs font-semibold text-primary">
                {bill.billCode}
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Bàn {bill.tableCode} • Phiên #{bill.sessionId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md border border-border bg-card text-muted hover:text-text hover:bg-muted-bg transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-surface/40 rounded-lg border border-border text-xs">
            <div>
              <span className="text-muted block">Giờ vào</span>
              <span className="font-medium text-text tabular-nums mt-0.5 block">{formatDateTime(bill.openedAt)}</span>
            </div>
            <div>
              <span className="text-muted block">Giờ thanh toán</span>
              <span className="font-medium text-text tabular-nums mt-0.5 block">{formatDateTime(bill.closedAt || bill.createdAt)}</span>
            </div>
            <div>
              <span className="text-muted block">Thu ngân</span>
              <span className="font-medium text-text mt-0.5 block">{bill.createdByName || 'Hệ thống'}</span>
            </div>
            <div>
              <span className="text-muted block">Thanh toán</span>
              <span className="font-medium text-text mt-0.5 block">
                {bill.payments?.length
                  ? bill.payments.map((p) => (p.paymentMethod === 'CASH' ? 'Tiền mặt' : 'CK')).join(', ')
                  : 'Chưa rõ'}
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h3 className="text-sm font-semibold text-text mb-2">
              Danh sách món ({bill.items?.length || 0})
            </h3>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface/60 text-muted font-medium border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Tên món</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">SL</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Đơn giá</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">VAT</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border tabular-nums">
                  {bill.items?.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="py-2.5 px-3 text-center text-muted">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-text">{item.itemName}</td>
                      <td className="py-2.5 px-3 text-center font-semibold text-text whitespace-nowrap">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right text-muted whitespace-nowrap">{formatVnd(item.unitPrice)}</td>
                      <td className="py-2.5 px-3 text-center text-muted whitespace-nowrap">
                        {item.taxRate ? `${item.taxRate}%` : '0%'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-text whitespace-nowrap">
                        {formatVnd(item.subtotal || item.unitPrice * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Totals */}
          <div className="p-4 bg-card rounded-lg border border-border space-y-2 text-xs">
            <div className="flex justify-between text-muted">
              <span>Tổng tiền món trước giảm</span>
              <span className="font-semibold text-text tabular-nums">{formatVnd(bill.amountBeforeDiscount)}</span>
            </div>

            {bill.discountAmount > 0 && (
              <div className="flex justify-between items-center text-status-completed">
                <span className="flex items-center gap-1 font-medium">
                  <Tag className="w-3.5 h-3.5" /> Khuyến mãi {bill.promotionCode && `(${bill.promotionCode})`}
                </span>
                <span className="font-semibold tabular-nums">-{formatVnd(bill.discountAmount)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-border flex justify-between items-center">
              <span className="font-bold text-text text-sm">Tổng cộng thanh toán</span>
              <span className="font-bold text-lg text-primary tabular-nums">{formatVnd(bill.totalAmount)}</span>
            </div>

            {/* Payments breakdown */}
            {bill.payments && bill.payments.length > 0 && (
              <div className="pt-2 border-t border-border text-muted space-y-1">
                <span className="font-medium text-text block mb-1">Chi tiết thanh toán:</span>
                {bill.payments.map((p, idx) => (
                  <div key={p.id || idx} className="flex justify-between pl-2">
                    <span className="flex items-center gap-1.5">
                      {p.paymentMethod === 'CASH' ? (
                        <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <CreditCard className="w-3.5 h-3.5 text-sky-600" />
                      )}
                      {p.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản ngân hàng'}
                    </span>
                    <span className="font-medium text-text tabular-nums">{formatVnd(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-card">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-9 px-3.5 text-xs gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            In hóa đơn
          </Button>

          <Button type="button" variant="primary" size="sm" onClick={onClose} className="h-9 px-4 text-xs font-semibold">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  )
}

