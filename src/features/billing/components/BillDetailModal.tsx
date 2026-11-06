import { X, Receipt, Printer, Calendar, User, Clock, Tag, CreditCard, Banknote } from 'lucide-react'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10 text-accent">
              <Receipt className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-text">Chi tiết Hóa đơn</h2>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  {bill.billCode}
                </span>
              </div>
              <p className="text-xs text-text-secondary">
                Bàn: <span className="font-semibold text-text">{bill.tableCode}</span> • Phiên phục vụ #{bill.sessionId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-secondary hover:text-text hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-surface/60 rounded-xl border border-border/80 text-xs">
            <div>
              <span className="text-text-secondary block mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-accent" /> Giờ vào:
              </span>
              <span className="font-medium text-text">{formatDateTime(bill.openedAt)}</span>
            </div>
            <div>
              <span className="text-text-secondary block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-accent" /> Giờ thanh toán:
              </span>
              <span className="font-medium text-text">{formatDateTime(bill.closedAt || bill.createdAt)}</span>
            </div>
            <div>
              <span className="text-text-secondary block mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-accent" /> Thu ngân:
              </span>
              <span className="font-medium text-text">{bill.createdByName || 'Hệ thống'}</span>
            </div>
            <div>
              <span className="text-text-secondary block mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-accent" /> Thanh toán:
              </span>
              <span className="font-medium text-text">
                {bill.payments?.length
                  ? bill.payments.map((p) => (p.paymentMethod === 'CASH' ? 'Tiền mặt' : 'CK')).join(', ')
                  : 'Chưa rõ'}
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h3 className="text-sm font-semibold text-text mb-2.5 flex items-center justify-between">
              <span>Danh sách món ăn snapshot ({bill.items?.length || 0} món)</span>
            </h3>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface/70 text-text-secondary uppercase font-semibold border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">STT</th>
                    <th className="py-2.5 px-3">Tên món</th>
                    <th className="py-2.5 px-3 text-center">SL</th>
                    <th className="py-2.5 px-3 text-right">Đơn giá</th>
                    <th className="py-2.5 px-3 text-center">VAT</th>
                    <th className="py-2.5 px-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bill.items?.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-surface/30">
                      <td className="py-2 px-3 text-center text-text-secondary">{idx + 1}</td>
                      <td className="py-2 px-3 font-medium text-text">{item.itemName}</td>
                      <td className="py-2 px-3 text-center font-semibold text-text">{item.quantity}</td>
                      <td className="py-2 px-3 text-right text-text-secondary">{formatVnd(item.unitPrice)}</td>
                      <td className="py-2 px-3 text-center text-text-secondary">
                        {item.taxRate ? `${item.taxRate}%` : '0%'}
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-text">
                        {formatVnd(item.subtotal || item.unitPrice * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Totals */}
          <div className="p-4 bg-surface/40 rounded-xl border border-border space-y-2 text-sm">
            <div className="flex justify-between text-text-secondary text-xs">
              <span>Tổng tiền món trước giảm:</span>
              <span className="font-semibold text-text">{formatVnd(bill.amountBeforeDiscount)}</span>
            </div>

            {bill.discountAmount > 0 && (
              <div className="flex justify-between items-center text-xs text-accent">
                <span className="flex items-center gap-1 font-medium">
                  <Tag className="w-3.5 h-3.5" /> Khuyến mãi áp dụng {bill.promotionCode && `(${bill.promotionCode})`}:
                </span>
                <span className="font-bold">-{formatVnd(bill.discountAmount)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-border flex justify-between items-center">
              <span className="font-bold text-text text-sm">TỔNG CỘNG THANH TOÁN:</span>
              <span className="font-bold text-lg text-primary">{formatVnd(bill.totalAmount)}</span>
            </div>

            {/* Payments breakdown */}
            {bill.payments && bill.payments.length > 0 && (
              <div className="pt-2 border-t border-border/60 text-xs text-text-secondary space-y-1">
                <span className="font-medium text-text block mb-1">Chi tiết hình thức thanh toán:</span>
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
                    <span className="font-medium text-text">{formatVnd(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface/30">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrint}
            className="flex items-center gap-2 text-primary border-primary/30 hover:bg-primary/5"
          >
            <Printer className="w-4 h-4 text-accent" />
            In hóa đơn (Mở bản in)
          </Button>

          <Button type="button" onClick={onClose} className="bg-primary hover:bg-primary-hover text-white">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  )
}

