import { useMemo } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Receipt, ShoppingCart, Percent } from 'lucide-react'
import { Card } from '@/shared/components/ui/card'
import type { DashboardOverviewResponse } from '@/features/dashboard/types/dashboard.types'

interface ProfitSummaryCardsProps {
  overview?: DashboardOverviewResponse
  isLoading?: boolean
}

export function ProfitSummaryCards({ overview, isLoading = false }: ProfitSummaryCardsProps) {
  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num || 0)
  }

  const metrics = useMemo(() => {
    const rev = overview?.totalRevenue || 0
    const exp = overview?.totalExpenses || 0
    const pur = overview?.totalPurchases || 0
    const profit = overview?.netProfit ?? rev - exp - pur
    const totalOutflow = exp + pur
    const margin = rev > 0 ? (profit / rev) * 100 : 0

    return {
      revenue: rev,
      expenses: exp,
      purchases: pur,
      totalOutflow,
      profit,
      margin,
    }
  }, [overview])

  const isProfitable = metrics.profit >= 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
      {/* 1. Doanh thu */}
      <Card className="p-4 shadow-xs border border-border flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs text-muted font-medium">TỔNG DOANH THU</span>
            <div className="text-2xl font-black font-mono text-[#3D92CB] mt-1">
              {isLoading ? '...' : formatVND(metrics.revenue)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-border/60 text-[11px] text-muted">
          Tổng giá trị các món ăn từ đơn hoàn tất
        </div>
      </Card>

      {/* 2. Tổng chi phí (Vận hành + Nhập hàng) */}
      <Card className="p-4 shadow-xs border border-border flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs text-muted font-medium">TỔNG CHI PHÍ RA</span>
            <div className="text-2xl font-black font-mono text-status-cancelled mt-1">
              {isLoading ? '...' : formatVND(metrics.totalOutflow)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-status-cancelled/15 text-status-cancelled flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-border/60 text-[11px] text-muted flex items-center justify-between">
          <span className="flex items-center gap-1 text-[10px]">
            <Receipt className="w-3 h-3 text-status-cancelled" /> Chi phí: {formatVND(metrics.expenses)}
          </span>
          <span className="flex items-center gap-1 text-[10px]">
            <ShoppingCart className="w-3 h-3 text-amber-500" /> Nhập: {formatVND(metrics.purchases)}
          </span>
        </div>
      </Card>

      {/* 3. Lợi nhuận ròng */}
      <Card className="p-4 shadow-xs border border-border flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs text-muted font-medium">LỢI NHUẬN RÒNG</span>
            <div className={`text-2xl font-black font-mono mt-1 ${isProfitable ? 'text-status-ready' : 'text-status-cancelled'}`}>
              {isLoading ? '...' : formatVND(metrics.profit)}
            </div>
          </div>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isProfitable ? 'bg-status-ready/15 text-status-ready' : 'bg-status-cancelled/15 text-status-cancelled'
            }`}
          >
            {isProfitable ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-border/60 text-[11px] text-muted flex items-center justify-between">
          <span>{isProfitable ? 'Kinh doanh có lãi' : 'Đang trong tình trạng lỗ'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isProfitable ? 'bg-status-ready/20 text-status-ready' : 'bg-status-cancelled/20 text-status-cancelled'
          }`}>
            {isProfitable ? 'Dương' : 'Âm'}
          </span>
        </div>
      </Card>

      {/* 4. Tỷ suất lợi nhuận */}
      <Card className="p-4 shadow-xs border border-border flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs text-muted font-medium">TỶ SUẤT LỢI NHUẬN</span>
            <div className={`text-2xl font-black font-mono mt-1 ${isProfitable ? 'text-status-ready' : 'text-status-cancelled'}`}>
              {isLoading ? '...' : `${metrics.margin.toFixed(1)}%`}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-surface text-accent flex items-center justify-center shrink-0">
            <Percent className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-border/60 text-[11px] text-muted">
          Tỷ lệ Lợi nhuận ròng trên Doanh thu
        </div>
      </Card>
    </div>
  )
}
