import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Receipt, Printer, CreditCard, Tag, AlertCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/app/store/authStore'
import { billApi } from '@/features/billing/api/billApi'
import { settingsApi } from '@/features/settings/api/settingsApi'
import { PaymentMethodModal } from '@/features/billing/components/PaymentMethodModal'
import {
  printReceiptViaBrowser,
  type ReceiptItem,
  type ReceiptTaxRow,
} from '@/features/billing/utils/receiptPrinter'
import { Button } from '@/shared/components/ui/button'
import { getApiErrorMessage } from '@/shared/lib/axios'
import type { PaymentItemDto, BillResponse } from '@/features/billing/types/bill.types'

interface TableCheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  sessionId: number
  tableCode: string
  onCheckoutSuccess?: (bill: BillResponse) => void
}

export function TableCheckoutModal({
  isOpen,
  onClose,
  sessionId,
  tableCode,
  onCheckoutSuccess,
}: TableCheckoutModalProps) {
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.user)

  const [selectedPromoCode, setSelectedPromoCode] = useState<string>('')
  const [customPromoCode, setCustomPromoCode] = useState<string>('')
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [shouldPrintOnSuccess, setShouldPrintOnSuccess] = useState<boolean>(false)

  // Fetch current restaurant settings for receipt metadata
  const { data: settings } = useQuery({
    queryKey: ['restaurant-settings'],
    queryFn: () => settingsApi.getSettings(),
    enabled: isOpen,
  })

  // Fetch bill preview data
  const {
    data: preview,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['billPreview', sessionId],
    queryFn: () => billApi.getBillPreview(sessionId),
    enabled: isOpen && !!sessionId,
  })

  // Determine active promotion
  const activePromo = useMemo(() => {
    if (!preview) return null
    const code = (selectedPromoCode || customPromoCode).trim().toUpperCase()
    if (!code) return null
    return preview.availablePromotions.find((p) => p.code.toUpperCase() === code) || null
  }, [preview, selectedPromoCode, customPromoCode])

  // Calculate discount and total amount
  const { discountAmount, totalAmount } = useMemo(() => {
    if (!preview) return { discountAmount: 0, totalAmount: 0 }
    const base = preview.amountBeforeDiscount

    if (!activePromo) {
      return { discountAmount: 0, totalAmount: base }
    }

    let discount = 0
    if (activePromo.discountType === 'PERCENT') {
      discount = Math.round((base * activePromo.discountValue) / 100)
    } else {
      discount = Math.min(activePromo.discountValue, base)
    }

    discount = Math.min(discount, base)
    const finalTotal = Math.max(0, base - discount)
    return { discountAmount: discount, totalAmount: finalTotal }
  }, [preview, activePromo])

  // Checkout mutation
  const checkoutMutation = useMutation({
    mutationFn: (payments: PaymentItemDto[]) => {
      const code = (selectedPromoCode || customPromoCode).trim().toUpperCase()
      return billApi.checkoutBill(sessionId, {
        promotionCode: code || undefined,
        payments,
      })
    },
    onSuccess: (savedBill) => {
      // Trigger server print if printer configured
      billApi.printBill(savedBill.id).catch(() => { })

      if (shouldPrintOnSuccess) {
        // Trigger browser print template
        const receiptItems: ReceiptItem[] = savedBill.items.map((item, idx) => ({
          index: idx + 1,
          itemName: item.itemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        }))

        const taxRows: ReceiptTaxRow[] =
          preview?.taxBreakdowns?.map((t) => ({
            rate: t.rate,
            amount: t.taxAmount,
          })) || []

        printReceiptViaBrowser({
          title: 'HÓA ĐƠN THANH TOÁN',
          restaurantName: settings?.restaurantName,
          address: settings?.address,
          phone: settings?.phone,
          receiptFooter: settings?.receiptFooter,
          cashierName: savedBill.createdByName || currentUser?.username || 'Thu ngân',
          tableCode: savedBill.tableCode,
          openedAt: preview?.openedAt ? new Date(preview.openedAt).toLocaleString('vi-VN') : undefined,
          closedAt: new Date().toLocaleString('vi-VN'),
          billCode: savedBill.billCode,
          items: receiptItems,
          amountBeforeDiscount: savedBill.amountBeforeDiscount,
          discountAmount: savedBill.discountAmount,
          promotionCode: savedBill.promotionCode,
          taxRows,
          totalAmount: savedBill.totalAmount,
          payments: savedBill.payments?.map((p) => ({
            method: p.paymentMethod,
            amount: p.amount,
          })),
          paperSize: (settings?.billPaperSize as any) || 'K80',
        })
        toast.success(`Thanh toán và gửi lệnh in hóa đơn thành công! Mã HĐ: ${savedBill.billCode}`)
      } else {
        toast.success(`Thanh toán thành công! Mã HĐ: ${savedBill.billCode}`)
      }

      queryClient.invalidateQueries({ queryKey: ['tablesOverview'] })
      queryClient.invalidateQueries({ queryKey: ['tableDetail'] })
      queryClient.invalidateQueries({ queryKey: ['sessionDetail', sessionId] })
      setIsPaymentModalOpen(false)
      onClose()
      onCheckoutSuccess?.(savedBill)
    },
    onError: (err) => {
      const msg = getApiErrorMessage(err) || 'Thanh toán thất bại, vui lòng thử lại!'
      toast.error(msg)
    },
  })

  if (!isOpen) return null

  const handlePrintProforma = () => {
    if (!preview) return
    toast.info('Đang gửi yêu cầu in phiếu tạm tính...')

    // Trigger server print
    billApi.printProforma(sessionId).catch(() => { })

    // Trigger browser print template
    const receiptItems: ReceiptItem[] = preview.items.map((item, idx) => ({
      index: idx + 1,
      itemName: item.itemName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
    }))

    const taxRows: ReceiptTaxRow[] =
      preview.taxBreakdowns?.map((t) => ({
        rate: t.rate,
        amount: t.taxAmount,
      })) || []

    printReceiptViaBrowser({
      title: 'PHIẾU TẠM TÍNH',
      restaurantName: settings?.restaurantName,
      address: settings?.address,
      phone: settings?.phone,
      receiptFooter: settings?.receiptFooter,
      cashierName: currentUser?.fullName || currentUser?.username || 'Thu ngân',
      tableCode: preview.tableCode,
      openedAt: preview.openedAt ? new Date(preview.openedAt).toLocaleString('vi-VN') : undefined,
      closedAt: new Date().toLocaleString('vi-VN'),
      items: receiptItems,
      amountBeforeDiscount: preview.amountBeforeDiscount,
      discountAmount,
      promotionCode: activePromo?.code,
      taxRows,
      totalAmount,
      paperSize: (settings?.billPaperSize as any) || 'K80',
    })
  }

  const handleConfirmPayments = (payments: PaymentItemDto[], shouldPrint: boolean) => {
    setShouldPrintOnSuccess(shouldPrint)
    checkoutMutation.mutate(payments)
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border bg-surface/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text">Tính tiền - {tableCode}</h2>
                <p className="text-xs text-muted">
                  Kiểm tra chi tiết món ăn, áp mã ưu đãi và thanh toán hóa đơn
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-muted hover:text-text rounded-lg hover:bg-surface transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {isLoading ? (
              <div className="py-16 text-center text-muted text-sm flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                <span>Đang tải thông tin tạm tính...</span>
              </div>
            ) : isError ? (
              <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20 text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-red-600 font-semibold text-sm">
                  <AlertCircle className="w-5 h-5" />
                  <span>Không thể lấy thông tin tính tiền</span>
                </div>
                <p className="text-xs text-red-500">
                  {getApiErrorMessage(error) || 'Chưa thể thanh toán do còn món chưa hoàn tất.'}
                </p>
                <Button size="sm" variant="outline" onClick={() => refetch()} className="text-xs">
                  Thử lại
                </Button>
              </div>
            ) : !preview || preview.items.length === 0 ? (
              <div className="py-12 text-center text-muted text-sm">
                Phiên bàn chưa có món ăn nào để thanh toán.
              </div>
            ) : (
              <>
                {/* Items Table */}
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="bg-surface/50 px-4 py-2.5 border-b border-border text-xs font-semibold text-text grid grid-cols-12">
                    <span className="col-span-1">#</span>
                    <span className="col-span-5">Tên món</span>
                    <span className="col-span-2 text-center">SL</span>
                    <span className="col-span-2 text-right">Đơn giá</span>
                    <span className="col-span-2 text-right">Thành tiền</span>
                  </div>

                  <div className="divide-y divide-border/60 max-h-56 overflow-y-auto">
                    {preview.items.map((item, idx) => (
                      <div
                        key={item.orderItemId}
                        className="px-4 py-2.5 text-xs text-text grid grid-cols-12 items-center hover:bg-surface/30 transition-colors"
                      >
                        <span className="col-span-1 text-muted">{idx + 1}</span>
                        <div className="col-span-5 pr-2">
                          <p className="font-semibold text-text truncate">{item.itemName}</p>
                          {!preview.menuPriceIncludesVat && item.taxRate > 0 && (
                            <span className="text-[10px] text-muted">VAT: {item.taxRate}%</span>
                          )}
                        </div>
                        <span className="col-span-2 text-center font-bold text-text">
                          {item.quantity}
                        </span>
                        <span className="col-span-2 text-right text-muted">
                          {item.unitPrice.toLocaleString('vi-VN')} đ
                        </span>
                        <span className="col-span-2 text-right font-bold text-text">
                          {item.subtotal.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Promotions section */}
                <div className="p-4 rounded-xl bg-surface/30 border border-border space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-text">
                    <Tag className="w-4 h-4 text-primary" />
                    <span>Mã khuyến mãi / Giảm giá</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={selectedPromoCode}
                      onChange={(e) => {
                        setSelectedPromoCode(e.target.value)
                        setCustomPromoCode('')
                      }}
                      className="w-full px-3 py-2 text-xs bg-card border border-border rounded-lg text-text focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">-- Chọn voucher sẵn có --</option>
                      {preview.availablePromotions.map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.code} - {p.name} (
                          {p.discountType === 'PERCENT'
                            ? `Giảm ${p.discountValue}%`
                            : `Giảm ${p.discountValue.toLocaleString('vi-VN')}đ`}
                          )
                        </option>
                      ))}
                    </select>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Hoặc nhập mã code..."
                        value={customPromoCode}
                        onChange={(e) => {
                          setCustomPromoCode(e.target.value.toUpperCase())
                          setSelectedPromoCode('')
                        }}
                        className="w-full px-3 py-2 text-xs bg-card border border-border rounded-lg text-text uppercase font-mono focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                      />
                      {(selectedPromoCode || customPromoCode) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPromoCode('')
                            setCustomPromoCode('')
                          }}
                          className="px-2.5 text-xs text-muted hover:text-text"
                        >
                          Xóa
                        </Button>
                      )}
                    </div>
                  </div>

                  {activePromo && (
                    <div className="flex items-center justify-between text-xs text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg">
                      <span className="font-semibold">Áp dụng: {activePromo.name}</span>
                      <span className="font-bold">
                        -
                        {activePromo.discountType === 'PERCENT'
                          ? `${activePromo.discountValue}%`
                          : `${activePromo.discountValue.toLocaleString('vi-VN')} đ`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Calculation Summary Box */}
                <div className="p-4 rounded-xl bg-surface/50 border border-border space-y-2 text-xs">
                  <div className="flex justify-between text-text">
                    <span className="text-muted">Tổng tiền món:</span>
                    <span className="font-semibold">
                      {preview.subtotal.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  {/* VAT Details (Shown if VAT is EXCLUDED) */}
                  {!preview.menuPriceIncludesVat && (
                    <div className="space-y-1 py-1 border-y border-border/60">
                      {preview.taxBreakdowns && preview.taxBreakdowns.length > 0 ? (
                        preview.taxBreakdowns.map((tax) => (
                          <div key={tax.rate} className="flex justify-between text-muted">
                            <span>
                              Thuế VAT ({tax.rate}% trên{' '}
                              {tax.taxableAmount.toLocaleString('vi-VN')} đ):
                            </span>
                            <span className="font-medium text-text">
                              +{tax.taxAmount.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="flex justify-between text-muted">
                          <span>Thuế VAT:</span>
                          <span className="font-medium text-text">
                            +{preview.totalTax.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Base Total before discount */}
                  <div className="flex justify-between text-text font-medium">
                    <span className="text-muted">Thành tiền (trước giảm giá):</span>
                    <span>{preview.amountBeforeDiscount.toLocaleString('vi-VN')} đ</span>
                  </div>

                  {/* Discount row */}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Giảm giá khuyến mãi:</span>
                      <span>-{discountAmount.toLocaleString('vi-VN')} đ</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-border flex justify-between items-center text-sm font-black text-text">
                    <span className="text-base">Tổng cộng thanh toán:</span>
                    <span className="text-xl text-primary font-black">
                      {totalAmount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between p-5 border-t border-border bg-surface/50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrintProforma}
              disabled={!preview}
              className="text-xs gap-1.5"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              In phiếu tạm tính
            </Button>

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
                Đóng
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setIsPaymentModalOpen(true)}
                disabled={!preview || preview.items.length === 0}
                className="bg-primary hover:bg-primary-hover text-white font-semibold text-xs shadow-xs"
              >
                <CreditCard className="w-4 h-4 mr-1.5" />
                Thanh toán
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Selection Modal */}
      {preview && (
        <PaymentMethodModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          totalAmount={totalAmount}
          onConfirm={handleConfirmPayments}
          isPending={checkoutMutation.isPending}
        />
      )}
    </>
  )
}
