import { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card'
import type { DailyRevenueExpenseResponse } from '@/features/dashboard/types/dashboard.types'

interface ProfitComparisonChartProps {
  trends: DailyRevenueExpenseResponse[]
  isLoading?: boolean
}

export function ProfitComparisonChart({ trends, isLoading = false }: ProfitComparisonChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [showOnlyProfit, setShowOnlyProfit] = useState(false)

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

  const chartData = useMemo(() => {
    if (!trends || trends.length === 0) return null

    let max = 0
    let min = 0
    trends.forEach((t) => {
      max = Math.max(max, t.revenue, t.expenses + t.purchases, t.netProfit)
      min = Math.min(min, t.netProfit, 0)
    })

    if (max === 0) max = 100_000
    max = max * 1.15

    const range = max - min
    const width = 800
    const height = 280
    const padding = { top: 25, right: 20, bottom: 40, left: 60 }
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

    // Profit line path
    const profitPath = trends
      .map((t, idx) => {
        const x = getX(idx)
        const y = getY(t.netProfit)
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
      })
      .join(' ')

    // Revenue path
    const revenuePath = trends
      .map((t, idx) => {
        const x = getX(idx)
        const y = getY(t.revenue)
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
      })
      .join(' ')

    // Total outflow path (expenses + purchases)
    const outflowPath = trends
      .map((t, idx) => {
        const x = getX(idx)
        const y = getY(t.expenses + t.purchases)
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
      })
      .join(' ')

    const zeroY = getY(0)

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
      zeroY,
      yTicks,
      getY,
      getX,
      profitPath,
      revenuePath,
      outflowPath,
    }
  }, [trends])

  const activeItem = hoveredIndex !== null && trends[hoveredIndex] ? trends[hoveredIndex] : null

  return (
    <Card className="shadow-xs border border-border text-left">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-border/50 gap-2">
        <div>
          <CardTitle className="text-base font-bold text-text">Đối chiếu Dòng tiền & Lợi nhuận ròng</CardTitle>
          <p className="text-xs text-muted mt-0.5">
            So sánh tổng thu (Doanh thu) với tổng chi (Vận hành + Nhập hàng) để xác định lợi nhuận ròng.
          </p>
        </div>

        {/* Toggle View */}
        <div className="flex items-center gap-1 bg-surface/60 p-1 rounded-lg border border-border text-xs">
          <button
            type="button"
            onClick={() => setShowOnlyProfit(false)}
            className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
              !showOnlyProfit ? 'bg-card text-primary shadow-xs font-bold' : 'text-muted hover:text-text'
            }`}
          >
            Đầy đủ dòng tiền
          </button>
          <button
            type="button"
            onClick={() => setShowOnlyProfit(true)}
            className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
              showOnlyProfit ? 'bg-card text-primary shadow-xs font-bold' : 'text-muted hover:text-text'
            }`}
          >
            Chỉ Lợi nhuận
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {/* Legend */}
        <div className="flex flex-wrap items-center justify-end gap-4 text-xs font-medium mb-3">
          {!showOnlyProfit && (
            <>
              <div className="flex items-center gap-1.5 text-text">
                <span className="w-3 h-3 rounded-full bg-[#3D92CB]" />
                <span>Doanh thu</span>
              </div>
              <div className="flex items-center gap-1.5 text-text">
                <span className="w-3 h-3 rounded-full bg-[#EF4444]" />
                <span>Tổng chi phí (Vận hành + Nhập)</span>
              </div>
            </>
          )}
          <div className="flex items-center gap-1.5 text-text">
            <span className="w-3 h-3 rounded-full bg-[#10B981]" />
            <span>Lợi nhuận ròng</span>
          </div>
        </div>

        {isLoading && (
          <div className="h-64 flex items-center justify-center animate-pulse bg-muted-bg/30 rounded-xl">
            <span className="text-xs text-muted">Đang tải biểu đồ lợi nhuận...</span>
          </div>
        )}

        {!isLoading && (!trends || trends.length === 0) && (
          <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border rounded-xl text-center p-6">
            <span className="text-sm font-semibold text-text">Chưa có số liệu dòng tiền</span>
            <p className="text-xs text-muted max-w-sm mt-1">
              Không tìm thấy phát sinh doanh thu hoặc chi phí trong kỳ được chọn.
            </p>
          </div>
        )}

        {!isLoading && chartData && (
          <div className="relative w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${chartData.width} ${chartData.height}`}
              className="w-full h-auto overflow-visible select-none"
            >
              {/* Grid Lines */}
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
                stroke="#64748B"
                strokeWidth="1.5"
              />

              {/* Revenue line */}
              {!showOnlyProfit && (
                <path
                  d={chartData.revenuePath}
                  fill="none"
                  stroke="#3D92CB"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all"
                />
              )}

              {/* Total outflow line */}
              {!showOnlyProfit && (
                <path
                  d={chartData.outflowPath}
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="4 2"
                  className="transition-all opacity-90"
                />
              )}

              {/* Net profit line */}
              <path
                d={chartData.profitPath}
                fill="none"
                stroke="#10B981"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all"
              />

              {/* Interactive nodes & hover lines */}
              {trends.map((t, idx) => {
                const x = chartData.getX(idx)
                const isHovered = hoveredIndex === idx
                const showXTick =
                  trends.length <= 12 ||
                  idx === 0 ||
                  idx === trends.length - 1 ||
                  idx % Math.ceil(trends.length / 8) === 0

                return (
                  <g key={idx}>
                    {/* X Tick Label */}
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

                    {/* Hover Crosshair */}
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

                    {/* Node points */}
                    {isHovered && (
                      <>
                        <circle cx={x} cy={chartData.getY(t.netProfit)} r="5" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
                        {!showOnlyProfit && (
                          <>
                            <circle cx={x} cy={chartData.getY(t.revenue)} r="4" fill="#3D92CB" stroke="#FFFFFF" strokeWidth="2" />
                            <circle cx={x} cy={chartData.getY(t.expenses + t.purchases)} r="4" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />
                          </>
                        )}
                      </>
                    )}

                    {/* Hover hit target */}
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
            {activeItem && hoveredIndex !== null && (
              <div
                className="absolute z-10 bg-card/95 backdrop-blur-xs border border-border rounded-xl p-3.5 shadow-xl pointer-events-none text-xs flex flex-col gap-1.5 transition-all duration-75"
                style={{
                  top: '10px',
                  left: `${Math.min(Math.max(chartData.getX(hoveredIndex) - 100, 10), chartData.width - 220)}px`,
                }}
              >
                <div className="font-bold text-text pb-1 border-b border-border flex items-center justify-between gap-4">
                  <span>Ngày {activeItem.date}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#3D92CB] font-medium">Doanh thu (+):</span>
                  <span className="font-bold font-mono text-text">{formatVND(activeItem.revenue)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-muted">
                  <span>Chi phí vận hành (-):</span>
                  <span className="font-mono text-text">{formatVND(activeItem.expenses)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-muted">
                  <span>Nhập hàng (-):</span>
                  <span className="font-mono text-text">{formatVND(activeItem.purchases)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/60">
                  <span className="font-bold text-text">Lợi nhuận ròng:</span>
                  <span className={`font-bold font-mono ${activeItem.netProfit >= 0 ? 'text-status-ready' : 'text-status-cancelled'}`}>
                    {formatVND(activeItem.netProfit)}
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
