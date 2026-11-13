import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Sliders,
  Receipt,
  Percent,
  Plus,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Printer,
  Store,
  Save,
  RotateCcw,
  ChefHat,
  Phone,
  MapPin,
  FileText,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { toast } from 'sonner'
import { settingsApi } from '@/features/settings/api/settingsApi'
import { TaxCategoryModal } from '@/features/settings/components/TaxCategoryModal'
import { getApiErrorMessage } from '@/shared/lib/axios'
import type { UpdateSettingRequest } from '@/features/settings/types/settings.types'

export function RestaurantSettingsPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form states
  const [includesVat, setIncludesVat] = useState<boolean>(true)
  const [restaurantName, setRestaurantName] = useState<string>('Nhà hàng ROMS')
  const [address, setAddress] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [receiptFooter, setReceiptFooter] = useState<string>('')
  const [printReadyTicket, setPrintReadyTicket] = useState<boolean>(true)
  const [billPrinterName, setBillPrinterName] = useState<string>('')
  const [billPaperSize, setBillPaperSize] = useState<'A5' | 'K80' | 'K58'>('K80')
  const [readyTicketPrinterName, setReadyTicketPrinterName] = useState<string>('')
  const [readyTicketPaperSize, setReadyTicketPaperSize] = useState<'A5' | 'K80' | 'K58'>('K80')

  const [isDirty, setIsDirty] = useState(false)

  // 1. Fetch current restaurant settings
  const {
    data: settings,
    isLoading: isLoadingSettings,
    isError: isSettingsError,
    refetch: refetchSettings,
  } = useQuery({
    queryKey: ['restaurant-settings'],
    queryFn: () => settingsApi.getSettings(),
  })

  // 2. Fetch available host OS printers
  const {
    data: availablePrinters = [],
    isLoading: isLoadingPrinters,
    refetch: refetchPrinters,
  } = useQuery({
    queryKey: ['available-printers'],
    queryFn: () => settingsApi.getAvailablePrinters(),
  })

  // 3. Fetch tax categories
  const {
    data: taxCategories = [],
    isLoading: isLoadingTax,
    refetch: refetchTaxCategories,
  } = useQuery({
    queryKey: ['tax-categories'],
    queryFn: () => settingsApi.getTaxCategories(),
  })

  // Synchronize local form state when settings arrive
  const resetFormToSettings = () => {
    if (settings) {
      setIncludesVat(Boolean(settings.menuPriceIncludesVat))
      setRestaurantName(settings.restaurantName || 'Nhà hàng ROMS')
      setAddress(settings.address || '')
      setPhone(settings.phone || '')
      setReceiptFooter(settings.receiptFooter || '')
      setPrintReadyTicket(settings.printReadyTicket !== false)
      setBillPrinterName(settings.billPrinterName || '')
      setBillPaperSize((settings.billPaperSize as 'A5' | 'K80' | 'K58') || 'K80')
      setReadyTicketPrinterName(settings.readyTicketPrinterName || '')
      setReadyTicketPaperSize((settings.readyTicketPaperSize as 'A5' | 'K80' | 'K58') || 'K80')
      setIsDirty(false)
    }
  }

  useEffect(() => {
    resetFormToSettings()
  }, [settings])

  // Track isDirty whenever user edits a field
  useEffect(() => {
    if (!settings) return
    const hasChanged =
      includesVat !== Boolean(settings.menuPriceIncludesVat) ||
      restaurantName !== (settings.restaurantName || 'Nhà hàng ROMS') ||
      address !== (settings.address || '') ||
      phone !== (settings.phone || '') ||
      receiptFooter !== (settings.receiptFooter || '') ||
      printReadyTicket !== (settings.printReadyTicket !== false) ||
      billPrinterName !== (settings.billPrinterName || '') ||
      billPaperSize !== ((settings.billPaperSize as any) || 'K80') ||
      readyTicketPrinterName !== (settings.readyTicketPrinterName || '') ||
      readyTicketPaperSize !== ((settings.readyTicketPaperSize as any) || 'K80')

    setIsDirty(hasChanged)
  }, [
    includesVat,
    restaurantName,
    address,
    phone,
    receiptFooter,
    printReadyTicket,
    billPrinterName,
    billPaperSize,
    readyTicketPrinterName,
    readyTicketPaperSize,
    settings,
  ])

  // 4. Mutation to update all restaurant settings
  const updateMutation = useMutation({
    mutationFn: (payload: UpdateSettingRequest) => settingsApi.updateSettings(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(['restaurant-settings'], data)
      toast.success('Đã lưu toàn bộ cấu hình nhà hàng & in ấn thành công!')
      setIsDirty(false)
    },
    onError: (err) => {
      toast.error('Không thể cập nhật cấu hình: ' + getApiErrorMessage(err))
    },
  })

  const handleSaveAllSettings = () => {
    updateMutation.mutate({
      menuPriceIncludesVat: includesVat,
      restaurantName: restaurantName.trim(),
      address: address.trim(),
      phone: phone.trim(),
      receiptFooter: receiptFooter.trim(),
      printReadyTicket,
      billPrinterName: billPrinterName.trim() ? billPrinterName.trim() : null,
      billPaperSize,
      readyTicketPrinterName: readyTicketPrinterName.trim() ? readyTicketPrinterName.trim() : null,
      readyTicketPaperSize,
    })
  }

  // Example calculation calculation for demonstration
  const examplePrice = 100000
  const exampleTaxRate = 8
  const vatAmountIncluded = Math.round(examplePrice - examplePrice / (1 + exampleTaxRate / 100))
  const priceBeforeTaxIncluded = examplePrice - vatAmountIncluded

  const priceBeforeTaxExcluded = examplePrice
  const vatAmountExcluded = Math.round((examplePrice * exampleTaxRate) / 100)
  const totalCustomerPaysExcluded = priceBeforeTaxExcluded + vatAmountExcluded

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text tracking-tight">Cài đặt Nhà hàng & In ấn</h1>
              <p className="text-sm text-text-secondary">
                Quản lý chính sách tính thuế VAT, thông tin biên lai và cấu hình máy in hóa đơn / phiếu bếp
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDirty && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFormToSettings}
              disabled={updateMutation.isPending}
              className="gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              Hoàn tác
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleSaveAllSettings}
            disabled={!isDirty || updateMutation.isPending}
            className="bg-primary hover:bg-primary-hover text-white gap-2"
          >
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? 'Đang lưu...' : 'Lưu cấu hình'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchSettings()
              refetchPrinters()
              refetchTaxCategories()
            }}
            className="gap-1.5"
            title="Làm mới toàn bộ dữ liệu"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Dirty notification banner */}
      {isDirty && (
        <div className="flex items-center justify-between p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-400 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Bạn có thay đổi cấu hình chưa được lưu vào hệ thống.</span>
          </div>
          <Button
            size="sm"
            onClick={handleSaveAllSettings}
            disabled={updateMutation.isPending}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-7 gap-1"
          >
            <Save className="w-3.5 h-3.5" />
            Lưu ngay
          </Button>
        </div>
      )}

      {/* Section 1: VAT Policy & Tax Categories (2 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: VAT Calculation Toggle Card (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-border shadow-sm h-full flex flex-col">
            <CardHeader className="bg-surface/30 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-accent" />
                  <CardTitle className="text-lg">Phương thức tính Thuế VAT</CardTitle>
                </div>
                {settings && (
                  <Badge
                    variant={settings.menuPriceIncludesVat ? 'default' : 'secondary'}
                    className={
                      settings.menuPriceIncludesVat
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-amber-500 hover:bg-amber-600 text-white'
                    }
                  >
                    {settings.menuPriceIncludesVat ? 'Giá đã gồm VAT' : 'Giá chưa gồm VAT'}
                  </Badge>
                )}
              </div>
              <CardDescription>
                Quyết định giá niêm yết trên menu đã bao gồm thuế hay sẽ cộng thêm thuế khi tính tiền
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-6 flex-1 flex flex-col justify-between">
              {isLoadingSettings ? (
                <div className="py-8 text-center text-text-secondary text-sm">
                  Đang tải cấu hình nhà hàng...
                </div>
              ) : isSettingsError ? (
                <div className="py-6 text-center text-red-500 text-sm flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Không thể nạp cấu hình. Vui lòng nhấn nút Làm mới.
                </div>
              ) : (
                <>
                  {/* Radio / Toggle Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Option 1: Included */}
                    <div
                      onClick={() => setIncludesVat(true)}
                      className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${includesVat
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border bg-card hover:bg-surface/50'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-text text-sm">Đã bao gồm VAT</span>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border ${includesVat ? 'border-primary bg-primary text-white' : 'border-border'
                            }`}
                        >
                          {includesVat && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Giá hiển thị trên menu là số tiền cuối cùng khách phải thanh toán. Thuế được khấu trừ ngầm bên trong.
                      </p>
                    </div>

                    {/* Option 2: Excluded */}
                    <div
                      onClick={() => setIncludesVat(false)}
                      className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${!includesVat
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border bg-card hover:bg-surface/50'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-text text-sm">Chưa bao gồm VAT</span>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border ${!includesVat ? 'border-primary bg-primary text-white' : 'border-border'
                            }`}
                        >
                          {!includesVat && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Giá hiển thị trên menu là giá trước thuế. Khi thanh toán sẽ cộng thêm tiền thuế VAT vào hóa đơn.
                      </p>
                    </div>
                  </div>

                  {/* Illustrative Simulation Table */}
                  <div className="rounded-xl border border-border bg-surface/20 p-4 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-text uppercase tracking-wider">
                      <HelpCircle className="w-3.5 h-3.5 text-accent" />
                      Minh họa tính toán (Ví dụ món niêm yết 100.000đ, VAT 8%)
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-border text-text-secondary">
                            <th className="py-2 pr-3 font-medium">Cấu hình</th>
                            <th className="py-2 px-3 font-medium">Giá trước thuế</th>
                            <th className="py-2 px-3 font-medium">VAT (8%)</th>
                            <th className="py-2 pl-3 font-medium text-right">Khách phải trả</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          <tr className={includesVat ? 'bg-primary/10 font-medium' : ''}>
                            <td className="py-2.5 pr-3 text-text">
                              Giá menu đã bao gồm VAT {includesVat && '✓ (Hiện chọn)'}
                            </td>
                            <td className="py-2.5 px-3 text-text-secondary">
                              {priceBeforeTaxIncluded.toLocaleString('vi-VN')}đ
                            </td>
                            <td className="py-2.5 px-3 text-text-secondary">
                              {vatAmountIncluded.toLocaleString('vi-VN')}đ
                            </td>
                            <td className="py-2.5 pl-3 text-right font-bold text-primary">
                              {examplePrice.toLocaleString('vi-VN')}đ
                            </td>
                          </tr>
                          <tr className={!includesVat ? 'bg-primary/10 font-medium' : ''}>
                            <td className="py-2.5 pr-3 text-text">
                              Giá menu chưa bao gồm VAT {!includesVat && '✓ (Hiện chọn)'}
                            </td>
                            <td className="py-2.5 px-3 text-text-secondary">
                              {priceBeforeTaxExcluded.toLocaleString('vi-VN')}đ
                            </td>
                            <td className="py-2.5 px-3 text-text-secondary">
                              {vatAmountExcluded.toLocaleString('vi-VN')}đ
                            </td>
                            <td className="py-2.5 pl-3 text-right font-bold text-primary">
                              {totalCustomerPaysExcluded.toLocaleString('vi-VN')}đ
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Tax Categories Management Card (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-border shadow-sm h-full flex flex-col">
            <CardHeader className="bg-surface/30 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Percent className="w-5 h-5 text-accent" />
                  <CardTitle className="text-lg">Danh mục Thuế suất</CardTitle>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                  className="bg-primary hover:bg-primary-hover text-white gap-1.5 h-8 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm mức thuế
                </Button>
              </div>
              <CardDescription>
                Các mức thuế suất (%) được cấu hình cho từng món ăn trong thực đơn
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0 flex-1 overflow-y-auto max-h-[360px]">
              {isLoadingTax ? (
                <div className="py-8 text-center text-text-secondary text-sm">
                  Đang tải danh sách thuế suất...
                </div>
              ) : taxCategories.length === 0 ? (
                <div className="py-8 text-center text-text-secondary text-sm">
                  Chưa có mức thuế suất nào. Vui lòng bấm &quot;Thêm mức thuế&quot;.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {taxCategories.map((tax) => {
                    const isDefault = Number(tax.rate) === 8.0
                    return (
                      <div
                        key={tax.id}
                        className="flex items-center justify-between p-4 hover:bg-surface/20 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center font-bold text-accent text-sm">
                            {tax.rate}%
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-text text-sm">
                                Thuế suất {tax.rate}%
                              </span>
                              {isDefault && (
                                <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                                  Mặc định F&B
                                </Badge>
                              )}
                              {Number(tax.rate) === 0 && (
                                <Badge variant="outline" className="text-[10px] text-text-secondary">
                                  Miễn thuế
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-text-secondary">
                              Mã danh mục: #{tax.id}
                            </span>
                          </div>
                        </div>

                        <div className="text-right text-xs text-text-secondary">
                          {tax.createdAt ? new Date(tax.createdAt).toLocaleDateString('vi-VN') : ''}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section 2: Printer & Hardware Settings */}
      <Card className="border-border shadow-sm">
        <CardHeader className="bg-surface/30 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Cấu hình Máy in & Khổ giấy (Hardware)</CardTitle>
                <CardDescription>
                  Kết nối máy in nhiệt POS hoặc máy in văn phòng đã cài đặt trên hệ điều hành máy chủ Windows
                </CardDescription>
              </div>
            </div>
            {isLoadingPrinters ? (
              <Badge variant="outline" className="animate-pulse">Đang quét máy in...</Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                Tìm thấy {availablePrinters.length} máy in
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Box 1: Bill & Proforma Printer */}
            <div className="p-5 rounded-xl border border-border bg-surface/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-text text-sm">Máy in Hóa đơn & Phiếu tạm tính</h3>
                </div>
                <Badge variant="secondary" className="text-[10px]">Thu ngân / Quầy Bar</Badge>
              </div>
              <p className="text-xs text-text-secondary">
                Dùng khi in phiếu tạm tính tại bàn hoặc xuất hóa đơn thanh toán cho khách hàng.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-text mb-1">
                    Chọn máy in trên máy chủ:
                  </label>
                  <select
                    value={billPrinterName}
                    onChange={(e) => setBillPrinterName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">-- Không sử dụng (In qua trình duyệt) --</option>
                    {availablePrinters.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text mb-1">
                    Khổ giấy in hóa đơn:
                  </label>
                  <select
                    value={billPaperSize}
                    onChange={(e) => setBillPaperSize(e.target.value as 'A5' | 'K80' | 'K58')}
                    className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="K80">K80 (Khổ 80mm - Tiêu chuẩn quầy thu ngân F&B)</option>
                    <option value="K58">K58 (Khổ 58mm - Máy in bill mini nhỏ gọn)</option>
                    <option value="A5">A5 (148 x 210mm - Khổ giấy lớn văn phòng)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Box 2: Kitchen Ready Ticket Printer */}
            <div className="p-5 rounded-xl border border-border bg-surface/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-accent" />
                  <h3 className="font-semibold text-text text-sm">Máy in Phiếu ra món (Bếp / Bar)</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-secondary">
                    {printReadyTicket ? 'Đang bật' : 'Tắt'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPrintReadyTicket(!printReadyTicket)}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${printReadyTicket ? 'bg-primary' : 'bg-border'
                      }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${printReadyTicket ? 'translate-x-5' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
              </div>
              <p className="text-xs text-text-secondary">
                Tự động gửi lệnh in phiếu ra món gồm tên bàn và danh sách món khi nhân viên bếp nhấn &quot;Ready&quot;.
              </p>

              <div className={`space-y-3 pt-2 ${!printReadyTicket ? 'opacity-50 pointer-events-none' : ''}`}>
                <div>
                  <label className="block text-xs font-medium text-text mb-1">
                    Chọn máy in tại Bếp:
                  </label>
                  <select
                    value={readyTicketPrinterName}
                    onChange={(e) => setReadyTicketPrinterName(e.target.value)}
                    disabled={!printReadyTicket}
                    className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">-- Chưa chọn máy in bếp --</option>
                    {availablePrinters.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text mb-1">
                    Khổ giấy in phiếu ra món:
                  </label>
                  <select
                    value={readyTicketPaperSize}
                    onChange={(e) => setReadyTicketPaperSize(e.target.value as 'A5' | 'K80' | 'K58')}
                    disabled={!printReadyTicket}
                    className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="K80">K80 (Khổ 80mm - Tiêu chuẩn máy in bếp KDS)</option>
                    <option value="K58">K58 (Khổ 58mm - Phiếu ra món nhỏ gọn)</option>
                    <option value="A5">A5 (148 x 210mm - Khổ giấy lớn văn phòng)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Store & Receipt Information */}
      <Card className="border-border shadow-sm">
        <CardHeader className="bg-surface/30 border-b border-border">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-accent" />
            <div>
              <CardTitle className="text-lg">Thông tin Nhà hàng trên Biên lai & Hóa đơn</CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Restaurant Name */}
            <div>
              <label className="block text-xs font-medium text-text mb-1 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-text-secondary" />
                Tên nhà hàng / Quán ăn:
              </label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="Nhà hàng ROMS"
                maxLength={255}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Hotline / Phone */}
            <div>
              <label className="block text-xs font-medium text-text mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-text-secondary" />
                Số hotline / Điện thoại:
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901 234 567"
                maxLength={30}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-text mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-text-secondary" />
                Địa chỉ nhà hàng:
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Đường Ẩm Thực, Quận 1, TP. Hồ Chí Minh"
                maxLength={500}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Footer / Thank you note & Wifi */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-text mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-text-secondary" />
                Lời cảm ơn & Thông tin chân hóa đơn (Receipt Footer):
              </label>
              <textarea
                rows={2}
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                placeholder="Cảm ơn quý khách và hẹn gặp lại! Wifi: ROMS_VIP / Pass: 88888888"
                maxLength={500}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
              <span className="text-[11px] text-text-secondary mt-1 block">
                Thông tin này sẽ được in ở cuối mỗi phiếu tạm tính và hóa đơn thanh toán.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal create tax category */}
      <TaxCategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['tax-categories'] })
        }}
      />
    </div>
  )
}
