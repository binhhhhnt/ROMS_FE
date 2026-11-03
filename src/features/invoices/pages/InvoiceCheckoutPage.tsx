import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Receipt,
  Percent,
  Banknote,
  Tag,
  ArrowLeft,
  CheckCircle2,
  Printer,
  Clock,
  UtensilsCrossed,
  FileText,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { tableApi } from '@/features/tables/api/tableApi'
import { invoiceApi } from '@/features/invoices/api/invoiceApi'
import type { DiscountType, InvoiceResponse } from '@/features/invoices/types/invoice.types'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { getApiErrorMessage } from '@/shared/lib/axios'

export function InvoiceCheckoutPage() {
  const { tableId, sessionId: routeSessionId } = useParams<{
    tableId?: string
    sessionId?: string
  }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [discountType, setDiscountType] = useState<DiscountType>('NONE')
  const [discountValueInput, setDiscountValueInput] = useState<string>('0')
  const [discountReason, setDiscountReason] = useState<string>('')
  const [note, setNote] = useState<string>('')
  const [createdInvoice, setCreatedInvoice] = useState<InvoiceResponse | null>(null)

  // 1. Fetch table details if tableId param is present
  const parsedTableId = tableId ? parseInt(tableId, 10) : undefined
  const { data: table, isLoading: isTableLoading } = useQuery({
    queryKey: ['tableDetail', parsedTableId],
    queryFn: () => tableApi.getTableById(parsedTableId!),
    enabled: !!parsedTableId,
  })

  // 2. Resolve active sessionId from route or table
  const effectiveSessionId = useMemo(() => {
    if (routeSessionId) return parseInt(routeSessionId, 10)
    if (table?.activeSessionId) return table.activeSessionId
    return undefined
  }, [routeSessionId, table?.activeSessionId])

  // Parse numeric discount value safely
  const numericDiscountValue = useMemo(() => {
    const val = parseFloat(discountValueInput.replace(/,/g, ''))
    return isNaN(val) || val < 0 ? 0 : val
  }, [discountValueInput])

  // 3. Fetch Checkout Preview live
  const {
    data: preview,
    isLoading: isPreviewLoading,
    error: previewError,
  } = useQuery({
    queryKey: ['checkoutPreview', effectiveSessionId, discountType, numericDiscountValue],
    queryFn: () =>
      invoiceApi.previewCheckout({
        sessionId: effectiveSessionId!,
        discountType,
        discountValue: numericDiscountValue,
      }),
    enabled: !!effectiveSessionId && !createdInvoice,
  })

  // 4. Mutation to Checkout & Close Session
  const checkoutMutation = useMutation({
    mutationFn: () =>
      invoiceApi.checkout({
        sessionId: effectiveSessionId!,
        discountType,
        discountValue: numericDiscountValue,
        discountReason: discountReason.trim() || undefined,
        note: note.trim() || undefined,
      }),
    onSuccess: (invoice) => {
      setCreatedInvoice(invoice)
      queryClient.invalidateQueries({ queryKey: ['tablesOverview'] })
      queryClient.invalidateQueries({ queryKey: ['tableDetail'] })
      queryClient.invalidateQueries({ queryKey: ['sessionDetail'] })
      toast.success(`Xuất hóa đơn ${invoice.invoiceCode} thành công! Phiên bàn đã được đóng.`)
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err))
    },
  })

  const formatPrice = (val?: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(val || 0)
  }

  // Handle print bill
  const handlePrint = () => {
    window.print()
  }

  if (isTableLoading || (isPreviewLoading && !preview)) {
    return (
      <div className="py-24 text-center text-muted">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Đang chuẩn bị thông tin thanh toán hóa đơn...
      </div>
    )
  }

  // View: Success / Created Invoice Receipt
  if (createdInvoice) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6 my-6">
        <div className="bg-card border border-border shadow-xl rounded-2xl p-6 sm:p-8 animate-in fade-in">
          {/* Header */}
          <div className="text-center pb-6 border-b border-dashed border-border">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-text">Thanh toán & Đóng bàn thành công!</h2>
            <p className="text-xs text-muted mt-1">
              Bàn <strong className="text-text">{createdInvoice.tableCode}</strong> đã được giải phóng và sẵn sàng đón khách mới.
            </p>
            <div className="inline-block mt-3 px-3 py-1 bg-surface rounded-full text-xs font-mono font-semibold text-primary">
              Mã HĐ: {createdInvoice.invoiceCode}
            </div>
          </div>

          {/* Dishes List */}
          <div className="py-6 border-b border-border">
            <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
              Chi tiết món ăn ({createdInvoice.items?.length || 0} món)
            </h4>
            <div className="space-y-2.5">
              {createdInvoice.items?.map((item) => (
                <div key={item.menuItemId} className="flex justify-between text-sm">
                  <div className="flex-1 pr-3">
                    <span className="font-medium text-text">{item.menuItemName}</span>
                    <span className="text-xs text-muted ml-2">x{item.quantity}</span>
                  </div>
                  <div className="text-right font-medium text-text">
                    {formatPrice(item.subtotal)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="py-6 space-y-2 border-b border-border text-sm">
            <div className="flex justify-between text-muted">
              <span>Tạm tính (Tổng tiền món):</span>
              <span className="font-medium text-text">{formatPrice(createdInvoice.subtotal)}</span>
            </div>
            {createdInvoice.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>
                  Giảm giá
                  {createdInvoice.discountType === 'PERCENTAGE' && ` (${createdInvoice.discountValue}%)`}
                  {createdInvoice.discountReason && ` - ${createdInvoice.discountReason}`}:
                </span>
                <span>-{formatPrice(createdInvoice.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-primary pt-2 border-t border-border">
              <span>Tổng tiền thanh toán:</span>
              <span className="text-lg text-emerald-600">{formatPrice(createdInvoice.finalAmount)}</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-6 flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handlePrint}
              className="flex-1 text-xs font-medium"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              In hóa đơn
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => navigate('/tables')}
              className="flex-1 text-xs font-semibold"
            >
              Về sơ đồ bàn
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (previewError || !effectiveSessionId) {
    return (
      <div className="max-w-md mx-auto py-16 text-center text-status-cancelled p-4">
        <AlertCircle className="w-10 h-10 mx-auto mb-3" />
        <h3 className="font-bold text-base text-text mb-1">Không thể tải thông tin thanh toán</h3>
        <p className="text-xs text-muted mb-5 leading-relaxed">
          {getApiErrorMessage(previewError) || 'Phiên phục vụ không tồn tại hoặc đã được đóng trước đó.'}
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate('/tables')}>
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Quay lại sơ đồ bàn
        </Button>
      </div>
    )
  }

  const items = preview?.items || []
  const subtotal = preview?.subtotal || 0
  const discountAmount = preview?.discountAmount || 0
  const finalAmount = preview?.finalAmount || 0

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(parsedTableId ? `/tables/${parsedTableId}` : '/tables')}
            className="text-muted hover:text-text p-2 h-auto"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-text flex items-center gap-2">
              <Receipt className="w-5 h-5 text-accent" />
              Thanh toán & Xuất hóa đơn
            </h1>
            <p className="text-xs text-muted">
              Bàn: <strong className="text-text">{preview?.tableCode || table?.tableCode || 'Chưa xác định'}</strong>
              {' • '}Phiên phục vụ: <span className="font-mono">#{effectiveSessionId}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List of Completed Items */}
        <div className="lg:col-span-7 bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
            <h3 className="text-sm font-bold text-text flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-accent" />
              Món ăn đã phục vụ ({items.length} món)
            </h3>
            <span className="text-xs text-muted">Chỉ tính các món đã hoàn thành</span>
          </div>

          {items.length === 0 ? (
            <div className="py-12 text-center text-muted text-xs">
              Bàn này chưa có món ăn nào được hoàn thành để xuất hóa đơn.
            </div>
          ) : (
            <div className="flex-1 divide-y divide-border/60 overflow-y-auto max-h-[420px] pr-1">
              {items.map((item) => (
                <div key={item.menuItemId} className="py-3 flex items-center justify-between text-sm">
                  <div className="flex-1 pr-3">
                    <p className="font-medium text-text leading-tight">{item.menuItemName}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {formatPrice(item.unitPrice)} x {item.quantity}
                    </p>
                  </div>
                  <div className="text-right font-bold text-text">
                    {formatPrice(item.subtotal)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 mt-auto border-t border-border flex justify-between items-center text-sm font-semibold">
            <span className="text-muted">Tổng tạm tính:</span>
            <span className="text-base text-text">{formatPrice(subtotal)}</span>
          </div>
        </div>

        {/* Right Column: Discount & Checkout Actions */}
        <div className="lg:col-span-5 space-y-5">
          {/* Discount Settings Card */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-text flex items-center gap-2">
              <Tag className="w-4 h-4 text-accent" />
              Áp dụng giảm giá
            </h3>

            {/* Discount Type Selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setDiscountType('NONE')
                  setDiscountValueInput('0')
                }}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                  discountType === 'NONE'
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-surface text-muted hover:text-text border-border'
                }`}
              >
                Không giảm
              </button>
              <button
                type="button"
                onClick={() => {
                  setDiscountType('PERCENTAGE')
                  if (numericDiscountValue === 0) setDiscountValueInput('10')
                }}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1 ${
                  discountType === 'PERCENTAGE'
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-surface text-muted hover:text-text border-border'
                }`}
              >
                <Percent className="w-3.5 h-3.5" />
                Giảm theo %
              </button>
              <button
                type="button"
                onClick={() => {
                  setDiscountType('FIXED_AMOUNT')
                  if (numericDiscountValue === 0) setDiscountValueInput('50000')
                }}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1 ${
                  discountType === 'FIXED_AMOUNT'
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-surface text-muted hover:text-text border-border'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                Số tiền (₫)
              </button>
            </div>

            {/* Discount Value Input (Conditional) */}
            {discountType !== 'NONE' && (
              <div className="space-y-3 pt-2 animate-in fade-in">
                <div>
                  <label className="text-xs font-semibold text-text mb-1 block">
                    {discountType === 'PERCENTAGE' ? 'Mức giảm (%)' : 'Số tiền giảm (VNĐ)'}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max={discountType === 'PERCENTAGE' ? '100' : undefined}
                    value={discountValueInput}
                    onChange={(e) => setDiscountValueInput(e.target.value)}
                    placeholder={discountType === 'PERCENTAGE' ? 'Ví dụ: 10' : 'Ví dụ: 50000'}
                    leftIcon={discountType === 'PERCENTAGE' ? <Percent className="w-4 h-4 text-muted" /> : <Banknote className="w-4 h-4 text-muted" />}
                  />
                  {discountType === 'PERCENTAGE' && numericDiscountValue > 100 && (
                    <p className="text-[11px] text-status-cancelled mt-1">Phần trăm giảm không được vượt quá 100%</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-text mb-1 block">
                    Lý do giảm giá
                  </label>
                  <Input
                    type="text"
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    placeholder="Ví dụ: Khách VIP, Sinh nhật, Khai trương..."
                    leftIcon={<FileText className="w-4 h-4 text-muted" />}
                  />
                </div>
              </div>
            )}

            {/* Note Input */}
            <div>
              <label className="text-xs font-semibold text-text mb-1 block">
                Ghi chú hóa đơn (tùy chọn)
              </label>
              <Input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú thêm nếu có..."
              />
            </div>
          </div>

          {/* Payment Summary Box */}
          <div className="bg-card border-2 border-primary/20 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider">
              Tóm tắt thanh toán
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted">
                <span>Tổng tạm tính:</span>
                <span className="font-semibold text-text">{formatPrice(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>
                    Số tiền giảm
                    {discountType === 'PERCENTAGE' && ` (${numericDiscountValue}%)`}:
                  </span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-border flex justify-between items-baseline">
                <span className="font-extrabold text-sm text-text">Khách cần thanh toán:</span>
                <span className="text-xl font-black text-emerald-600">
                  {formatPrice(finalAmount)}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={() => checkoutMutation.mutate()}
              isLoading={checkoutMutation.isPending}
              disabled={items.length === 0 || (discountType === 'PERCENTAGE' && numericDiscountValue > 100)}
              className="w-full mt-3 font-bold text-sm shadow-md uppercase tracking-wider"
            >
              <Receipt className="w-4 h-4 mr-2" />
              Xác nhận xuất hóa đơn & Đóng bàn
            </Button>
            <p className="text-[11px] text-center text-muted">
              Sau khi xác nhận, hóa đơn sẽ được tạo và bàn sẽ được giải phóng ngay lập tức.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
export default InvoiceCheckoutPage

