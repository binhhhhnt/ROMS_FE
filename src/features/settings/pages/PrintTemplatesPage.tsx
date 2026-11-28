import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Printer, Receipt, ChefHat, CheckCircle2, Settings } from 'lucide-react'
import { settingsApi } from '@/features/settings/api/settingsApi'
import {
  buildReceiptHtml,
  printReceiptViaBrowser,
  type ReceiptPrintData,
} from '@/features/billing/utils/receiptPrinter'
import {
  buildKitchenOrderTicketHtml,
  buildKitchenReadyTicketHtml,
  printKitchenOrderTicketViaBrowser,
  printKitchenReadyTicketViaBrowser,
  type KitchenReadyTicketPrintData,
} from '@/features/kitchen/utils/kitchenTicketPrinter'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'

type PrintTab = 'bill' | 'ready' | 'order'
type PaperOption = 'DEFAULT' | 'K80' | 'K58' | 'A5'

const SAMPLE_NOW = '2026-11-28T18:30:00.000Z'
const SAMPLE_OPENED = '2026-11-28T17:15:00.000Z'

export function PrintTemplatesPage() {
  const [activeTab, setActiveTab] = useState<PrintTab>('bill')
  const [paperOverride, setPaperOverride] = useState<PaperOption>('DEFAULT')

  const { data: settings, isLoading } = useQuery({
    queryKey: ['restaurant-settings'],
    queryFn: () => settingsApi.getSettings(),
  })

  const activePaperSize: 'K80' | 'K58' | 'A5' = useMemo(() => {
    if (paperOverride !== 'DEFAULT') return paperOverride
    if (activeTab === 'bill') {
      return (settings?.billPaperSize as 'K80' | 'K58' | 'A5') || 'K80'
    }
    return (settings?.readyTicketPaperSize as 'K80' | 'K58' | 'A5') || 'K80'
  }, [activeTab, paperOverride, settings])

  const sampleReceiptData: ReceiptPrintData = useMemo(
    () => ({
      title: 'HÓA ĐƠN THANH TOÁN',
      restaurantName: settings?.restaurantName || 'Nhà hàng ROMS',
      address: settings?.address || '123 Đường Ẩm Thực, TP. Hồ Chí Minh',
      phone: settings?.phone || '0901 234 567',
      receiptFooter:
        settings?.receiptFooter || 'Cảm ơn Quý khách và Hẹn gặp lại!',
      cashierName: 'Thu ngân mẫu',
      tableCode: 'Bàn T01',
      openedAt: SAMPLE_OPENED,
      closedAt: SAMPLE_NOW,
      billCode: 'BILL-20261128-0001',
      items: [
        {
          index: 1,
          itemName: 'Phở bò đặc biệt',
          quantity: 2,
          unitPrice: 65000,
          subtotal: 130000,
        },
        {
          index: 2,
          itemName: 'Trà đào cam sả',
          quantity: 2,
          unitPrice: 35000,
          subtotal: 70000,
        },
      ],
      taxRows: [{ rate: 8, amount: 16000 }],
      amountBeforeDiscount: 216000,
      discountAmount: 21600,
      promotionCode: 'GIAM10',
      surchargeAmount: 0,
      totalAmount: 194000,
      payments: [{ method: 'CASH', amount: 194000 }],
      paperSize: activePaperSize,
    }),
    [activePaperSize, settings]
  )

  const sampleKitchenTicketData: KitchenReadyTicketPrintData = useMemo(
    () => ({
      tableCode: 'Bàn T01',
      orderId: 1024,
      orderCreatedAt: SAMPLE_NOW,
      items: [
        {
          itemName: 'Phở bò đặc biệt',
          quantity: 2,
          note: 'Ít hành, nhiều nước dùng',
        },
        {
          itemName: 'Gỏi cuốn tôm thịt',
          quantity: 1,
          note: null,
        },
      ],
      paperSize: activePaperSize,
    }),
    [activePaperSize]
  )

  const previewHtml = useMemo(() => {
    if (activeTab === 'bill') return buildReceiptHtml(sampleReceiptData)
    if (activeTab === 'ready')
      return buildKitchenReadyTicketHtml(sampleKitchenTicketData)
    return buildKitchenOrderTicketHtml(sampleKitchenTicketData)
  }, [activeTab, sampleReceiptData, sampleKitchenTicketData])

  const handleTestPrint = () => {
    if (activeTab === 'bill') {
      printReceiptViaBrowser(sampleReceiptData)
      return
    }
    if (activeTab === 'ready') {
      printKitchenReadyTicketViaBrowser(sampleKitchenTicketData)
      return
    }
    printKitchenOrderTicketViaBrowser(sampleKitchenTicketData)
  }

  const previewFrameWidthClass =
    activePaperSize === 'A5'
      ? 'w-full max-w-[560px]'
      : activePaperSize === 'K58'
        ? 'w-full max-w-[270px]'
        : 'w-full max-w-[350px]'

  const configuredPaperLabel =
    activeTab === 'bill'
      ? settings?.billPaperSize || 'K80'
      : settings?.readyTicketPaperSize || 'K80'

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2.5">
            <Printer className="w-6 h-6 text-primary" />
            Quản lý phiếu in
          </h1>
          <p className="text-sm text-muted mt-1">
            Xem trước mẫu hiển thị thực tế và in thử cho Hóa đơn, Phiếu ra món và Phiếu order bếp.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/owner/settings">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-1.5" />
              Cài đặt thông tin in
            </Button>
          </Link>
          <Button variant="primary" size="sm" onClick={handleTestPrint} disabled={isLoading}>
            <Printer className="w-4 h-4 mr-1.5" />
            In thử mẫu phiếu
          </Button>
        </div>
      </div>

      {/* 3 Tabs + Paper Size Selector */}
      <Card className="p-4 border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 bg-surface/60 p-1 rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setActiveTab('bill')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'bill'
                ? 'bg-card text-primary shadow-xs'
                : 'text-muted hover:text-text'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            Hóa đơn
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ready')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'ready'
                ? 'bg-card text-primary shadow-xs'
                : 'text-muted hover:text-text'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Phiếu ra món
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('order')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'order'
                ? 'bg-card text-primary shadow-xs'
                : 'text-muted hover:text-text'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            Phiếu order
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted font-medium">Khổ giấy xem trước:</span>
          <select
            value={paperOverride}
            onChange={(e) => setPaperOverride(e.target.value as PaperOption)}
            className="h-9 px-3 rounded-md border border-border bg-card text-text font-medium focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="DEFAULT">Theo cài đặt ({configuredPaperLabel})</option>
            <option value="K80">K80 (80mm)</option>
            <option value="K58">K58 (58mm)</option>
            <option value="A5">A5</option>
          </select>
        </div>
      </Card>

      {/* Live Thermal Ticket Preview */}
      <Card className="p-6 border border-border bg-surface/40 flex flex-col items-center justify-center">
        {isLoading ? (
          <div className="h-[460px] flex items-center justify-center text-sm text-muted">
            Đang tải cấu hình phiếu in...
          </div>
        ) : (
          <div
            className={`${previewFrameWidthClass} bg-white rounded-lg border border-border shadow-md overflow-hidden transition-all`}
          >
            <iframe
              title={`Xem trước ${activeTab}`}
              srcDoc={previewHtml}
              className="w-full h-[540px] border-0 bg-white"
            />
          </div>
        )}
      </Card>
    </div>
  )
}

export default PrintTemplatesPage
