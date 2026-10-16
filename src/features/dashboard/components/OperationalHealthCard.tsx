import { Activity, CheckCircle2, XCircle, Users, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card'
import type { DashboardOverviewResponse } from '@/features/dashboard/types/dashboard.types'

interface OperationalHealthCardProps {
  overview?: DashboardOverviewResponse
  isLoading?: boolean
}

export function OperationalHealthCard({ overview, isLoading = false }: OperationalHealthCardProps) {
  const completed = overview?.completedOrdersCount || 0
  const cancelled = overview?.cancelledOrdersCount || 0
  const activeSessions = overview?.activeSessionsCount || 0
  const lowStockCount = overview?.lowStockIngredientsCount || 0

  const totalOrders = completed + cancelled
  const completionRate = totalOrders > 0 ? Math.round((completed / totalOrders) * 100) : 100

  return (
    <Card className="shadow-xs border border-border text-left flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-text">Sức khỏe Vận hành</CardTitle>
            <p className="text-xs text-muted">Hiệu suất phục vụ & cảnh báo thời gian thực</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 flex-1 flex flex-col justify-between gap-4">
        {isLoading ? (
          <div className="flex flex-col gap-3 animate-pulse">
            <div className="h-14 bg-muted-bg/50 rounded-lg" />
            <div className="h-14 bg-muted-bg/50 rounded-lg" />
          </div>
        ) : (
          <>
            {/* Completion rate bar */}
            <div className="bg-surface/30 border border-border/60 rounded-xl p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-text">Tỷ lệ hoàn thành đơn hàng:</span>
                <span className={`font-bold font-mono text-sm ${completionRate >= 90 ? 'text-status-ready' : 'text-status-pending'}`}>
                  {completionRate}%
                </span>
              </div>
              <div className="w-full bg-muted-bg h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    completionRate >= 90 ? 'bg-status-ready' : 'bg-status-pending'
                  }`}
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted pt-1">
                <span className="flex items-center gap-1 text-status-ready">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {completed} đơn hoàn thành
                </span>
                <span className="flex items-center gap-1 text-status-cancelled">
                  <XCircle className="w-3.5 h-3.5" /> {cancelled} đơn hủy
                </span>
              </div>
            </div>

            {/* Realtime stats grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Active Sessions */}
              <div className="bg-card border border-border rounded-xl p-3 flex flex-col justify-between hover:bg-surface/20 transition-colors">
                <div className="flex items-center justify-between text-muted">
                  <span className="text-[11px] font-medium">Bàn đang phục vụ</span>
                  <Users className="w-4 h-4 text-accent" />
                </div>
                <div className="text-xl font-bold font-mono text-primary mt-2">
                  {activeSessions} <span className="text-[11px] font-normal text-muted">bàn</span>
                </div>
              </div>

              {/* Low Stock Alert */}
              <div className={`border rounded-xl p-3 flex flex-col justify-between transition-colors ${
                lowStockCount > 0
                  ? 'bg-status-pending/10 border-status-pending/30 text-status-pending'
                  : 'bg-card border-border text-muted'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium">Cảnh báo tồn kho</span>
                  <AlertTriangle className={`w-4 h-4 ${lowStockCount > 0 ? 'text-status-pending' : 'text-muted'}`} />
                </div>
                <div className="text-xl font-bold font-mono mt-2 text-text">
                  {lowStockCount} <span className="text-[11px] font-normal text-muted">nguyên liệu</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
