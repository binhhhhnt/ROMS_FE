import { useMemo } from 'react'
import { CheckCircle2, XCircle, Info, ShieldAlert, Sparkles } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card'
import type { DashboardOverviewResponse } from '@/features/dashboard/types/dashboard.types'

interface OrderFulfillmentAnalysisProps {
  overview?: DashboardOverviewResponse
  isLoading?: boolean
}

export function OrderFulfillmentAnalysis({ overview, isLoading = false }: OrderFulfillmentAnalysisProps) {
  const data = useMemo(() => {
    const completed = overview?.completedOrdersCount || 0
    const cancelled = overview?.cancelledOrdersCount || 0
    const total = completed + cancelled
    const completedPct = total > 0 ? (completed / total) * 100 : 100
    const cancelledPct = total > 0 ? (cancelled / total) * 100 : 0

    return {
      completed,
      cancelled,
      total,
      completedPct,
      cancelledPct,
    }
  }, [overview])

  return (
    <Card className="shadow-xs border border-border text-left">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50">
        <div>
          <CardTitle className="text-base font-bold text-text">Phân tích Năng lực Xử lý Đơn hàng</CardTitle>
          <p className="text-xs text-muted mt-0.5">
            Đánh giá chất lượng hoàn tất đơn và tỷ trọng đơn hàng bị hủy bỏ trong kỳ.
          </p>
        </div>
      </CardHeader>

      <CardContent className="pt-4 flex flex-col gap-5">
        {isLoading ? (
          <div className="h-44 animate-pulse flex flex-col gap-3">
            <div className="h-8 bg-muted-bg/50 rounded-lg" />
            <div className="h-16 bg-muted-bg/30 rounded-lg" />
          </div>
        ) : (
          <>
            {/* Visual Stacked Progress Bar */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-status-ready">
                  <CheckCircle2 className="w-4 h-4" /> Đơn hoàn thành ({data.completedPct.toFixed(1)}%)
                </span>
                <span className="flex items-center gap-1.5 text-status-cancelled">
                  <XCircle className="w-4 h-4" /> Đơn bị hủy ({data.cancelledPct.toFixed(1)}%)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-4 bg-muted-bg rounded-full overflow-hidden flex shadow-inner">
                <div
                  className="bg-status-ready h-full transition-all duration-500"
                  style={{ width: `${data.completedPct}%` }}
                  title={`Hoàn thành: ${data.completed} đơn (${data.completedPct.toFixed(1)}%)`}
                />
                <div
                  className="bg-status-cancelled h-full transition-all duration-500"
                  style={{ width: `${data.cancelledPct}%` }}
                  title={`Bị hủy: ${data.cancelled} đơn (${data.cancelledPct.toFixed(1)}%)`}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted">
                <span>{data.completed} đơn phục vụ thành công</span>
                <span>{data.cancelled} đơn bị hủy tại bàn</span>
              </div>
            </div>

            {/* Breakdown Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-surface/30 border border-border/70 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-muted text-[11px]">Tổng đơn phát sinh</span>
                <div className="text-xl font-bold font-mono text-primary mt-1">
                  {data.total} <span className="text-xs font-normal text-muted">đơn</span>
                </div>
              </div>

              <div className="bg-status-ready/10 border border-status-ready/30 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-status-ready text-[11px] font-medium">Hoàn tất phục vụ</span>
                <div className="text-xl font-bold font-mono text-status-ready mt-1">
                  {data.completed} <span className="text-xs font-normal text-muted">đơn</span>
                </div>
              </div>

              <div className="bg-status-cancelled/10 border border-status-cancelled/30 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-status-cancelled text-[11px] font-medium">Bị hủy tại bàn</span>
                <div className="text-xl font-bold font-mono text-status-cancelled mt-1">
                  {data.cancelled} <span className="text-xs font-normal text-muted">đơn</span>
                </div>
              </div>
            </div>

            {/* Operational Insight Banner */}
            <div className="bg-muted-bg/50 border border-border rounded-xl p-3.5 text-xs flex items-start gap-3">
              {data.cancelledPct > 10 ? (
                <>
                  <ShieldAlert className="w-5 h-5 text-status-cancelled shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1 text-text">
                    <span className="font-bold text-status-cancelled">Khuyến nghị cải thiện:</span>
                    <p className="text-muted leading-relaxed text-[11px]">
                      Tỷ lệ đơn bị hủy đang ở mức <strong className="text-status-cancelled">{data.cancelledPct.toFixed(1)}%</strong>. Quản lý nên kiểm tra lại tốc độ tiếp nhận đơn tại bếp (KDS) và khảo sát xem khách hủy đơn có phải do thời gian chờ đợi quá lâu hay không.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-status-ready shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1 text-text">
                    <span className="font-bold text-status-ready">Hiệu suất vận hành tốt:</span>
                    <p className="text-muted leading-relaxed text-[11px]">
                      Tỷ lệ hoàn tất đơn đạt <strong className="text-status-ready">{data.completedPct.toFixed(1)}%</strong>. Quy trình từ tablet khách đến nhà bếp và phục vụ món tại bàn đang diễn ra trơn tru.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Notice regarding cancellation rule */}
            <div className="text-[11px] text-muted flex items-center gap-1.5 border-t border-border/50 pt-2">
              <Info className="w-3.5 h-3.5 text-accent shrink-0" />
              <span>
                Quy tắc nghiệp vụ: Chỉ tài khoản bàn (<code className="bg-surface px-1 py-0.5 rounded text-primary">TABLE_ACCOUNT</code>) mới được hủy khi đơn còn ở trạng thái Chờ tiếp nhận (<code className="bg-surface px-1 py-0.5 rounded text-primary">PENDING</code>).
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
