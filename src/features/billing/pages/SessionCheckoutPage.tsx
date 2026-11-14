import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Receipt,
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
      queryClient.invalidateQueries({ queryKey: ['tablesOverviewReadyOrders'] })
      queryClient.invalidateQueries({ queryKey: ['tableDetail'] })
      queryClient.invalidateQueries({ queryKey: ['sessionDetail', parsedSessionId] })

      navigate('/tables', { replace: true })
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err) || 'Thanh toán thất bại, vui lòng thử lại!')
    },
  })

  const hasBillableItems = Boolean(preview && preview.items && preview.items.length > 0)
  const displayTableCode = preview?.tableCode || locationState?.tableCode || `Phiên #${parsedSessionId}`

  const handlePrintProforma = () => {
    if (!preview || !hasBillableItems) return
    toast.info('Đang gửi yêu cầu in phiếu tạm tính...')

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
    <div className="space-y-6 pb-8">
      {/* Top POS Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(backPath)}
            className="gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Button>
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl hidden sm:flex">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-text">
              Thanh toán - {displayTableCode}
            </h1>
            <p className="text-xs text-muted">
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
          className="gap-1.5 self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" />
          In phiếu tạm tính
        </Button>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="bg-card border border-border rounded-2xl py-20 text-center text-muted text-sm flex flex-col items-center gap-3">
          <RefreshCw className="w-7 h-7 animate-spin text-primary" />
          <span>Đang tải thông tin hóa đơn tạm tính...</span>
        </div>
      ) : isError ? (
        <div className="bg-card border border-red-500/20 rounded-2xl p-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-red-600 font-semibold text-base">
            <AlertCircle className="w-5 h-5" />
            <span>Không thể lấy thông tin tính tiền</span>
          </div>
          <p className="text-sm text-red-500 max-w-md mx-auto">
            {getApiErrorMessage(error) || 'Chưa thể thanh toán do còn món chưa hoàn tất.'}
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate(backPath)}>
              Quay lại
            </Button>
            <Button size="sm" variant="primary" onClick={() => refetch()}>
              Thử lại
            </Button>
          </div>
        </div>
      ) : !preview || preview.items.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl py-16 text-center space-y-3">
          <p className="text-muted text-sm">Phiên bàn chưa có món ăn nào để thanh toán.</p>
          <Button size="sm" variant="outline" onClick={() => navigate(backPath)}>
            Quay lại
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Items, Promotion & Calculation */}
          <div className="lg:col-span-7 space-y-5">
            {/* Items Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
              <div className="bg-surface/60 px-4 py-3 border-b border-border text-xs font-semibold text-text grid grid-cols-12">
                <span className="col-span-1">#</span>
                <span className="col-span-5">Tên món</span>
                <span className="col-span-2 text-center">SL</span>
                <span className="col-span-2 text-right">Đơn giá</span>
                <span className="col-span-2 text-right">Thành tiền</span>
              </div>

              <div className="divide-y divide-border/60 max-h-[380px] overflow-y-auto">
                {preview.items.map((item, idx) => (
                  <div
                    key={item.orderItemId}
                    className="px-4 py-3 text-sm text-text grid grid-cols-12 items-center hover:bg-surface/30 transition-colors"
                  >
                    <span className="col-span-1 text-xs text-muted">{idx + 1}</span>
                    <div className="col-span-5 pr-2">
                      <p className="font-semibold text-text truncate">{item.itemName}</p>
                      {!preview.menuPriceIncludesVat && item.taxRate > 0 && (
                        <span className="text-[11px] text-muted">VAT: {item.taxRate}%</span>
                      )}
                    </div>
                    <span className="col-span-2 text-center font-bold text-text">
                      {item.quantity}
                    </span>
                    <span className="col-span-2 text-right text-xs text-muted">
                      {item.unitPrice.toLocaleString('vi-VN')} đ
                    </span>
                    <span className="col-span-2 text-right font-bold text-text">
                      {item.subtotal.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Promotions Section */}
            <div className="bg-card p-5 rounded-2xl border border-border space-y-3 shadow-xs">
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
                  className="w-full px-3 py-2.5 text-sm bg-surface/40 border border-border rounded-xl text-text focus:outline-hidden focus:ring-2 focus:ring-primary/20"
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
                    className="w-full px-3 py-2.5 text-sm bg-surface/40 border border-border rounded-xl text-text uppercase font-mono focus:outline-hidden focus:ring-2 focus:ring-primary/20"
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
                      className="px-3 text-xs text-muted hover:text-text"
                    >
                      Xóa
                    </Button>
                  )}
                </div>
              </div>

              {activePromo && (
                <div className="flex items-center justify-between text-xs text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
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
            <div className="bg-card p-5 rounded-2xl border border-border space-y-2.5 text-sm shadow-xs">
              <div className="flex justify-between text-text">
                <span className="text-muted">Tổng tiền món:</span>
                <span className="font-semibold">
                  {preview.subtotal.toLocaleString('vi-VN')} đ
                </span>
              </div>

              {!preview.menuPriceIncludesVat && (
                <div className="space-y-1.5 py-2 border-y border-border/60 text-xs">
                  {preview.taxBreakdowns && preview.taxBreakdowns.length > 0 ? (
                    preview.taxBreakdowns.map((tax) => (
                      <div key={tax.rate} className="flex justify-between text-muted">
                        <span>
                          Thuế VAT ({tax.rate}% trên {tax.taxableAmount.toLocaleString('vi-VN')} đ):
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

              <div className="flex justify-between text-text font-medium">
                <span className="text-muted">Thành tiền (trước giảm giá):</span>
                <span>{preview.amountBeforeDiscount.toLocaleString('vi-VN')} đ</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Giảm giá khuyến mãi:</span>
                  <span>-{discountAmount.toLocaleString('vi-VN')} đ</span>
                </div>
              )}

              <div className="pt-3 border-t border-border flex justify-between items-center font-black text-text">
                <span className="text-base">Tổng cộng thanh toán:</span>
                <span className="text-2xl text-primary font-black">
                  {totalAmount.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: POS Payment Panel */}
          <div className="lg:col-span-5 lg:sticky lg:top-6 bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            {/* Total Display */}
            <div className="p-5 bg-primary/5 border-b border-border flex items-center justify-between">
              <span className="text-sm font-medium text-muted">Cần thanh toán:</span>
              <span className="text-3xl font-black text-primary">
                {totalAmount.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div className="p-5 space-y-5">
              {/* Method Selector Tabs */}
              <div className="grid grid-cols-3 gap-2 p-1.5 bg-surface rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => setActiveTab('CASH')}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'CASH'
                      ? 'bg-card text-primary shadow-xs border border-border'
                      : 'text-muted hover:text-text'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-emerald-500" />
                  Tiền mặt
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('BANK_TRANSFER')}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'BANK_TRANSFER'
                      ? 'bg-card text-primary shadow-xs border border-border'
                      : 'text-muted hover:text-text'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-sky-500" />
                  Chuyển khoản
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('SPLIT')}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'SPLIT'
                      ? 'bg-card text-primary shadow-xs border border-border'
                      : 'text-muted hover:text-text'
                  }`}
                >
                  <Split className="w-5 h-5 text-amber-500" />
                  Kết hợp
                </button>
              </div>

              {/* CASH Tab */}
              {activeTab === 'CASH' && (
                <div className="space-y-4">
                  <div className="space-y-2">
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
                      className="w-full px-4 py-3 text-base font-bold bg-surface/40 border border-border rounded-xl text-text focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {cashSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {cashSuggestions.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCashTenderedInput(String(amt))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                            cashTendered === amt
                              ? 'bg-primary text-white border-primary'
                              : 'bg-surface hover:bg-surface/80 text-text border-border'
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
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-text border border-border"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  )}

                  {changeAmount !== null && (
                    <div
                      className={`p-4 rounded-xl border flex items-center justify-between ${
                        changeAmount >= 0
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700'
                          : 'bg-red-500/10 border-red-500/20 text-red-600'
                      }`}
                    >
                      <span className="text-sm font-medium">
                        {changeAmount >= 0 ? 'Tiền thừa trả khách:' : 'Còn thiếu:'}
                      </span>
                      <span className="text-lg font-black">
                        {Math.abs(changeAmount).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* BANK_TRANSFER Tab */}
              {activeTab === 'BANK_TRANSFER' && (
                <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 space-y-2 text-sm text-text">
                  <div className="font-semibold text-sky-700">Thanh toán chuyển khoản</div>
                  <p className="text-xs text-muted">
                    Xác nhận khách hàng đã chuyển khoản đủ{' '}
                    <strong className="text-text">{totalAmount.toLocaleString('vi-VN')} đ</strong>{' '}
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
                      className="w-full px-4 py-2.5 text-sm font-bold bg-surface/40 border border-border rounded-xl text-text focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface/50 border border-border flex items-center justify-between">
                    <span className="text-xs font-medium text-muted">Chuyển khoản còn lại:</span>
                    <span className="text-base font-bold text-primary">
                      {transferPart.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  {!isSplitValid && (
                    <p className="text-xs text-red-500 font-medium">
                      Tổng tiền mặt và chuyển khoản phải bằng đúng{' '}
                      {totalAmount.toLocaleString('vi-VN')} đ.
                    </p>
                  )}
                </div>
              )}

              {/* Confirm Actions */}
              <div className="pt-2 space-y-2.5">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => handleConfirmPayment(true)}
                  disabled={
                    checkoutMutation.isPending ||
                    (activeTab === 'SPLIT' && !isSplitValid) ||
                    (activeTab === 'CASH' && cashTendered !== null && cashTendered < totalAmount)
                  }
                  className="w-full py-3.5 text-sm font-bold bg-primary hover:bg-primary-hover text-white gap-2 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  {checkoutMutation.isPending ? 'Đang xử lý...' : 'Xác nhận & In hóa đơn'}
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
                  className="w-full py-3 text-sm font-semibold gap-2"
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
