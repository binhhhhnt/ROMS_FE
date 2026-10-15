import { Trophy, Flame, Utensils } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card'
import type { BestSellingDishResponse } from '@/features/dashboard/types/dashboard.types'

interface BestSellingDishesCardProps {
  dishes: BestSellingDishResponse[]
  isLoading?: boolean
}

export function BestSellingDishesCard({ dishes, isLoading = false }: BestSellingDishesCardProps) {
  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num)
  }

  const maxQuantity = dishes.length > 0 ? Math.max(...dishes.map((d) => d.quantitySold), 1) : 1

  return (
    <Card className="shadow-xs border border-border text-left flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-status-pending/15 text-status-pending flex items-center justify-center">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-text">Món ăn bán chạy</CardTitle>
            <p className="text-xs text-muted">Xếp hạng theo sản lượng đã phục vụ</p>
          </div>
        </div>
        <Trophy className="w-5 h-5 text-status-pending/80" />
      </CardHeader>

      <CardContent className="pt-4 flex-1 flex flex-col justify-between">
        {isLoading && (
          <div className="flex flex-col gap-3 animate-pulse">
            <div className="h-12 bg-muted-bg/50 rounded-lg" />
            <div className="h-12 bg-muted-bg/50 rounded-lg" />
            <div className="h-12 bg-muted-bg/50 rounded-lg" />
          </div>
        )}

        {!isLoading && dishes.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-border rounded-xl">
            <Utensils className="w-8 h-8 text-muted mb-2" />
            <span className="text-sm font-semibold text-text">Chưa có số liệu bán hàng</span>
            <p className="text-xs text-muted max-w-xs mt-1">
              Chưa có đơn hàng nào được hoàn thành trong khoảng thời gian này.
            </p>
          </div>
        )}

        {!isLoading && dishes.length > 0 && (
          <div className="flex flex-col gap-3.5">
            {dishes.map((dish, index) => {
              const rank = index + 1
              const percentage = Math.round((dish.quantitySold / maxQuantity) * 100)

              const rankStyles = {
                1: 'bg-amber-400 text-amber-950 font-black ring-2 ring-amber-400/30',
                2: 'bg-slate-300 text-slate-800 font-bold',
                3: 'bg-amber-600/80 text-white font-bold',
              }[rank] || 'bg-muted-bg text-muted font-semibold'

              return (
                <div key={dish.menuItemId} className="flex flex-col gap-1.5 p-2 rounded-lg hover:bg-surface/30 transition-colors">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 truncate">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${rankStyles}`}>
                        {rank}
                      </span>
                      <span className="font-bold text-text truncate max-w-[180px] sm:max-w-[220px]" title={dish.menuItemName}>
                        {dish.menuItemName}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold font-mono text-primary mr-2">
                        {dish.quantitySold} <span className="font-normal text-[10px] text-muted">phần</span>
                      </span>
                      <span className="font-mono text-muted text-[11px]">
                        ({formatVND(dish.totalRevenue)})
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-muted-bg h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        rank === 1 ? 'bg-accent' : 'bg-primary/60'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
