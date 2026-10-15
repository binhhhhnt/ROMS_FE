import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle2, ShieldAlert, Sparkles, BookOpen } from 'lucide-react'
import { reportApi } from '@/features/reports/api/reportApi'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { ReportNavTabs } from '@/features/reports/components/ReportNavTabs'
import { ReportFilterBar } from '@/features/reports/components/ReportFilterBar'
import { OperationsSummaryCards } from '@/features/reports/components/OperationsSummaryCards'
import { OrderFulfillmentAnalysis } from '@/features/reports/components/OrderFulfillmentAnalysis'
import { OperationsCapacityCard } from '@/features/reports/components/OperationsCapacityCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card'

export function OperationsReportPage() {
  const queryClient = useQueryClient()

  // Default date range: 30 days
  const [dates, setDates] = useState(() => {
    const today = new Date()
    const past = new Date()
    past.setDate(today.getDate() - 30)
    return {
      startDate: past.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    }
  })

  const [isExporting, setIsExporting] = useState(false)

  // Overview query containing operational metrics
  const {
    data: overview,
    isLoading: isLoadingOverview,
    isRefetching: isRefetchingOverview,
    isError: isOverviewError,
    error: overviewError,
  } = useQuery({
    queryKey: ['reports', 'overview', dates.startDate, dates.endDate],
    queryFn: () => reportApi.getOverview(dates.startDate, dates.endDate),
  })

  // Refresh data
  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['reports'] })
    toast.info('Đã làm mới dữ liệu báo cáo vận hành')
  }

  // Export CSV
  const handleExportCsv = async () => {
    setIsExporting(true)
    try {
      const blob = await reportApi.exportReportCsv(dates.startDate, dates.endDate)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `bao-cao-van-hanh-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Xuất file báo cáo vận hành CSV thành công!')
    } catch (err) {
      toast.error('Có lỗi khi tải file báo cáo: ' + getApiErrorMessage(err))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 text-left max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-text tracking-tight">
          Báo cáo Hiệu suất Vận hành
        </h1>
        <p className="text-xs text-muted mt-1">
          Theo dõi chất lượng hoàn tất đơn hàng, tỷ lệ hủy đơn, công suất phục vụ bàn và tình trạng cảnh báo kho.
        </p>
      </div>

      {/* Navigation Tabs */}
      <ReportNavTabs />

      {/* Filter Toolbar */}
      <ReportFilterBar
        startDate={dates.startDate}
        endDate={dates.endDate}
        onDateChange={(start, end) => setDates({ startDate: start, endDate: end })}
        onRefresh={handleRefresh}
        onExportCsv={handleExportCsv}
        isExporting={isExporting}
        isRefreshing={isRefetchingOverview}
      />

      {/* Error Alert */}
      {isOverviewError && (
        <div className="p-4 rounded-xl bg-status-cancelled/10 border border-status-cancelled/30 text-status-cancelled text-xs">
          Có lỗi khi tải dữ liệu báo cáo vận hành: {getApiErrorMessage(overviewError)}
        </div>
      )}

      {/* KPI Summary Cards */}
      <OperationsSummaryCards overview={overview} isLoading={isLoadingOverview} />

      {/* Detailed Operational Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Order Fulfillment Breakdown */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <OrderFulfillmentAnalysis overview={overview} isLoading={isLoadingOverview} />
        </div>

        {/* Right Column: Capacity & Inventory Health */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <OperationsCapacityCard overview={overview} isLoading={isLoadingOverview} />
        </div>
      </div>

      {/* Operational Guidelines & Benchmarks */}
      <Card className="shadow-xs border border-border text-left">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-text">Chuẩn mực Đánh giá Vận hành</CardTitle>
              <p className="text-[11px] text-muted">Mục tiêu chất lượng dịch vụ và quy chuẩn vận hành nhà hàng</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-surface/30 border border-border/70 flex flex-col gap-1.5">
              <span className="font-bold text-text flex items-center gap-1.5 text-status-ready">
                <CheckCircle2 className="w-4 h-4" /> Tỷ lệ hoàn tất đơn: ≥ 95%
              </span>
              <p className="text-[11px] text-muted leading-relaxed">
                Đảm bảo bếp chế biến đúng hạn và quy trình phục vụ bàn diễn ra trơn tru, hạn chế tối đa việc khách hàng phải chờ lâu dẫn đến hủy món.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface/30 border border-border/70 flex flex-col gap-1.5">
              <span className="font-bold text-text flex items-center gap-1.5 text-status-cancelled">
                <ShieldAlert className="w-4 h-4" /> Tỷ lệ hủy đơn: ≤ 5%
              </span>
              <p className="text-[11px] text-muted leading-relaxed">
                Khi tỷ lệ hủy vượt quá 5%, quản trị viên cần kiểm tra xem nguyên nhân do lỗi đặt nhầm bàn, hết nguyên liệu đột xuất hay thời gian chờ vượt ngưỡng chịu đựng.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface/30 border border-border/70 flex flex-col gap-1.5">
              <span className="font-bold text-text flex items-center gap-1.5 text-secondary">
                <Sparkles className="w-4 h-4" /> Kiểm soát kho chủ động
              </span>
              <p className="text-[11px] text-muted leading-relaxed">
                Xử lý ngay các cảnh báo tồn kho tối thiểu để tránh tình trạng thực khách đặt món trên tablet nhưng bếp phải báo hết nguyên liệu.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
export default OperationsReportPage
