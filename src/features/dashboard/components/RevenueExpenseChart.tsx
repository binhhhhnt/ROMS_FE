import { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card'
import type { DailyRevenueExpenseResponse } from '@/features/dashboard/types/dashboard.types'

interface RevenueExpenseChartProps {
  trends: DailyRevenueExpenseResponse[]
  isLoading?: boolean
}

type ViewMode = 'all' | 'revenue_profit' | 'revenue_expense'

export function RevenueExpenseChart({ trends, isLoading = false }: RevenueExpenseChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('all')
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

  // Calculate scales and coordinate points
  const chartData = useMemo(() => {
    if (!trends || trends.length === 0) return null

    // Determine max and min values for vertical scaling
    let max = 0
    let min = 0
    trends.forEach((t) => {
      max = Math.max(max, t.revenue, t.expenses, t.purchases, t.netProfit)
      min = Math.min(min, t.netProfit, 0)
    })

    if (max === 0) max = 100_000 // avoid div by zero
    // Add 15% headroom
    max = max * 1.15

    const range = max - min
    const width = 800
    const height = 260
    const padding = { top: 20, right: 20, bottom: 40, left: 60 }
    const chartW = width - padding.left - padding.right
    const chartH = height - padding.top - padding.bottom

    const getY = (val: number) => {
      const normalized = (val - min) / range
      return padding.top + chartH - normalized * chartH
    }

    const getX = (idx: number) => {
      if (trends.length <= 1) return padding.left + chartW / 2
      return padding.left + (idx / (trends.length - 1)) * chartW
    }

    // Build SVG path strings
    const makePath = (accessor: (t: DailyRevenueExpenseResponse) => number) => {
      return trends
        .map((t, idx) => {
          const x = getX(idx)
          const y = getY(accessor(t))
          return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
        })
        .join(' ')
    }

    const revenuePath = makePath((t) => t.revenue)
    const expensePath = makePath((t) => t.expenses)
    const purchasesPath = makePath((t) => t.purchases)
    const profitPath = makePath((t) => t.netProfit)

    // Baseline (Y=0)
    const zeroY = getY(0)

    // Y Axis ticks (4 intervals)
    const yTicks = [
      max,
      min + range * 0.75,
      min + range * 0.5,
      min + range * 0.25,
      min,
    ]

    return {
      width,
      height,
      padding,
      chartW,
      chartH,
      getY,
      getX,
      zeroY,
      yTicks,
      revenuePath,
      expensePath,
      purchasesPath,
      profitPath,
    }
  }, [trends])

  const activeHoveredItem = hoveredIndex !== null && trends[hoveredIndex] ? trends[hoveredIndex] : null

  return (
    <Card className="shadow-xs border border-border text-left">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-border/50 gap-3">
        <div>
          <CardTitle className="text-base font-bold text-text">Xu hướng Tài chính theo ngày</CardTitle>
          <p className="text-xs text-muted mt-0.5">
            Biểu đồ so sánh doanh thu đơn hàng, chi phí vận hành, nhập hàng và lợi nhuận ròng.
          </p>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-1 bg-surface/60 p-1 rounded-lg border border-border text-xs">
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
              viewMode === 'all' ? 'bg-card text-primary shadow-xs font-bold' : 'text-muted hover:text-text'
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setViewMode('revenue_profit')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
              viewMode === 'revenue_profit' ? 'bg-card text-primary shadow-xs font-bold' : 'text-muted hover:text-text'
            }`}
          >
            Doanh thu & Lợi nhuận
          </button>
          <button
            type="button"
            onClick={() => setViewMode('revenue_expense')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
              viewMode === 'revenue_expense' ? 'bg-card text-primary shadow-xs font-bold' : 'text-muted hover:text-text'
            }`}
          >
            Doanh thu & Chi phí
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {/* Legend */}
        <div className="flex flex-wrap items-center justify-end gap-4 text-xs font-medium mb-3">
          {(viewMode === 'all' || viewMode === 'revenue_profit' || viewMode === 'revenue_expense') && (
            <div className="flex items-center gap-1.5 text-text">
              <span className="w-3 h-3 rounded-full bg-[#3D92CB]" />
              <span>Doanh thu</span>
            </div>
          )}
          {(viewMode === 'all' || viewMode === 'revenue_expense') && (
            <div className="flex items-center gap-1.5 text-text">
              <span className="w-3 h-3 rounded-full bg-[#EF4444]" />
              <span>Chi phí hoạt động</span>
            </div>
          )}
          {viewMode === 'all' && (
            <div className="flex items-center gap-1.5 text-text">
              <span className="w-3 h-3 rounded-full bg-[#8B5CF6]" />
              <span>Nhập hàng</span>
            </div>
          )}
          {(viewMode === 'all' || viewMode === 'revenue_profit') && (
            <div className="flex items-center gap-1.5 text-text">
              <span className="w-3 h-3 rounded-full bg-[#10B981]" />
              <span>Lợi nhuận ròng</span>
            </div>
          )}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="h-64 flex items-center justify-center animate-pulse bg-muted-bg/30 rounded-xl">
            <span className="text-xs text-muted">Đang tải biểu đồ xu hướng...</span>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!trends || trends.length === 0) && (
          <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border rounded-xl text-center p-6">
            <span className="text-sm font-semibold text-text">Chưa có dữ liệu xu hướng</span>
            <p className="text-xs text-muted max-w-sm mt-1">
              Hệ thống chưa ghi nhận phát sinh doanh thu hoặc chi phí trong kỳ được chọn.
            </p>
          </div>
        )}

        {/* SVG Chart */}
        {!isLoading && chartData && (
          <div className="relative w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${chartData.width} ${chartData.height}`}
              className="w-full h-auto overflow-visible select-none"
            >
              {/* Grid Lines & Y Ticks */}
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
                y1={chartData.zeroY}
                x2={chartData.width - chartData.padding.right}
                y2={chartData.zeroY}
                stroke="currentColor"
                className="text-border"
                strokeWidth="1.5"
              />

              {/* Path: Purchases */}
              {viewMode === 'all' && (
                <path
                  d={chartData.purchasesPath}
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all opacity-80"
                />
              )}

              {/* Path: Expenses */}
              {(viewMode === 'all' || viewMode === 'revenue_expense') && (
                <path
                  d={chartData.expensePath}
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all opacity-90"
                />
              )}

              {/* Path: Revenue */}
              {(viewMode === 'all' || viewMode === 'revenue_profit' || viewMode === 'revenue_expense') && (
                <path
                  d={chartData.revenuePath}
                  fill="none"
                  stroke="#3D92CB"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all"
                />
              )}

              {/* Path: Net Profit */}
              {(viewMode === 'all' || viewMode === 'revenue_profit') && (
                <path
                  d={chartData.profitPath}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all"
                />
              )}

              {/* Data points & Interactive Hover Bars */}
              {trends.map((t, idx) => {
                const x = chartData.getX(idx)
                const isHovered = hoveredIndex === idx

                // Show only selective X ticks if too many days
                const showXTick =
                  trends.length <= 10 ||
                  idx === 0 ||
                  idx === trends.length - 1 ||
                  idx % Math.ceil(trends.length / 7) === 0

                return (
                  <g key={idx}>
                    {/* X-axis labels */}
                    {showXTick && (
                      <text
                        x={x}
                        y={chartData.height - 12}
                        textAnchor="middle"
                        className="fill-muted text-[10px] font-mono"
                      >
                        {formatDateLabel(t.date)}
                      </text>
                    )}

                    {/* Hover vertical crosshair */}
                    {isHovered && (
                      <line
                        x1={x}
                        y1={chartData.padding.top}
                        x2={x}
                        y2={chartData.height - chartData.padding.bottom}
                        stroke="#1D3557"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                        className="opacity-70 pointer-events-none"
                      />
                    )}

                    {/* Circles on dots when hovered */}
                    {isHovered && (
                      <>
                        <circle cx={x} cy={chartData.getY(t.revenue)} r="4" fill="#3D92CB" stroke="#FFFFFF" strokeWidth="2" />
                        <circle cx={x} cy={chartData.getY(t.netProfit)} r="4" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
                      </>
                    )}

                    {/* Invisible hover trigger column */}
                    <rect
                      x={x - (chartData.chartW / trends.length) / 2}
                      y={chartData.padding.top}
                      width={chartData.chartW / trends.length}
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

            {/* Floating Tooltip Card */}
            {activeHoveredItem && hoveredIndex !== null && (
              <div
                className="absolute z-10 bg-card/95 backdrop-blur-xs border border-border rounded-xl p-3 shadow-xl pointer-events-none text-xs flex flex-col gap-1.5 transition-all duration-75"
                style={{
                  top: '10px',
                  left: `${Math.min(Math.max(chartData.getX(hoveredIndex) - 90, 10), chartData.width - 200)}px`,
                }}
              >
                <div className="font-bold text-text pb-1 border-b border-border flex items-center justify-between gap-4">
                  <span>Ngày {activeHoveredItem.date}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#3D92CB] font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#3D92CB]" /> Doanh thu:
                  </span>
                  <span className="font-bold font-mono text-text">{formatVND(activeHoveredItem.revenue)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#EF4444] font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#EF4444]" /> Chi phí:
                  </span>
                  <span className="font-bold font-mono text-text">{formatVND(activeHoveredItem.expenses)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#8B5CF6] font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" /> Nhập hàng:
                  </span>
                  <span className="font-bold font-mono text-text">{formatVND(activeHoveredItem.purchases)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/60">
                  <span className="text-[#10B981] font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#10B981]" /> Lợi nhuận:
                  </span>
                  <span className={`font-bold font-mono ${activeHoveredItem.netProfit >= 0 ? 'text-status-ready' : 'text-status-cancelled'}`}>
                    {formatVND(activeHoveredItem.netProfit)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
