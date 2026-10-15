import { useMemo } from 'react'
import { CheckCircle2, XCircle, Users, AlertTriangle } from 'lucide-react'
import { Card } from '@/shared/components/ui/card'
import type { DashboardOverviewResponse } from '@/features/dashboard/types/dashboard.types'

interface OperationsSummaryCardsProps {
  overview?: DashboardOverviewResponse
  isLoading?: boolean
}

export function OperationsSummaryCards({ overview, isLoading = false }: OperationsSummaryCardsProps) {
  const stats = useMemo(() => {
    const completed = overview?.completedOrdersCount || 0
    const cancelled = overview?.cancelledOrdersCount || 0
    const activeSessions = overview?.activeSessionsCount || 0
    const lowStock = overview?.lowStockIngredientsCount || 0
    const totalOrders = completed + cancelled
    const fulfillmentRate = totalOrders > 0 ? (completed / totalOrders) * 100 : 100
    const cancelRate = totalOrders > 0 ? (cancelled / totalOrders) * 100 : 0

    return {
      completed,
      cancelled,
      totalOrders,
      fulfillmentRate,
      cancelRate,
      activeSessions,
      lowStock,
    }
  }, [overview])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
      {/* 1. Tỷ lệ hoàn thành đơn */}
      <Card className="p-4 shadow-xs border border-border flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs text-muted font-medium">TỶ LỆ HOÀN THÀNH ĐƠN</span>
            <div className={`text-2xl font-black font-mono mt-1 ${
              stats.fulfillmentRate >= 90 ? 'text-status-ready' : stats.fulfillmentRate >= 80 ? 'text-status-pending' : 'text-status-cancelled'
            }`}>
              {isLoading ? '...' : `${stats.fulfillmentRate.toFixed(1)}%`}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-status-ready/15 text-status-ready flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-border/60 text-[11px] text-muted flex items-center justify-between">
          <span>{stats.completed} / {stats.totalOrders} đơn thành công</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            stats.fulfillmentRate >= 90 ? 'bg-status-ready/20 text-status-ready' : 'bg-status-pending/20 text-status-pending'
          }`}>
            {stats.fulfillmentRate >= 90 ? 'Xuất sắc' : 'Khá'}
          </span>
        </div>
      </Card>

      {/* 2. Tỷ lệ hủy đơn */}
      <Card className="p-4 shadow-xs border border-border flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs text-muted font-medium">TỶ LỆ HỦY ĐƠN</span>
            <div className={`text-2xl font-black font-mono mt-1 ${
              stats.cancelRate <= 5 ? 'text-status-ready' : stats.cancelRate <= 15 ? 'text-status-pending' : 'text-status-cancelled'
            }`}>
              {isLoading ? '...' : `${stats.cancelRate.toFixed(1)}%`}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-status-cancelled/15 text-status-cancelled flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-border/60 text-[11px] text-muted flex items-center justify-between">
          <span>{stats.cancelled} đơn đã bị hủy bỏ</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            stats.cancelRate <= 5 ? 'bg-status-ready/20 text-status-ready' : 'bg-status-cancelled/20 text-status-cancelled'
          }`}>
            {stats.cancelRate <= 5 ? 'Ổn định' : 'Cần chú ý'}
          </span>
        </div>
      </Card>

      {/* 3. Bàn đang phục vụ */}
      <Card className="p-4 shadow-xs border border-border flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs text-muted font-medium">BÀN ĐANG PHỤC VỤ</span>
            <div className="text-2xl font-black font-mono text-primary mt-1">
              {isLoading ? '...' : stats.activeSessions} <span className="text-xs font-normal text-muted">bàn</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-border/60 text-[11px] text-muted">
          Số phiên phục vụ đang mở tại nhà hàng
        </div>
      </Card>

      {/* 4. Cảnh báo tồn kho */}
      <Card className="p-4 shadow-xs border border-border flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs text-muted font-medium">NGUYÊN LIỆU THIẾU HỤT</span>
            <div className={`text-2xl font-black font-mono mt-1 ${
              stats.lowStock > 0 ? 'text-status-pending' : 'text-status-ready'
            }`}>
              {isLoading ? '...' : stats.lowStock} <span className="text-xs font-normal text-muted">mục</span>
            </div>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            stats.lowStock > 0 ? 'bg-status-pending/15 text-status-pending' : 'bg-status-ready/15 text-status-ready'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-border/60 text-[11px] text-muted">
          {stats.lowStock > 0 ? 'Dưới ngưỡng tồn kho tối thiểu' : 'Tồn kho ở mức an toàn'}
        </div>
      </Card>
    </div>
  )
}
