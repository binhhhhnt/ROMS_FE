import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import QRCode from 'qrcode'
import { Download, QrCode, RefreshCw, Loader2, CheckSquare, Square } from 'lucide-react'
import { toast } from 'sonner'
import { settingsApi } from '@/features/settings/api/settingsApi'
import { tableApi } from '@/features/tables/api/tableApi'
import { qrApi } from '../api/qrApi'
import type { GenerateTableQrResponse } from '../types/qr.types'
import { buildTableQrUrl, exportTableQrsToPdf } from '../utils/qrPdfExport'
import { Button } from '@/shared/components/ui/button'
import { getApiErrorMessage } from '@/shared/lib/axios'

export function OwnerQrTablesPage() {
  const queryClient = useQueryClient()
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [generated, setGenerated] = useState<GenerateTableQrResponse | null>(null)
  const [qrDataUrls, setQrDataUrls] = useState<Record<number, string>>({})
  const [isToggling, setIsToggling] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['restaurantSettings'],
    queryFn: settingsApi.getSettings,
  })

  const { data: tablesPage, isLoading: isLoadingTables } = useQuery({
    queryKey: ['ownerQrTables'],
    queryFn: () => tableApi.getTables({ page: 0, size: 100, sort: 'tableCode,asc' }),
  })

  const qrEnabled = Boolean(settings?.qrOrderingEnabled ?? true)
  const tables = tablesPage?.content || []

  useEffect(() => {
    if (!generated?.tables.length) {
      setQrDataUrls({})
      return
    }
    let cancelled = false
    void (async () => {
      const next: Record<number, string> = {}
      for (const t of generated.tables) {
        next[t.tableId] = await QRCode.toDataURL(buildTableQrUrl(t.qrToken), {
          width: 220,
          margin: 1,
        })
      }
      if (!cancelled) setQrDataUrls(next)
    })()
    return () => {
      cancelled = true
    }
  }, [generated])

  const handleToggleQrOrdering = async () => {
    if (!settings || isToggling) return
    setIsToggling(true)
    try {
      await settingsApi.updateSettings({
        menuPriceIncludesVat: settings.menuPriceIncludesVat,
        restaurantName: settings.restaurantName,
        address: settings.address,
        phone: settings.phone,
        receiptFooter: settings.receiptFooter,
        printReadyTicket: settings.printReadyTicket,
        billPrinterName: settings.billPrinterName,
        billPaperSize: settings.billPaperSize,
        readyTicketPrinterName: settings.readyTicketPrinterName,
        readyTicketPaperSize: settings.readyTicketPaperSize,
        qrOrderingEnabled: !qrEnabled,
      })
      await queryClient.invalidateQueries({ queryKey: ['restaurantSettings'] })
      toast.success(!qrEnabled ? 'Đã bật chức năng gọi món QR' : 'Đã tắt chức năng gọi món QR')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsToggling(false)
    }
  }

  const toggleTable = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    if (selectedIds.length === tables.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(tables.map((t) => t.id))
    }
  }

  const handleGenerate = async (regenerate = false) => {
    if (selectedIds.length === 0 || isGenerating) {
      toast.error('Vui lòng tích chọn ít nhất 1 bàn')
      return
    }
    setIsGenerating(true)
    try {
      const res = await qrApi.generateTableQrTokens(selectedIds, regenerate)
      setGenerated(res)
      toast.success(`Đã tạo mã QR cho ${res.tables.length} bàn`)
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExportPdf = async () => {
    if (!generated || generated.tables.length === 0 || isExporting) return
    setIsExporting(true)
    try {
      await exportTableQrsToPdf(generated)
      toast.success('Đã tải xuống file PDF danh sách mã QR')
    } catch {
      toast.error('Không thể xuất file PDF. Vui lòng thử lại.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <QrCode className="w-6 h-6 text-primary" />
            Quản lý QR gọi món
          </h1>
          <p className="text-sm text-muted mt-1">
            Bật/tắt chức năng gọi món qua QR và tạo danh sách mã QR theo bàn để in PDF.
          </p>
        </div>

        {/* Toggle Switch */}
        <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
          <div>
            <p className="text-sm font-semibold text-text">Gọi món qua QR</p>
            <p className="text-xs text-muted">
              {qrEnabled ? 'Đang bật cho khách quét' : 'Đang tạm tắt'}
            </p>
          </div>
          <Button
            variant={qrEnabled ? 'primary' : 'outline'}
            size="sm"
            disabled={isLoadingSettings || isToggling}
            onClick={() => void handleToggleQrOrdering()}
          >
            {qrEnabled ? 'Đang bật' : 'Đang tắt'}
          </Button>
        </div>
      </div>

      {!qrEnabled ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center space-y-2">
          <QrCode className="w-10 h-10 text-muted mx-auto opacity-50" />
          <p className="font-semibold text-text">Chức năng QR gọi món đang tắt</p>
          <p className="text-sm text-muted">
            Bật chức năng ở góc trên bên phải để quản lý và tạo mã QR cho các bàn.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Table Selection List */}
          <div className="lg:col-span-5 bg-card border border-border rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-text">
                Danh sách bàn ({selectedIds.length}/{tables.length})
              </h2>
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {selectedIds.length === tables.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </div>

            {isLoadingTables ? (
              <div className="py-10 flex justify-center text-muted">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : (
              <div className="max-h-[420px] overflow-y-auto divide-y divide-border border border-border rounded-lg">
                {tables.map((t) => {
                  const checked = selectedIds.includes(t.id)
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTable(t.id)}
                      className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-surface/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        {checked ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : (
                          <Square className="w-4 h-4 text-muted" />
                        )}
                        <div>
                          <p className="text-sm font-semibold text-text">
                            Bàn {t.tableCode}
                          </p>
                          <p className="text-xs text-muted">
                            {t.area || 'Khu vực chung'} • {t.capacity} chỗ
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          t.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {t.isActive ? 'Hoạt động' : 'Tạm ngưng'}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={selectedIds.length === 0 || isGenerating}
                onClick={() => void handleGenerate(false)}
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <QrCode className="w-4 h-4 mr-1.5" />
                )}
                Tạo mã QR
              </Button>
              <Button
                variant="outline"
                disabled={selectedIds.length === 0 || isGenerating}
                onClick={() => void handleGenerate(true)}
                title="Cấp lại mã QR mới (vô hiệu hóa mã cũ)"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* QR Preview & PDF Export */}
          <div className="lg:col-span-7 bg-card border border-border rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-text">Xem trước mẫu QR</h2>
              <Button
                size="sm"
                disabled={!generated || generated.tables.length === 0 || isExporting}
                onClick={() => void handleExportPdf()}
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-1.5" />
                )}
                Tải danh sách PDF
              </Button>
            </div>

            {!generated ? (
              <div className="py-16 text-center text-sm text-muted border border-dashed border-border rounded-xl">
                Tích chọn các bàn bên trái và bấm <strong>Tạo mã QR</strong> để xem trước và tải PDF.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {generated.tables.map((item) => (
                  <div
                    key={item.tableId}
                    className="border border-border rounded-xl overflow-hidden bg-white text-center shadow-xs"
                  >
                    <div className="bg-primary text-white px-3 py-2.5">
                      <p className="font-bold text-sm truncate">
                        {generated.restaurantName}
                      </p>
                      {generated.address && (
                        <p className="text-[11px] text-surface/90 truncate">
                          {generated.address}
                        </p>
                      )}
                    </div>
                    <div className="p-4 space-y-2 flex flex-col items-center">
                      <p className="font-bold text-base text-primary">
                        BÀN {item.tableCode}
                      </p>
                      {qrDataUrls[item.tableId] ? (
                        <img
                          src={qrDataUrls[item.tableId]}
                          alt={`QR Bàn ${item.tableCode}`}
                          className="w-40 h-40"
                        />
                      ) : (
                        <div className="w-40 h-40 flex items-center justify-center bg-slate-50">
                          <Loader2 className="w-5 h-5 animate-spin text-muted" />
                        </div>
                      )}
                      <p className="text-[11px] text-muted">
                        Quét mã QR để xem thực đơn & gọi món
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
