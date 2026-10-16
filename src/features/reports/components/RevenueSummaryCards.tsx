import { useMemo } from 'react'
import { DollarSign, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react'
import { Card } from '@/shared/components/ui/card'
import type { DailyRevenueExpenseResponse, DashboardOverviewResponse } from '@/features/dashboard/types/dashboard.types'

interface RevenueSummaryCardsProps {
  trends: DailyRevenueExpenseResponse[]
  overview?: DashboardOverviewResponse
  isLoading?: boolean
}

export function RevenueSummaryCards({ trends, overview, isLoading = false }: RevenueSummaryCardsProps) {
  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num || 0)
  }

  const summary = useMemo(() => {
    const totalRev = overview?.totalRevenue ?? trends.reduce((sum, t) => sum + t.revenue, 0)
    const days = Math.max(1, trends.length)
    const avgDaily = Math.round(totalRev / days)

    let maxRev = 0
    let maxDate: string | null = null

    trends.forEach((t) => {
      if (t.revenue > maxRev) {
        maxRev = t.revenue
        maxDate = t.date
      }
    })

    return {
      totalRevenue: totalRev,
      averageDailyRevenue: avgDaily,
      highestRevenueDate: maxDate,
      highestRevenueAmount: maxRev,
      completedOrdersCount: overview?.completedOrdersCount ?? 0,
      totalDays: days,
    }
  }, [trends, overview])

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    try {
      const parts = dateStr.split('-')
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`
      }
      return dateStr
    } catch {
      return dateStr
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
      {/* 1. Tổng doanh thu */}
      <Card className="p-4 shadow-xs border border-border flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs text-muted font-medium">TỔNG DOANH THU</span>
            <div className="text-2xl font-black font-mono text-primary mt-1">
              {isLoading ? '...' : formatVND(summary.totalRevenue)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-border/60 text-[11px] text-muted">
          Tổng giá trị các món ăn trong đơn hoàn thành
        </div>
      </Card>

      {/* 2. Trung bình mỗi ngày */}
      <Card className="p-4 shadow-xs border border-border flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs text-muted font-medium">TRUNG BÌNH / NGÀY</span>
            <div className="text-2xl font-black font-mono text-accent mt-1">
              {isLoading ? '...' : formatVND(summary.averageDailyRevenue)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-border/60 text-[11px] text-muted">
          Tính trên {summary.totalDays} ngày trong kỳ lọc
        </div>
      </Card>

      {/* 3. Ngày doanh thu cao nhất */}
      <Card className="p-4 shadow-xs border border-border flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs text-muted font-medium">DOANH THU ĐỈNH ĐIỂM</span>
            <div className="text-2xl font-black font-mono text-status-ready mt-1">
              {isLoading ? '...' : formatVND(summary.highestRevenueAmount)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-status-ready/15 text-status-ready flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-border/60 text-[11px] text-muted">
          {summary.highestRevenueDate ? `Đạt đỉnh vào ngày ${formatDate(summary.highestRevenueDate)}` : 'Chưa có ngày đạt đỉnh'}
        </div>
      </Card>

      {/* 4. Tổng số đơn hoàn thành */}
      <Card className="p-4 shadow-xs border border-border flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs text-muted font-medium">ĐƠN HÀNG HOÀN THÀNH</span>
            <div className="text-2xl font-black font-mono text-text mt-1">
              {isLoading ? '...' : summary.completedOrdersCount} <span className="text-xs font-normal text-muted">đơn</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-surface text-accent flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-border/60 text-[11px] text-muted">
          Đơn đã phục vụ và đóng phiên thành công
        </div>
      </Card>
    </div>
  )
}
