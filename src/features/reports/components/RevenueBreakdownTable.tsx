import { useState, useMemo } from 'react'
import { ArrowUpDown, TrendingUp, TrendingDown, Minus, Trophy, Receipt } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card'
import type { DailyRevenueExpenseResponse } from '@/features/dashboard/types/dashboard.types'

interface RevenueBreakdownTableProps {
  trends: DailyRevenueExpenseResponse[]
  isLoading?: boolean
}

type SortField = 'date' | 'revenue'
type SortOrder = 'asc' | 'desc'

export function RevenueBreakdownTable({ trends, isLoading = false }: RevenueBreakdownTableProps) {
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num)
  }

  const formatDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-')
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`
      }
      return dateStr
    } catch {
      return dateStr
    }
  }

  // Calculate table items with growth and percentage
  const processedData = useMemo(() => {
    if (!trends || trends.length === 0) return []

    // 1. Sort chronologically by date first to compute day-over-day growth rate
    const chrono = [...trends].sort((a, b) => a.date.localeCompare(b.date))
    const totalRev = chrono.reduce((sum, item) => sum + item.revenue, 0)
    const maxRev = Math.max(...chrono.map((item) => item.revenue), 1)
    const avgRev = totalRev / Math.max(1, chrono.length)

    const items = chrono.map((item, index) => {
      let growthRate: number | null = null
      if (index > 0) {
        const prev = chrono[index - 1].revenue
        if (prev > 0) {
          growthRate = ((item.revenue - prev) / prev) * 100
        } else if (item.revenue > 0) {
          growthRate = 100
        } else {
          growthRate = 0
        }
      }

      const percentageOfTotal = totalRev > 0 ? (item.revenue / totalRev) * 100 : 0
      const isPeak = item.revenue > 0 && item.revenue === maxRev

      return {
        ...item,
        percentageOfTotal,
        growthRate,
        isPeak,
        isAboveAverage: item.revenue >= avgRev,
      }
    })

    // 2. Apply user sort
    items.sort((a, b) => {
      if (sortField === 'revenue') {
        return sortOrder === 'asc' ? a.revenue - b.revenue : b.revenue - a.revenue
      }
      return sortOrder === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)
    })

    return items
  }, [trends, sortField, sortOrder])

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
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50">
        <div>
          <CardTitle className="text-base font-bold text-text">Bảng Chi tiết Doanh thu theo Ngày</CardTitle>
          <p className="text-xs text-muted mt-0.5">
            Dữ liệu phát sinh hàng ngày kèm tốc độ tăng trưởng và tỷ trọng đóng góp.
          </p>
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
            <Receipt className="w-8 h-8 text-muted mb-2" />
            <span className="text-xs font-semibold text-text">Không có bản ghi doanh thu</span>
            <p className="text-[11px] text-muted mt-0.5">Không tìm thấy dữ liệu phát sinh trong kỳ lọc này.</p>
          </div>
        )}

        {!isLoading && processedData.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface/30 border-b border-border text-text font-semibold">
                  <th
                    className="py-3 px-4 cursor-pointer hover:bg-surface/50 transition-colors w-36"
                    onClick={() => toggleSort('date')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Ngày</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-muted" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 text-right cursor-pointer hover:bg-surface/50 transition-colors w-40"
                    onClick={() => toggleSort('revenue')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Doanh thu</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-muted" />
                    </div>
                  </th>
                  <th className="py-3 px-4 w-44 text-center">Tỷ trọng trong kỳ</th>
                  <th className="py-3 px-4 text-center w-36">Tăng trưởng (so ngày trước)</th>
                  <th className="py-3 px-4 text-center w-32">Đánh giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {processedData.map((row) => (
                  <tr key={row.date} className="hover:bg-surface/20 transition-colors">
                    {/* Date */}
                    <td className="py-3 px-4 font-medium text-text">
                      <div className="flex items-center gap-1.5">
                        {row.isPeak && <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                        <span>{formatDate(row.date)}</span>
                      </div>
                    </td>

                    {/* Revenue */}
                    <td className="py-3 px-4 text-right font-bold font-mono text-sm text-[#3D92CB]">
                      {formatVND(row.revenue)}
                    </td>

                    {/* Percentage */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 bg-muted-bg h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full"
                            style={{ width: `${Math.min(row.percentageOfTotal * 3, 100)}%` }}
                          />
                        </div>
                        <span className="font-mono text-muted text-[11px] w-10 text-right">
                          {row.percentageOfTotal.toFixed(1)}%
                        </span>
                      </div>
                    </td>

                    {/* Growth rate vs previous day */}
                    <td className="py-3 px-4 text-center">
                      {row.growthRate === null ? (
                        <span className="text-muted text-[11px] flex items-center justify-center gap-1">
                          <Minus className="w-3 h-3" /> Mốc đầu
                        </span>
                      ) : row.growthRate > 0 ? (
                        <span className="text-status-ready font-semibold font-mono text-xs flex items-center justify-center gap-0.5">
                          <TrendingUp className="w-3.5 h-3.5" /> +{row.growthRate.toFixed(1)}%
                        </span>
                      ) : row.growthRate < 0 ? (
                        <span className="text-status-cancelled font-semibold font-mono text-xs flex items-center justify-center gap-0.5">
                          <TrendingDown className="w-3.5 h-3.5" /> {row.growthRate.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-muted font-mono text-xs flex items-center justify-center gap-0.5">
                          <Minus className="w-3 h-3" /> 0%
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {row.isPeak ? (
                        <Badge variant="pending" className="bg-amber-100 text-amber-900 border-amber-300">
                          Đạt đỉnh
                        </Badge>
                      ) : row.isAboveAverage ? (
                        <Badge variant="ready">Tốt</Badge>
                      ) : row.revenue > 0 ? (
                        <Badge variant="outline">Bình thường</Badge>
                      ) : (
                        <Badge variant="secondary" className="opacity-60">Không bán</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
