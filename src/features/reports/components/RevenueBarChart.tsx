import { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card'
import type { DailyRevenueExpenseResponse } from '@/features/dashboard/types/dashboard.types'

interface RevenueBarChartProps {
  trends: DailyRevenueExpenseResponse[]
  isLoading?: boolean
}

export function RevenueBarChart({ trends, isLoading = false }: RevenueBarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num)
  }

  const formatCompactVND = (num: number) => {
    if (Math.abs(num) >= 1_000_000_000) {
      return `${(num / 1_000_000_000).toFixed(1)} tỷ`
    }
    if (Math.abs(num) >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(1)} tr`
    }
    if (Math.abs(num) >= 1_000) {
      return `${(num / 1_000).toFixed(0)} k`
    }
    return `${num}`
  }

  const formatDateLabel = (dateStr: string) => {
    try {
      const parts = dateStr.split('-')
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}`
      }
      return dateStr
    } catch {
      return dateStr
    }
  }

  // Calculate layout and coordinates
  const chartData = useMemo(() => {
    if (!trends || trends.length === 0) return null

    let maxRev = 0
    let total = 0
    trends.forEach((t) => {
      maxRev = Math.max(maxRev, t.revenue)
      total += t.revenue
    })

    const avg = trends.length > 0 ? total / trends.length : 0

    if (maxRev === 0) maxRev = 100_000
    // 15% headroom
    maxRev = maxRev * 1.15

    const width = 800
    const height = 280
    const padding = { top: 25, right: 20, bottom: 40, left: 60 }
    const chartW = width - padding.left - padding.right
    const chartH = height - padding.top - padding.bottom

    const slotWidth = chartW / trends.length
    const barWidth = Math.min(Math.max(slotWidth * 0.65, 8), 36)

    const getY = (val: number) => {
      const normalized = Math.max(0, val) / maxRev
      return padding.top + chartH - normalized * chartH
    }

    const avgY = getY(avg)

    // Y Axis ticks (4 intervals)
    const yTicks = [
      maxRev,
      maxRev * 0.75,
      maxRev * 0.5,
      maxRev * 0.25,
      0,
    ]

    return {
      width,
      height,
      padding,
      chartW,
      chartH,
      slotWidth,
      barWidth,
      maxRev,
      avg,
      avgY,
      yTicks,
      getY,
    }
  }, [trends])

  const activeHoveredItem = hoveredIndex !== null && trends[hoveredIndex] ? trends[hoveredIndex] : null

  return (
    <Card className="shadow-xs border border-border text-left">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-border/50 gap-2">
        <div>
          <CardTitle className="text-base font-bold text-text">Biểu đồ Doanh thu theo ngày</CardTitle>
          <p className="text-xs text-muted mt-0.5">
            Biến động doanh thu ghi nhận từ các đơn hàng hoàn thành trong kỳ.
          </p>
        </div>

        {/* Reference legend */}
        {chartData && (
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-text">
              <span className="w-3 h-3 rounded-sm bg-[#3D92CB]" />
              <span>Doanh thu ngày</span>
            </div>
            <div className="flex items-center gap-1.5 text-text">
              <span className="w-4 h-0.5 border-b-2 border-dashed border-[#F59E0B]" />
              <span className="text-muted">Trung bình ({formatCompactVND(chartData.avg)})</span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-4">
        {isLoading && (
          <div className="h-64 flex items-center justify-center animate-pulse bg-muted-bg/30 rounded-xl">
            <span className="text-xs text-muted">Đang tải biểu đồ doanh thu...</span>
          </div>
        )}

        {!isLoading && (!trends || trends.length === 0) && (
          <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border rounded-xl text-center p-6">
            <span className="text-sm font-semibold text-text">Chưa có số liệu doanh thu</span>
            <p className="text-xs text-muted max-w-sm mt-1">
              Hệ thống chưa ghi nhận doanh thu nào trong khoảng thời gian được chọn.
            </p>
          </div>
        )}

        {!isLoading && chartData && (
          <div className="relative w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${chartData.width} ${chartData.height}`}
              className="w-full h-auto overflow-visible select-none"
            >
              {/* Y Axis Grid Lines & Labels */}
              {chartData.yTicks.map((tick, i) => {
                const y = chartData.getY(tick)
                return (
                  <g key={i}>
                    <line
                      x1={chartData.padding.left}
                      y1={y}
                      x2={chartData.width - chartData.padding.right}
                      y2={y}
                      stroke="currentColor"
                      className="text-border/60"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={chartData.padding.left - 8}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-muted text-[10px] font-mono"
                    >
                      {formatCompactVND(tick)}
                    </text>
                  </g>
                )
              })}

              {/* Zero baseline */}
              <line
                x1={chartData.padding.left}
                y1={chartData.padding.top + chartData.chartH}
                x2={chartData.width - chartData.padding.right}
                y2={chartData.padding.top + chartData.chartH}
                stroke="currentColor"
                className="text-border"
                strokeWidth="1.5"
              />

              {/* Average reference line */}
              <line
                x1={chartData.padding.left}
                y1={chartData.avgY}
                x2={chartData.width - chartData.padding.right}
                y2={chartData.avgY}
                stroke="#F59E0B"
                strokeDasharray="5 4"
                strokeWidth="1.5"
                className="opacity-80"
              />

              {/* Bars */}
              {trends.map((t, idx) => {
                const centerX = chartData.padding.left + idx * chartData.slotWidth + chartData.slotWidth / 2
                const barX = centerX - chartData.barWidth / 2
                const barY = chartData.getY(t.revenue)
                const barH = chartData.padding.top + chartData.chartH - barY
                const isHovered = hoveredIndex === idx
                const isHighest = t.revenue > 0 && t.revenue === Math.max(...trends.map((item) => item.revenue))

                // X tick label conditions
                const showXTick =
                  trends.length <= 12 ||
                  idx === 0 ||
                  idx === trends.length - 1 ||
                  idx % Math.ceil(trends.length / 8) === 0

                return (
                  <g key={idx}>
                    {/* Bar */}
                    <rect
                      x={barX}
                      y={barY}
                      width={chartData.barWidth}
                      height={Math.max(barH, 2)}
                      rx="4"
                      className={`transition-all duration-150 cursor-pointer ${
                        isHovered
                          ? 'fill-[#1D3557]'
                          : isHighest
                          ? 'fill-[#3D92CB] stroke-amber-400 stroke-2'
                          : 'fill-[#3D92CB]/85 hover:fill-[#1D3557]'
                      }`}
                    />

                    {/* X Tick Label */}
                    {showXTick && (
                      <text
                        x={centerX}
                        y={chartData.height - 12}
                        textAnchor="middle"
                        className="fill-muted text-[10px] font-mono"
                      >
                        {formatDateLabel(t.date)}
                      </text>
                    )}

                    {/* Transparent hover capture zone */}
                    <rect
                      x={chartData.padding.left + idx * chartData.slotWidth}
                      y={chartData.padding.top}
                      width={chartData.slotWidth}
                      height={chartData.chartH}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  </g>
                )
              })}
            </svg>

            {/* Hover Tooltip Card */}
            {activeHoveredItem && hoveredIndex !== null && (
              <div
                className="absolute z-10 bg-card/95 backdrop-blur-xs border border-border rounded-xl p-3 shadow-xl pointer-events-none text-xs flex flex-col gap-1.5 transition-all duration-75"
                style={{
                  top: '10px',
                  left: `${Math.min(
                    Math.max(
                      chartData.padding.left + hoveredIndex * chartData.slotWidth - 70,
                      10
                    ),
                    chartData.width - 200
                  )}px`,
                }}
              >
                <div className="font-bold text-text pb-1 border-b border-border flex items-center justify-between gap-4">
                  <span>Ngày {activeHoveredItem.date}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">Doanh thu:</span>
                  <span className="font-bold font-mono text-[#3D92CB]">
                    {formatVND(activeHoveredItem.revenue)}
                  </span>
                </div>
                {chartData.avg > 0 && (
                  <div className="flex items-center justify-between gap-3 text-[11px]">
                    <span className="text-muted">So với trung bình:</span>
                    <span
                      className={`font-semibold font-mono ${
                        activeHoveredItem.revenue >= chartData.avg
                          ? 'text-status-ready'
                          : 'text-status-cancelled'
                      }`}
                    >
                      {activeHoveredItem.revenue >= chartData.avg ? '+' : ''}
                      {(
                        ((activeHoveredItem.revenue - chartData.avg) / chartData.avg) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
