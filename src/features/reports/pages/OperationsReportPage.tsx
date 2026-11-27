import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { reportApi } from '@/features/reports/api/reportApi'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { ReportNavTabs } from '@/features/reports/components/ReportNavTabs'
import { ReportFilterBar } from '@/features/reports/components/ReportFilterBar'
import { OperationsSummaryCards } from '@/features/reports/components/OperationsSummaryCards'
import { OrderFulfillmentAnalysis } from '@/features/reports/components/OrderFulfillmentAnalysis'
import { OperationsCapacityCard } from '@/features/reports/components/OperationsCapacityCard'

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
    </div>
  )
}
export default OperationsReportPage
