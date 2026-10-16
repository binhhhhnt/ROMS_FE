import { useState, useMemo } from 'react'
import { ArrowUpDown, Flame, Trophy, Utensils } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card'
import type { BestSellingDishResponse } from '@/features/dashboard/types/dashboard.types'

interface PopularItemsTableProps {
  dishes: BestSellingDishResponse[]
  isLoading?: boolean
  limit: number
  onLimitChange: (newLimit: number) => void
}

type SortField = 'quantitySold' | 'totalRevenue' | 'rank'
type SortOrder = 'asc' | 'desc'

export function PopularItemsTable({
  dishes,
  isLoading = false,
  limit,
  onLimitChange,
}: PopularItemsTableProps) {
  const [sortField, setSortField] = useState<SortField>('quantitySold')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num)
  }

  const processedData = useMemo(() => {
    if (!dishes || dishes.length === 0) return []

    const totalRevenueSum = dishes.reduce((sum, d) => sum + d.totalRevenue, 0)

    const items = dishes.map((dish, index) => {
      const rank = index + 1
      const avgPrice = Math.round(dish.totalRevenue / Math.max(1, dish.quantitySold))
      const revenueShare = totalRevenueSum > 0 ? (dish.totalRevenue / totalRevenueSum) * 100 : 0

      return {
        ...dish,
        rank,
        avgPrice,
        revenueShare,
      }
    })

    items.sort((a, b) => {
      if (sortField === 'quantitySold') {
        return sortOrder === 'asc' ? a.quantitySold - b.quantitySold : b.quantitySold - a.quantitySold
      }
      if (sortField === 'totalRevenue') {
        return sortOrder === 'asc' ? a.totalRevenue - b.totalRevenue : b.totalRevenue - a.totalRevenue
      }
      return sortOrder === 'asc' ? a.rank - b.rank : b.rank - a.rank
    })

    return items
  }, [dishes, sortField, sortOrder])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  return (
    <Card className="shadow-xs border border-border text-left">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border/50 gap-3">
        <div>
          <CardTitle className="text-base font-bold text-text">Bảng Xếp hạng Món ăn Chi tiết</CardTitle>
          <p className="text-xs text-muted mt-0.5">
            Chi tiết số lượng tiêu thụ, doanh thu và đơn giá thực tế của từng món.
          </p>
        </div>

        {/* Limit Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted">Hiển thị:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="px-2.5 py-1.5 rounded-md border border-border bg-card text-text font-semibold focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value={5}>Top 5 món</option>
            <option value={10}>Top 10 món</option>
            <option value={20}>Top 20 món</option>
            <option value={50}>Top 50 món</option>
          </select>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isLoading && (
          <div className="p-6 animate-pulse flex flex-col gap-3">
            <div className="h-10 bg-muted-bg/50 rounded-md" />
            <div className="h-12 bg-muted-bg/30 rounded-md" />
            <div className="h-12 bg-muted-bg/30 rounded-md" />
          </div>
        )}

        {!isLoading && processedData.length === 0 && (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <Utensils className="w-8 h-8 text-muted mb-2" />
            <span className="text-xs font-semibold text-text">Chưa có dữ liệu món bán</span>
            <p className="text-[11px] text-muted mt-0.5">Không tìm thấy món nào được bán trong khoảng thời gian này.</p>
          </div>
        )}

        {!isLoading && processedData.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface/30 border-b border-border text-text font-semibold">
                  <th
                    className="py-3 px-4 cursor-pointer hover:bg-surface/50 transition-colors w-20 text-center"
                    onClick={() => toggleSort('rank')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Hạng</span>
                      <ArrowUpDown className="w-3 h-3 text-muted" />
                    </div>
                  </th>
                  <th className="py-3 px-4 min-w-[200px]">Tên món ăn</th>
                  <th
                    className="py-3 px-4 text-right cursor-pointer hover:bg-surface/50 transition-colors w-36"
                    onClick={() => toggleSort('quantitySold')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Số lượng bán</span>
                      <ArrowUpDown className="w-3 h-3 text-muted" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 text-right cursor-pointer hover:bg-surface/50 transition-colors w-40"
                    onClick={() => toggleSort('totalRevenue')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Tổng doanh thu</span>
                      <ArrowUpDown className="w-3 h-3 text-muted" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right w-36">Đơn giá TB</th>
                  <th className="py-3 px-4 text-center w-36">Tỷ trọng doanh thu</th>
                  <th className="py-3 px-4 text-center w-32">Xếp loại</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {processedData.map((dish) => {
                  const rankBadge = {
                    1: 'bg-amber-400 text-amber-950 font-black',
                    2: 'bg-slate-300 text-slate-800 font-bold',
                    3: 'bg-amber-600/80 text-white font-bold',
                  }[dish.rank] || 'bg-muted-bg text-muted font-semibold'

                  return (
                    <tr key={dish.menuItemId} className="hover:bg-surface/20 transition-colors">
                      {/* Rank */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-mono ${rankBadge}`}>
                          {dish.rank}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-text text-sm flex items-center gap-2">
                          {dish.rank === 1 && <Trophy className="w-4 h-4 text-amber-500 shrink-0" />}
                          <span title={dish.menuItemName}>{dish.menuItemName}</span>
                        </div>
                        <span className="text-[11px] text-muted font-mono">Mã món: #{dish.menuItemId}</span>
                      </td>

                      {/* Quantity Sold */}
                      <td className="py-3 px-4 text-right font-bold font-mono text-sm text-primary">
                        {dish.quantitySold} <span className="text-[11px] font-normal text-muted">phần</span>
                      </td>

                      {/* Total Revenue */}
                      <td className="py-3 px-4 text-right font-bold font-mono text-sm text-[#3D92CB]">
                        {formatVND(dish.totalRevenue)}
                      </td>

                      {/* Average Unit Price */}
                      <td className="py-3 px-4 text-right font-mono text-muted">
                        {formatVND(dish.avgPrice)}
                      </td>

                      {/* Revenue Share */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-muted-bg h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent rounded-full"
                              style={{ width: `${Math.min(dish.revenueShare * 2, 100)}%` }}
                            />
                          </div>
                          <span className="font-mono text-muted text-[11px] w-10 text-right">
                            {dish.revenueShare.toFixed(1)}%
                          </span>
                        </div>
                      </td>

                      {/* Rating Badge */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {dish.rank <= 3 ? (
                          <Badge variant="pending" className="bg-amber-100 text-amber-900 border-amber-300 gap-1">
                            <Flame className="w-3 h-3 text-amber-600" /> Best Seller
                          </Badge>
                        ) : dish.rank <= 10 ? (
                          <Badge variant="ready">Bán chạy</Badge>
                        ) : (
                          <Badge variant="outline">Tiềm năng</Badge>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
