import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Receipt,
  ClipboardList,
  CookingPot,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { dashboardApi } from '@/features/dashboard/api/dashboardApi'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { MetricCard } from '@/features/dashboard/components/MetricCard'
import { DashboardDateFilter } from '@/features/dashboard/components/DashboardDateFilter'
import { RevenueExpenseChart } from '@/features/dashboard/components/RevenueExpenseChart'
import { BestSellingDishesCard } from '@/features/dashboard/components/BestSellingDishesCard'
import { OperationalHealthCard } from '@/features/dashboard/components/OperationalHealthCard'
import { Card } from '@/shared/components/ui/card'

export function OwnerDashboardPage() {
  const queryClient = useQueryClient()

  // Default date range: 30 days ago to today
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

  // 1. Query: Overview KPIs
  const {
    data: overview,
    isLoading: isLoadingOverview,
    isRefetching: isRefetchingOverview,
    isError: isOverviewError,
    error: overviewError,
  } = useQuery({
    queryKey: ['dashboard', 'overview', dates.startDate, dates.endDate],
    queryFn: () => dashboardApi.getOverview(dates.startDate, dates.endDate),
  })

  // 2. Query: Best-selling dishes
  const {
    data: bestSelling = [],
    isLoading: isLoadingBestSelling,
  } = useQuery({
    queryKey: ['dashboard', 'best-selling', dates.startDate, dates.endDate],
    queryFn: () => dashboardApi.getBestSellingDishes(dates.startDate, dates.endDate, 5),
  })

  // 3. Query: Daily trends
  const {
    data: trends = [],
    isLoading: isLoadingTrends,
  } = useQuery({
    queryKey: ['dashboard', 'trends', dates.startDate, dates.endDate],
    queryFn: () => dashboardApi.getDailyTrends(dates.startDate, dates.endDate),
  })

  // Refresh all dashboard queries
  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    toast.info('Đã làm mới số liệu Dashboard')
  }

  // Export CSV
  const handleExportCsv = async () => {
    setIsExporting(true)
    try {
      const blob = await dashboardApi.exportDailyReport(dates.startDate, dates.endDate)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `daily-financial-report-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Xuất file báo cáo tài chính CSV thành công!')
    } catch (err) {
      toast.error('Có lỗi khi tải file báo cáo: ' + getApiErrorMessage(err))
    } finally {
      setIsExporting(false)
    }
  }

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num || 0)
  }

  return (
    <div className="flex flex-col gap-6 text-left max-w-7xl mx-auto">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-text tracking-tight">
              Tổng quan Hoạt động Nhà hàng
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" /> Quản trị viên
            </span>
          </div>
          <p className="text-xs text-muted">
            Theo dõi bức tranh tài chính, doanh thu bán hàng và hiệu suất phục vụ theo thời gian thực.
          </p>
        </div>
      </div>

      {/* Date Filter & Actions Toolbar */}
      <DashboardDateFilter
        startDate={dates.startDate}
        endDate={dates.endDate}
        onDateChange={(start, end) => setDates({ startDate: start, endDate: end })}
        onRefresh={handleRefresh}
        onExportCsv={handleExportCsv}
        isExporting={isExporting}
        isRefreshing={isRefetchingOverview}
      />

      {/* Error alert if any */}
      {isOverviewError && (
        <div className="p-4 rounded-xl bg-status-cancelled/10 border border-status-cancelled/30 text-status-cancelled text-xs">
          Có lỗi khi tải dữ liệu tổng quan: {getApiErrorMessage(overviewError)}
        </div>
      )}

      {/* Key Financial Metrics (4 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <MetricCard
          title="TỔNG DOANH THU ĐƠN HÀNG"
          value={isLoadingOverview ? '...' : formatVND(overview?.totalRevenue || 0)}
          icon={<DollarSign className="w-5 h-5" />}
          variant="accent"
          subtext="Doanh thu ghi nhận từ các đơn hoàn thành"
          badgeText="Doanh thu"
          badgeVariant="neutral"
        />

        {/* Net Profit */}
        <MetricCard
          title="LỢI NHUẬN RÒNG ƯỚC TÍNH"
          value={isLoadingOverview ? '...' : formatVND(overview?.netProfit || 0)}
          icon={
            (overview?.netProfit || 0) >= 0 ? (
              <TrendingUp className="w-5 h-5 text-status-ready" />
            ) : (
              <TrendingDown className="w-5 h-5 text-status-cancelled" />
            )
          }
          variant={(overview?.netProfit || 0) >= 0 ? 'success' : 'danger'}
          subtext="Doanh thu - Chi phí - Nhập hàng"
          badgeText={(overview?.netProfit || 0) >= 0 ? 'Có lãi' : 'Lỗ'}
          badgeVariant={(overview?.netProfit || 0) >= 0 ? 'success' : 'danger'}
        />

        {/* Total Expenses */}
        <MetricCard
          title="CHI PHÍ VẬN HÀNH"
          value={isLoadingOverview ? '...' : formatVND(overview?.totalExpenses || 0)}
          icon={<Receipt className="w-5 h-5" />}
          variant="danger"
          subtext="Các khoản chi hoạt động ngoài kho"
          badgeText="Chi phí"
          badgeVariant="danger"
        />

        {/* Total Purchases */}
        <MetricCard
          title="CHI PHÍ NHẬP HÀNG"
          value={isLoadingOverview ? '...' : formatVND(overview?.totalPurchases || 0)}
          icon={<ShoppingCart className="w-5 h-5" />}
          variant="warning"
          subtext="Tổng tiền mua nguyên liệu trong kỳ"
          badgeText="Nhập hàng"
          badgeVariant="warning"
        />
      </div>

      {/* Charts & Top Selling Dishes Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Financial Trends Chart (2 columns) */}
        <div className="lg:col-span-2">
          <RevenueExpenseChart trends={trends} isLoading={isLoadingTrends} />
        </div>

        {/* Right: Best Selling Dishes (1 column) */}
        <div className="lg:col-span-1">
          <BestSellingDishesCard dishes={bestSelling} isLoading={isLoadingBestSelling} />
        </div>
      </div>

      {/* Operational Health & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Operational Health Card (2 columns) */}
        <div className="lg:col-span-2">
          <OperationalHealthCard overview={overview} isLoading={isLoadingOverview} />
        </div>

        {/* Right: Quick Shortcuts Card (1 column) */}
        <Card className="lg:col-span-1 p-5 shadow-xs border border-border flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-text">Lối tắt Quản lý nhanh</h3>
            <p className="text-xs text-muted mt-1">Truy cập tức thì các phân hệ vận hành chính</p>

            <div className="flex flex-col gap-2 mt-4 text-xs font-semibold">
              <Link
                to="/owner/expenses"
                className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-surface/50 text-text transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-status-cancelled/15 text-status-cancelled flex items-center justify-center">
                    <Receipt className="w-3.5 h-3.5" />
                  </div>
                  <span>Quản lý Chi phí</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted" />
              </Link>

              <Link
                to="/staff/orders"
                className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-surface/50 text-text transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-accent/15 text-accent flex items-center justify-center">
                    <ClipboardList className="w-3.5 h-3.5" />
                  </div>
                  <span>Theo dõi Danh sách Order</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted" />
              </Link>

              <Link
                to="/kitchen/queue"
                className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-surface/50 text-text transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-status-cooking/15 text-status-cooking flex items-center justify-center">
                    <CookingPot className="w-3.5 h-3.5" />
                  </div>
                  <span>Màn hình Bếp (KDS)</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted" />
              </Link>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 text-[11px] text-muted leading-relaxed">
            Hệ thống tự động đồng bộ số liệu qua REST API khi có đơn hàng hoặc chi phí mới.
          </div>
        </Card>
      </div>
    </div>
  )
}
export default OwnerDashboardPage
