import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { reportApi } from '@/features/reports/api/reportApi'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { ReportNavTabs } from '@/features/reports/components/ReportNavTabs'
import { ReportFilterBar } from '@/features/reports/components/ReportFilterBar'
import { RevenueSummaryCards } from '@/features/reports/components/RevenueSummaryCards'
import { RevenueBarChart } from '@/features/reports/components/RevenueBarChart'
import { RevenueBreakdownTable } from '@/features/reports/components/RevenueBreakdownTable'

export function RevenueReportPage() {
  const queryClient = useQueryClient()

  // Date range default: 30 days ago to today
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

  // 1. Query: Daily trends
  const {
    data: trends = [],
    isLoading: isLoadingTrends,
    isRefetching: isRefetchingTrends,
    isError: isTrendsError,
    error: trendsError,
  } = useQuery({
    queryKey: ['reports', 'trends', dates.startDate, dates.endDate],
    queryFn: () => reportApi.getDailyTrends(dates.startDate, dates.endDate),
  })

  // 2. Query: Overview totals
  const {
    data: overview,
    isLoading: isLoadingOverview,
  } = useQuery({
    queryKey: ['reports', 'overview', dates.startDate, dates.endDate],
    queryFn: () => reportApi.getOverview(dates.startDate, dates.endDate),
  })

  // Refresh
  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['reports'] })
    toast.info('Đã làm mới dữ liệu báo cáo')
  }

  // Export CSV (Task FE-045)
  const handleExportCsv = async () => {
    setIsExporting(true)
    try {
      const blob = await reportApi.exportReportCsv(dates.startDate, dates.endDate)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `bao-cao-doanh-thu-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Xuất file báo cáo doanh thu CSV thành công!')
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
          Báo cáo & Phân tích Hoạt động
        </h1>
        <p className="text-xs text-muted mt-1">
          Báo cáo chuyên sâu về doanh thu, món ăn bán chạy, dòng tiền chi phí và hiệu suất vận hành.
        </p>
      </div>

      {/* Navigation Tabs between reports */}
      <ReportNavTabs />

      {/* Date Filter & Export Action Toolbar (FE-045) */}
      <ReportFilterBar
        startDate={dates.startDate}
        endDate={dates.endDate}
        onDateChange={(start, end) => setDates({ startDate: start, endDate: end })}
        onRefresh={handleRefresh}
        onExportCsv={handleExportCsv}
        isExporting={isExporting}
        isRefreshing={isRefetchingTrends}
      />

      {/* Error alert */}
      {isTrendsError && (
        <div className="p-4 rounded-xl bg-status-cancelled/10 border border-status-cancelled/30 text-status-cancelled text-xs">
          Có lỗi khi tải dữ liệu báo cáo doanh thu: {getApiErrorMessage(trendsError)}
        </div>
      )}

      {/* Summary KPI Cards */}
      <RevenueSummaryCards
        trends={trends}
        overview={overview}
        isLoading={isLoadingTrends || isLoadingOverview}
      />

      {/* Visual Revenue Bar Chart */}
      <RevenueBarChart
        trends={trends}
        isLoading={isLoadingTrends}
      />

      {/* Detailed Revenue Breakdown Table */}
      <RevenueBreakdownTable
        trends={trends}
        isLoading={isLoadingTrends}
      />
    </div>
  )
}
export default RevenueReportPage
