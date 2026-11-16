import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Printer,
  Tag,
  AlertCircle,
  RefreshCw,
  Banknote,
  QrCode,
  Split,
  CheckCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/app/store/authStore'
import { billApi } from '@/features/billing/api/billApi'
import { settingsApi } from '@/features/settings/api/settingsApi'
import {
  printReceiptViaBrowser,
  type ReceiptItem,
  type ReceiptTaxRow,
} from '@/features/billing/utils/receiptPrinter'
import { Button } from '@/shared/components/ui/button'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { getApiErrorCode } from '@/shared/lib/errorMessages'
import type { PaymentItemDto } from '@/features/billing/types/bill.types'

type PaymentTab = 'CASH' | 'BANK_TRANSFER' | 'SPLIT'

interface CheckoutLocationState {
  from?: string
  tableCode?: string
}

export function SessionCheckoutPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.user)

  const parsedSessionId = Number(sessionId)
  const locationState = (location.state as CheckoutLocationState | null) || null
  const backPath = locationState?.from || '/tables'

  const [selectedPromoCode, setSelectedPromoCode] = useState<string>('')
  const [customPromoCode, setCustomPromoCode] = useState<string>('')
  const [shouldPrintOnSuccess, setShouldPrintOnSuccess] = useState<boolean>(false)

  const [activeTab, setActiveTab] = useState<PaymentTab>('CASH')
  const [cashTenderedInput, setCashTenderedInput] = useState<string>('')
  const [cashPartInput, setCashPartInput] = useState<string>('')

  const { data: settings } = useQuery({
    queryKey: ['restaurant-settings'],
    queryFn: () => settingsApi.getSettings(),
  })

  const {
    data: preview,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['billPreview', parsedSessionId],
    queryFn: () => billApi.getBillPreview(parsedSessionId),
    enabled: Number.isFinite(parsedSessionId) && parsedSessionId > 0,
  })

  const activePromo = useMemo(() => {
    if (!preview) return null
    const code = (selectedPromoCode || customPromoCode).trim().toUpperCase()
    if (!code) return null
    return preview.availablePromotions.find((p) => p.code.toUpperCase() === code) || null
  }, [preview, selectedPromoCode, customPromoCode])

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

  // Default split cash part to half of total when total changes
  useEffect(() => {
    if (totalAmount > 0 && cashPartInput === '') {
      setCashPartInput(String(Math.round(totalAmount / 2)))
    }
  }, [totalAmount, cashPartInput])

  const cashSuggestions = useMemo(() => {
    if (totalAmount <= 0) return []
    const candidates = new Set<number>([totalAmount])
    const steps = [50000, 100000, 200000, 500000]
    steps.forEach((step) => {
      const rounded = Math.ceil(totalAmount / step) * step
      if (rounded > totalAmount) {
        candidates.add(rounded)
      }
    })
    return Array.from(candidates).sort((a, b) => a - b).slice(0, 4)
  }, [totalAmount])

  const cashTendered = cashTenderedInput === '' ? null : Number(cashTenderedInput)
  const changeAmount =
    cashTendered !== null && Number.isFinite(cashTendered) ? cashTendered - totalAmount : null

  const cashPart = cashPartInput === '' ? 0 : Math.max(0, Number(cashPartInput) || 0)
  const transferPart = Math.max(0, totalAmount - cashPart)
  const isSplitValid =
    cashPart >= 0 && transferPart >= 0 && cashPart + transferPart === totalAmount

  const checkoutMutation = useMutation({
    mutationFn: (payments: PaymentItemDto[]) => {
      const code = (selectedPromoCode || customPromoCode).trim().toUpperCase()
      return billApi.checkoutBill(parsedSessionId, {
        promotionCode: code || undefined,
        payments,
      })
    },
    onSuccess: (savedBill) => {
      billApi.printBill(savedBill.id).catch(() => {})

      if (shouldPrintOnSuccess) {
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
          openedAt: preview?.openedAt,
          closedAt: savedBill.closedAt || savedBill.createdAt || new Date().toISOString(),
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
      queryClient.invalidateQueries({ queryKey: ['tablesOverviewReadyOrders'] })
      queryClient.invalidateQueries({ queryKey: ['tableDetail'] })
      queryClient.invalidateQueries({ queryKey: ['sessionDetail', parsedSessionId] })

      navigate('/tables', { replace: true })
    },
    onError: (err: unknown) => {
      const apiCode = getApiErrorCode(err)
      if (apiCode === 'PAYMENT_AMOUNT_MISMATCH') {
        queryClient.invalidateQueries({ queryKey: ['billPreview', parsedSessionId] })
        toast.error('Hóa đơn vừa có thay đổi (thêm món hoặc kiểm đồ). Đã tải lại số tiền mới nhất, vui lòng kiểm tra lại!')
        return
      }
      toast.error(getApiErrorMessage(err) || 'Thanh toán thất bại, vui lòng thử lại!')
    },
  })

  const hasBillableItems = Boolean(preview && preview.items && preview.items.length > 0)
  const displayTableCode = preview?.tableCode || locationState?.tableCode || `Phiên #${parsedSessionId}`

  const handlePrintProforma = () => {
    if (!preview || !hasBillableItems) return

    billApi.printProforma(parsedSessionId).catch(() => {})

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
      openedAt: preview.openedAt,
      closedAt: new Date().toISOString(),
      items: receiptItems,
      amountBeforeDiscount: preview.amountBeforeDiscount,
      discountAmount,
      promotionCode: activePromo?.code,
      taxRows,
      totalAmount,
      paperSize: (settings?.billPaperSize as any) || 'K80',
    })
  }

  const handleConfirmPayment = (shouldPrint: boolean) => {
    if (!hasBillableItems || checkoutMutation.isPending) return

    let payments: PaymentItemDto[] = []
    if (activeTab === 'CASH') {
      if (cashTendered !== null && cashTendered < totalAmount) {
        toast.error('Số tiền khách đưa đang nhỏ hơn tổng cần thanh toán!')
        return
      }
      payments = [{ paymentMethod: 'CASH', amount: totalAmount }]
    } else if (activeTab === 'BANK_TRANSFER') {
      payments = [{ paymentMethod: 'BANK_TRANSFER', amount: totalAmount }]
    } else {
      if (!isSplitValid) return
      if (cashPart > 0) {
        payments.push({ paymentMethod: 'CASH', amount: cashPart })
      }
      if (transferPart > 0) {
        payments.push({ paymentMethod: 'BANK_TRANSFER', amount: transferPart })
      }
    }

    setShouldPrintOnSuccess(shouldPrint)
    checkoutMutation.mutate(payments)
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Top POS Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(backPath)}
            className="h-9 px-3 text-xs gap-1.5 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-text truncate">
              Thanh toán — {displayTableCode}
            </h1>
            <p className="text-xs text-muted mt-0.5">
              Kiểm tra chi tiết món ăn, áp mã ưu đãi và hoàn tất thu tiền
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePrintProforma}
          disabled={!hasBillableItems}
          className="h-9 px-3 text-xs gap-1.5 self-start sm:self-auto shrink-0"
        >
          <Printer className="w-4 h-4" />
          In phiếu tạm tính
        </Button>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="bg-card border border-border rounded-lg py-16 text-center text-muted text-sm flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          <span>Đang tải thông tin hóa đơn tạm tính...</span>
        </div>
      ) : isError ? (
        <div className="bg-card border border-border border-l-4 border-l-status-cancelled rounded-lg p-6 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-status-cancelled font-semibold text-sm">
            <AlertCircle className="w-5 h-5" />
            <span>Không thể lấy thông tin tính tiền</span>
          </div>
          <p className="text-xs text-muted max-w-md mx-auto">
            {getApiErrorMessage(error) || 'Chưa thể thanh toán do còn món chưa hoàn tất.'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={() => navigate(backPath)}>
              Quay lại
            </Button>
            <Button size="sm" variant="primary" onClick={() => refetch()}>
              Thử lại
            </Button>
          </div>
        </div>
      ) : !preview || preview.items.length === 0 ? (
        <div className="bg-card border border-border rounded-lg py-16 text-center space-y-3">
          <p className="text-muted text-sm">Phiên bàn chưa có món ăn nào để thanh toán.</p>
          <Button size="sm" variant="outline" onClick={() => navigate(backPath)}>
            Quay lại
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Items, Promotion & Calculation */}
          <div className="lg:col-span-7 space-y-4">
            {/* Items Table */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="bg-surface/60 px-4 py-3 border-b border-border text-xs font-medium text-muted grid grid-cols-12">
                <span className="col-span-1">#</span>
                <span className="col-span-5">Tên món</span>
                <span className="col-span-2 text-center">SL</span>
                <span className="col-span-2 text-right">Đơn giá</span>
                <span className="col-span-2 text-right">Thành tiền</span>
              </div>

              <div className="divide-y divide-border max-h-[380px] overflow-y-auto">
                {preview.items.map((item, idx) => (
                  <div
                    key={item.orderItemId}
                    className="px-4 py-3 text-sm text-text grid grid-cols-12 items-center"
                  >
                    <span className="col-span-1 text-xs text-muted tabular-nums">{idx + 1}</span>
                    <div className="col-span-5 pr-2 min-w-0">
                      <p className="font-semibold text-text truncate">{item.itemName}</p>
                      {!preview.menuPriceIncludesVat && item.taxRate > 0 && (
                        <span className="text-xs text-muted">VAT: {item.taxRate}%</span>
                      )}
                    </div>
                    <span className="col-span-2 text-center font-semibold text-text tabular-nums">
                      {item.quantity}
                    </span>
                    <span className="col-span-2 text-right text-xs text-muted tabular-nums whitespace-nowrap">
                      {item.unitPrice.toLocaleString('vi-VN')} đ
                    </span>
                    <span className="col-span-2 text-right font-semibold text-text tabular-nums whitespace-nowrap">
                      {item.subtotal.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Promotions Section */}
            <div className="bg-card p-4 sm:p-5 rounded-lg border border-border space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-text">
                <Tag className="w-4 h-4 text-primary" />
                <span>Mã khuyến mãi / Giảm giá</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={selectedPromoCode}
                  onChange={(e) => {
                    setSelectedPromoCode(e.target.value)
                    setCustomPromoCode('')
                  }}
                  className="w-full h-10 px-3 text-xs bg-card border border-border rounded-md text-text focus:outline-hidden focus:ring-2 focus:ring-accent"
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
                    className="w-full h-10 px-3 text-xs bg-card border border-border rounded-md text-text uppercase font-mono focus:outline-hidden focus:ring-2 focus:ring-accent"
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
                      className="h-10 px-3 text-xs"
                    >
                      Xóa
                    </Button>
                  )}
                </div>
              </div>

              {activePromo && (
                <div className="flex items-center justify-between text-xs text-status-completed bg-card border border-border border-l-4 border-l-status-completed px-3 py-2 rounded-md">
                  <span className="font-medium">Áp dụng: {activePromo.name}</span>
                  <span className="font-semibold tabular-nums">
                    -
                    {activePromo.discountType === 'PERCENT'
                      ? `${activePromo.discountValue}%`
                      : `${activePromo.discountValue.toLocaleString('vi-VN')} đ`}
                  </span>
                </div>
              )}
            </div>

            {/* Calculation Summary Box */}
            <div className="bg-card p-4 sm:p-5 rounded-lg border border-border space-y-2.5 text-sm">
              <div className="flex justify-between text-text">
                <span className="text-muted">Tổng tiền món:</span>
                <span className="font-semibold tabular-nums">
                  {preview.subtotal.toLocaleString('vi-VN')} đ
                </span>
              </div>

              {!preview.menuPriceIncludesVat && (
                <div className="space-y-1.5 py-2 border-y border-border text-xs">
                  {preview.taxBreakdowns && preview.taxBreakdowns.length > 0 ? (
                    preview.taxBreakdowns.map((tax) => (
                      <div key={tax.rate} className="flex justify-between text-muted">
                        <span>
                          Thuế VAT ({tax.rate}% trên {tax.taxableAmount.toLocaleString('vi-VN')} đ):
                        </span>
                        <span className="font-medium text-text tabular-nums">
                          +{tax.taxAmount.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between text-muted">
                      <span>Thuế VAT:</span>
                      <span className="font-medium text-text tabular-nums">
                        +{preview.totalTax.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between text-text font-medium">
                <span className="text-muted">Thành tiền (trước giảm giá):</span>
                <span className="tabular-nums">{preview.amountBeforeDiscount.toLocaleString('vi-VN')} đ</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-status-completed font-semibold">
                  <span>Giảm giá khuyến mãi:</span>
                  <span className="tabular-nums">-{discountAmount.toLocaleString('vi-VN')} đ</span>
                </div>
              )}

              <div className="pt-3 border-t border-border flex justify-between items-center font-bold text-text">
                <span className="text-base">Tổng cộng thanh toán:</span>
                <span className="text-2xl text-primary font-bold tabular-nums">
                  {totalAmount.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: POS Payment Panel */}
          <div className="lg:col-span-5 lg:sticky lg:top-6 bg-card border border-border rounded-lg overflow-hidden">
            {/* Total Display */}
            <div className="px-5 py-4 bg-surface/60 border-b border-border flex items-center justify-between">
              <span className="text-sm font-medium text-text">Cần thanh toán:</span>
              <span className="text-2xl font-bold text-primary tabular-nums">
                {totalAmount.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* Method Selector Tabs */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('CASH')}
                  className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                    activeTab === 'CASH'
                      ? 'bg-primary text-white border-primary'
                      : 'bg-card text-text border-border hover:bg-muted-bg'
                  }`}
                >
                  <Banknote className={`w-4 h-4 ${activeTab === 'CASH' ? 'text-white' : 'text-emerald-600'}`} />
                  Tiền mặt
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('BANK_TRANSFER')}
                  className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                    activeTab === 'BANK_TRANSFER'
                      ? 'bg-primary text-white border-primary'
                      : 'bg-card text-text border-border hover:bg-muted-bg'
                  }`}
                >
                  <QrCode className={`w-4 h-4 ${activeTab === 'BANK_TRANSFER' ? 'text-white' : 'text-sky-600'}`} />
                  Chuyển khoản
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('SPLIT')}
                  className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                    activeTab === 'SPLIT'
                      ? 'bg-primary text-white border-primary'
                      : 'bg-card text-text border-border hover:bg-muted-bg'
                  }`}
                >
                  <Split className={`w-4 h-4 ${activeTab === 'SPLIT' ? 'text-white' : 'text-amber-600'}`} />
                  Kết hợp
                </button>
              </div>

              {/* CASH Tab */}
              {activeTab === 'CASH' && (
                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text block">
                      Tiền khách đưa (VNĐ) — tùy chọn
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      placeholder={totalAmount.toLocaleString('vi-VN')}
                      value={cashTenderedInput}
                      onChange={(e) => setCashTenderedInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-base font-bold tabular-nums bg-card border border-border rounded-md text-text focus:outline-hidden focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  {cashSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {cashSuggestions.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCashTenderedInput(String(amt))}
                          className={`h-9 px-3 rounded-md text-xs font-semibold border tabular-nums transition-colors cursor-pointer ${
                            cashTendered === amt
                              ? 'bg-primary text-white border-primary'
                              : 'bg-card hover:bg-muted-bg text-text border-border'
                          }`}
                        >
                          {amt === totalAmount
                            ? `Đủ (${amt.toLocaleString('vi-VN')}đ)`
                            : `${amt.toLocaleString('vi-VN')}đ`}
                        </button>
                      ))}
                      {cashTenderedInput !== '' && (
                        <button
                          type="button"
                          onClick={() => setCashTenderedInput('')}
                          className="h-9 px-3 rounded-md text-xs font-medium text-muted hover:text-text border border-border bg-card cursor-pointer"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  )}

                  {changeAmount !== null && (
                    <div
                      className={`p-3.5 rounded-md border border-border border-l-4 flex items-center justify-between bg-card ${
                        changeAmount >= 0
                          ? 'border-l-status-ready text-status-ready'
                          : 'border-l-status-cancelled text-status-cancelled'
                      }`}
                    >
                      <span className="text-sm font-medium text-text">
                        {changeAmount >= 0 ? 'Tiền thừa trả khách:' : 'Còn thiếu:'}
                      </span>
                      <span className="text-lg font-bold tabular-nums">
                        {Math.abs(changeAmount).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* BANK_TRANSFER Tab */}
              {activeTab === 'BANK_TRANSFER' && (
                <div className="p-3.5 rounded-md bg-card border border-border border-l-4 border-l-status-cooking space-y-1.5 text-sm text-text">
                  <div className="font-semibold text-status-cooking">Thanh toán chuyển khoản</div>
                  <p className="text-xs text-muted">
                    Xác nhận khách hàng đã chuyển khoản đủ{' '}
                    <strong className="text-text tabular-nums">{totalAmount.toLocaleString('vi-VN')} đ</strong>{' '}
                    trước khi hoàn tất hóa đơn.
                  </p>
                </div>
              )}

              {/* SPLIT Tab */}
              {activeTab === 'SPLIT' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-text block mb-1.5">
                      Tiền mặt (VNĐ)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={totalAmount}
                      step={1000}
                      value={cashPartInput}
                      onChange={(e) => setCashPartInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm font-bold tabular-nums bg-card border border-border rounded-md text-text focus:outline-hidden focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div className="p-3.5 rounded-md bg-surface/40 border border-border flex items-center justify-between">
                    <span className="text-xs font-medium text-muted">Chuyển khoản còn lại:</span>
                    <span className="text-base font-bold text-primary tabular-nums">
                      {transferPart.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  {!isSplitValid && (
                    <p className="text-xs text-status-cancelled font-medium">
                      Tổng tiền mặt và chuyển khoản phải bằng đúng{' '}
                      {totalAmount.toLocaleString('vi-VN')} đ.
                    </p>
                  )}
                </div>
              )}

              {/* Confirm Actions */}
              <div className="pt-2 space-y-2">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => handleConfirmPayment(true)}
                  disabled={
                    checkoutMutation.isPending ||
                    (activeTab === 'SPLIT' && !isSplitValid) ||
                    (activeTab === 'CASH' && cashTendered !== null && cashTendered < totalAmount)
                  }
                  className="w-full h-11 text-sm font-semibold gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Xác nhận &amp; In hóa đơn
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleConfirmPayment(false)}
                  disabled={
                    checkoutMutation.isPending ||
                    (activeTab === 'SPLIT' && !isSplitValid) ||
                    (activeTab === 'CASH' && cashTendered !== null && cashTendered < totalAmount)
                  }
                  className="w-full h-11 text-sm font-semibold gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Xác nhận thanh toán (Không in)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SessionCheckoutPage
