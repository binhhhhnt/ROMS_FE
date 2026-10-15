import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { reportApi } from '@/features/reports/api/reportApi'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { ReportNavTabs } from '@/features/reports/components/ReportNavTabs'
import { ReportFilterBar } from '@/features/reports/components/ReportFilterBar'
import { ProfitSummaryCards } from '@/features/reports/components/ProfitSummaryCards'
import { ProfitComparisonChart } from '@/features/reports/components/ProfitComparisonChart'
import { ProfitBreakdownTable } from '@/features/reports/components/ProfitBreakdownTable'

export function ProfitReportPage() {
  const queryClient = useQueryClient()

  // Default: 30 days
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
    toast.info('Đã làm mới dữ liệu báo cáo lợi nhuận')
  }

  // Export CSV
  const handleExportCsv = async () => {
    setIsExporting(true)
    try {
      const blob = await reportApi.exportReportCsv(dates.startDate, dates.endDate)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `bao-cao-loi-nhuan-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Xuất file báo cáo chi phí & lợi nhuận CSV thành công!')
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
          Báo cáo Chi phí & Lợi nhuận
        </h1>
        <p className="text-xs text-muted mt-1">
          Đối chiếu tổng thu, chi phí vận hành, nhập hàng và tỷ suất lợi nhuận ròng của nhà hàng.
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
        isRefreshing={isRefetchingTrends}
      />

      {/* Error alert */}
      {isTrendsError && (
        <div className="p-4 rounded-xl bg-status-cancelled/10 border border-status-cancelled/30 text-status-cancelled text-xs">
          Có lỗi khi tải dữ liệu báo cáo lợi nhuận: {getApiErrorMessage(trendsError)}
        </div>
      )}

      {/* KPI Summary Cards */}
      <ProfitSummaryCards
        overview={overview}
        isLoading={isLoadingOverview || isLoadingTrends}
      />

      {/* Multi-view Comparison Chart */}
      <ProfitComparisonChart
        trends={trends}
        isLoading={isLoadingTrends}
      />

      {/* Detailed P&L Ledger Table */}
      <ProfitBreakdownTable
        trends={trends}
        isLoading={isLoadingTrends}
      />
    </div>
  )
}
export default ProfitReportPage
