import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Trophy, ShoppingBag, DollarSign, Award } from 'lucide-react'
import { reportApi } from '@/features/reports/api/reportApi'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { ReportNavTabs } from '@/features/reports/components/ReportNavTabs'
import { ReportFilterBar } from '@/features/reports/components/ReportFilterBar'
import { PopularItemsBarChart } from '@/features/reports/components/PopularItemsBarChart'
import { PopularItemsTable } from '@/features/reports/components/PopularItemsTable'
import { Card } from '@/shared/components/ui/card'

export function PopularItemsReportPage() {
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

  const [limit, setLimit] = useState(20)
  const [isExporting, setIsExporting] = useState(false)

  // Query: Best selling dishes
  const {
    data: dishes = [],
    isLoading: isLoadingDishes,
    isRefetching: isRefetchingDishes,
    isError: isDishesError,
    error: dishesError,
  } = useQuery({
    queryKey: ['reports', 'best-selling', dates.startDate, dates.endDate, limit],
    queryFn: () => reportApi.getBestSellingDishes(dates.startDate, dates.endDate, limit),
  })

  // Refresh
  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['reports'] })
    toast.info('Đã làm mới dữ liệu món bán chạy')
  }

  // Export CSV
  const handleExportCsv = async () => {
    setIsExporting(true)
    try {
      const blob = await reportApi.exportReportCsv(dates.startDate, dates.endDate)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `bao-cao-mon-ban-chay-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Xuất file báo cáo món bán chạy CSV thành công!')
    } catch (err) {
      toast.error('Có lỗi khi xuất file: ' + getApiErrorMessage(err))
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

  // Quick stats calculation
  const stats = useMemo(() => {
    if (!dishes || dishes.length === 0) {
      return {
        topDishName: 'Chưa có',
        topDishQuantity: 0,
        topDishRevenue: 0,
        totalQuantity: 0,
        totalRevenue: 0,
        topDishShare: 0,
      }
    }

    const topDish = dishes[0]
    const totalQty = dishes.reduce((sum, d) => sum + d.quantitySold, 0)
    const totalRev = dishes.reduce((sum, d) => sum + d.totalRevenue, 0)
    const topShare = totalRev > 0 ? (topDish.totalRevenue / totalRev) * 100 : 0

    return {
      topDishName: topDish.menuItemName,
      topDishQuantity: topDish.quantitySold,
      topDishRevenue: topDish.totalRevenue,
      totalQuantity: totalQty,
      totalRevenue: totalRev,
      topDishShare: topShare,
    }
  }, [dishes])

  return (
    <div className="flex flex-col gap-6 text-left max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-text tracking-tight">
          Báo cáo Món ăn Bán chạy
        </h1>
        <p className="text-xs text-muted mt-1">
          Đánh giá sản lượng tiêu thụ, doanh thu đóng góp và tỷ trọng món ăn được yêu thích nhất.
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
        isRefreshing={isRefetchingDishes}
      />

      {/* Error alert */}
      {isDishesError && (
        <div className="p-4 rounded-xl bg-status-cancelled/10 border border-status-cancelled/30 text-status-cancelled text-xs">
          Có lỗi khi tải dữ liệu món bán chạy: {getApiErrorMessage(dishesError)}
        </div>
      )}

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
        {/* 1. Món dẫn đầu */}
        <Card className="p-4 shadow-xs border border-border flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="truncate max-w-[180px]">
              <span className="text-xs text-muted font-medium">MÓN DẪN ĐẦU #1</span>
              <div className="text-lg font-black text-text truncate mt-1" title={stats.topDishName}>
                {isLoadingDishes ? '...' : stats.topDishName}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-border/60 text-[11px] text-muted flex items-center justify-between">
            <span>Đã bán: <strong className="text-primary font-mono">{stats.topDishQuantity} phần</strong></span>
            <span className="font-mono text-accent">{formatVND(stats.topDishRevenue)}</span>
          </div>
        </Card>

        {/* 2. Tổng sản lượng bán */}
        <Card className="p-4 shadow-xs border border-border flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs text-muted font-medium">TỔNG SẢN LƯỢNG (TOP MÓN)</span>
              <div className="text-2xl font-black font-mono text-primary mt-1">
                {isLoadingDishes ? '...' : stats.totalQuantity} <span className="text-xs font-normal text-muted">phần</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-border/60 text-[11px] text-muted">
            Tổng số phần ăn đã phục vụ từ danh sách top món
          </div>
        </Card>

        {/* 3. Tổng doanh thu từ Top món */}
        <Card className="p-4 shadow-xs border border-border flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs text-muted font-medium">DOANH THU TỪ TOP MÓN</span>
              <div className="text-2xl font-black font-mono text-accent mt-1">
                {isLoadingDishes ? '...' : formatVND(stats.totalRevenue)}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-border/60 text-[11px] text-muted">
            Giá trị thu về từ các món có sức tiêu thụ cao nhất
          </div>
        </Card>

        {/* 4. Tỷ trọng món #1 */}
        <Card className="p-4 shadow-xs border border-border flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs text-muted font-medium">TỶ TRỌNG MÓN #1</span>
              <div className="text-2xl font-black font-mono text-status-ready mt-1">
                {isLoadingDishes ? '...' : `${stats.topDishShare.toFixed(1)}%`}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-status-ready/15 text-status-ready flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-border/60 text-[11px] text-muted">
            Mức độ đóng góp doanh thu của món Best Seller
          </div>
        </Card>
      </div>

      {/* Visual Chart */}
      <PopularItemsBarChart dishes={dishes} isLoading={isLoadingDishes} />

      {/* Full Detailed Ranking Table */}
      <PopularItemsTable
        dishes={dishes}
        isLoading={isLoadingDishes}
        limit={limit}
        onLimitChange={(newLimit) => setLimit(newLimit)}
      />
    </div>
  )
}
export default PopularItemsReportPage
