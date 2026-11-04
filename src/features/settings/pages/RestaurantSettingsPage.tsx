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
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { toast } from 'sonner'
import { settingsApi } from '@/features/settings/api/settingsApi'
import { TaxCategoryModal } from '@/features/settings/components/TaxCategoryModal'
import { getApiErrorMessage } from '@/shared/lib/axios'

export function RestaurantSettingsPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [includesVat, setIncludesVat] = useState<boolean>(true)
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

  // Synchronize local toggle state when settings arrive
  useEffect(() => {
    if (settings) {
      const serverVal = Boolean(settings.menuPriceIncludesVat)
      setIncludesVat(serverVal)
      setIsDirty(false)
    }
  }, [settings])

  // 2. Fetch tax categories
  const {
    data: taxCategories = [],
    isLoading: isLoadingTax,
    refetch: refetchTaxCategories,
  } = useQuery({
    queryKey: ['tax-categories'],
    queryFn: () => settingsApi.getTaxCategories(),
  })

  // 3. Mutation to update restaurant settings
  const updateMutation = useMutation({
    mutationFn: (menuPriceIncludesVat: boolean) =>
      settingsApi.updateSettings({ menuPriceIncludesVat }),
    onSuccess: (data) => {
      queryClient.setQueryData(['restaurant-settings'], data)
      const serverVal = Boolean(data.menuPriceIncludesVat)
      setIncludesVat(serverVal)
      setIsDirty(false)
      toast.success(
        serverVal
          ? 'Đã đổi cấu hình: Giá menu ĐÃ bao gồm thuế VAT'
          : 'Đã đổi cấu hình: Giá menu CHƯA bao gồm thuế VAT'
      )
    },
    onError: (err) => {
      toast.error('Không thể cập nhật cấu hình nhà hàng: ' + getApiErrorMessage(err))
    },
  })

  const handleToggleVat = (val: boolean) => {
    setIncludesVat(val)
    if (settings) {
      const serverVal = Boolean(settings.menuPriceIncludesVat)
      setIsDirty(val !== serverVal)
    }
  }

  const handleSaveSettings = () => {
    updateMutation.mutate(includesVat)
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
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text tracking-tight">Cài đặt Nhà hàng & Thuế VAT</h1>
              <p className="text-sm text-text-secondary">
                Quản lý chính sách tính thuế GTGT và cấu hình danh mục thuế suất trên thực đơn
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            refetchSettings()
            refetchTaxCategories()
          }}
          className="self-start sm:self-auto gap-1.5"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </Button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: VAT Calculation Toggle Card (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-border shadow-sm">
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

            <CardContent className="p-6 space-y-6">
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
                      onClick={() => handleToggleVat(true)}
                      className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        includesVat
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border bg-card hover:bg-surface/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-text text-sm">Đã bao gồm VAT</span>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                            includesVat ? 'border-primary bg-primary text-white' : 'border-border'
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
                      onClick={() => handleToggleVat(false)}
                      className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        !includesVat
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border bg-card hover:bg-surface/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-text text-sm">Chưa bao gồm VAT</span>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                            !includesVat ? 'border-primary bg-primary text-white' : 'border-border'
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

                  {/* Save Button */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-text-secondary">
                      {isDirty ? (
                        <span className="text-amber-600 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Có thay đổi chưa lưu
                        </span>
                      ) : (
                        'Cấu hình đang đồng bộ với hệ thống'
                      )}
                    </span>
                    <Button
                      onClick={handleSaveSettings}
                      disabled={!isDirty || updateMutation.isPending}
                      className="bg-primary hover:bg-primary-hover text-white gap-2"
                    >
                      {updateMutation.isPending ? 'Đang lưu...' : 'Lưu cấu hình VAT'}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Tax Categories Management Card (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-border shadow-sm">
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

            <CardContent className="p-0">
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
