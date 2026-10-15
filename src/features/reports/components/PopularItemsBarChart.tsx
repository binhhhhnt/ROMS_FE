import { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card'
import type { BestSellingDishResponse } from '@/features/dashboard/types/dashboard.types'

interface PopularItemsBarChartProps {
  dishes: BestSellingDishResponse[]
  isLoading?: boolean
}

export function PopularItemsBarChart({ dishes, isLoading = false }: PopularItemsBarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num)
  }

  const chartData = useMemo(() => {
    if (!dishes || dishes.length === 0) return null

    const maxQty = Math.max(...dishes.map((d) => d.quantitySold), 1)
    return {
      maxQty,
      dishes: dishes.slice(0, 10), // Show top 10 in chart for clean layout
    }
  }, [dishes])

  const activeDish = hoveredIndex !== null && chartData?.dishes[hoveredIndex] ? chartData.dishes[hoveredIndex] : null

  return (
    <Card className="shadow-xs border border-border text-left">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50">
        <div>
          <CardTitle className="text-base font-bold text-text">Biểu đồ Phân bổ Sản lượng Tiêu thụ</CardTitle>
          <p className="text-xs text-muted mt-0.5">
            So sánh số lượng phần đã phục vụ giữa các món ăn hàng đầu.
          </p>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {isLoading && (
          <div className="h-64 flex items-center justify-center animate-pulse bg-muted-bg/30 rounded-xl">
            <span className="text-xs text-muted">Đang tải biểu đồ món bán chạy...</span>
          </div>
        )}

        {!isLoading && (!dishes || dishes.length === 0) && (
          <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border rounded-xl text-center p-6">
            <span className="text-sm font-semibold text-text">Chưa có số liệu tiêu thụ</span>
            <p className="text-xs text-muted max-w-sm mt-1">
              Chưa ghi nhận món ăn nào được hoàn thành trong kỳ lọc này.
            </p>
          </div>
        )}

        {!isLoading && chartData && (
          <div className="flex flex-col gap-3">
            {chartData.dishes.map((dish, idx) => {
              const rank = idx + 1
              const percentage = Math.round((dish.quantitySold / chartData.maxQty) * 100)
              const isHovered = hoveredIndex === idx

              const rankBadge = {
                1: 'bg-amber-400 text-amber-950 font-black',
                2: 'bg-slate-300 text-slate-800 font-bold',
                3: 'bg-amber-600/80 text-white font-bold',
              }[rank] || 'bg-muted-bg text-muted font-semibold'

              return (
                <div
                  key={dish.menuItemId}
                  className={`flex flex-col gap-1.5 p-2 rounded-xl transition-all cursor-pointer ${
                    isHovered ? 'bg-surface/60 shadow-xs' : 'hover:bg-surface/30'
                  }`}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${rankBadge}`}>
                        {rank}
                      </span>
                      <span className="font-bold text-text truncate max-w-[200px] sm:max-w-[320px]" title={dish.menuItemName}>
                        {dish.menuItemName}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-bold font-mono text-primary text-sm">
                        {dish.quantitySold} <span className="font-normal text-[11px] text-muted">phần</span>
                      </span>
                      <span className="font-mono text-muted text-xs hidden sm:inline">
                        ({formatVND(dish.totalRevenue)})
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full bg-muted-bg/80 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        rank === 1
                          ? 'bg-amber-400'
                          : rank === 2
                          ? 'bg-[#3D92CB]'
                          : rank === 3
                          ? 'bg-[#3D92CB]/80'
                          : 'bg-[#1D3557]/70'
                      }`}
                      style={{ width: `${Math.max(percentage, 3)}%` }}
                    />
                  </div>
                </div>
              )
            })}

            {/* Hover details box */}
            {activeDish && (
              <div className="mt-2 p-3 bg-surface/40 border border-border rounded-xl text-xs flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-100">
                <div className="flex items-center gap-2">
                  <span className="text-muted">Đang xem:</span>
                  <span className="font-bold text-text">{activeDish.menuItemName}</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span>
                    Sản lượng: <strong className="text-primary">{activeDish.quantitySold} phần</strong>
                  </span>
                  <span>
                    Tổng thu: <strong className="text-accent">{formatVND(activeDish.totalRevenue)}</strong>
                  </span>
                  <span>
                    Giá bán trung bình:{' '}
                    <strong className="text-text">
                      {formatVND(Math.round(activeDish.totalRevenue / Math.max(activeDish.quantitySold, 1)))}/phần
                    </strong>
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
