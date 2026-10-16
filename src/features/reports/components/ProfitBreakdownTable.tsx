import { useState, useMemo } from 'react'
import { ArrowUpDown, DollarSign } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card'
import type { DailyRevenueExpenseResponse } from '@/features/dashboard/types/dashboard.types'

interface ProfitBreakdownTableProps {
  trends: DailyRevenueExpenseResponse[]
  isLoading?: boolean
}

type SortField = 'date' | 'revenue' | 'netProfit'
type SortOrder = 'asc' | 'desc'

export function ProfitBreakdownTable({ trends, isLoading = false }: ProfitBreakdownTableProps) {
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

  const processedData = useMemo(() => {
    if (!trends || trends.length === 0) return []

    const items = trends.map((item) => {
      const totalOutflow = item.expenses + item.purchases
      const margin = item.revenue > 0 ? (item.netProfit / item.revenue) * 100 : item.netProfit < 0 ? -100 : 0

      return {
        ...item,
        totalOutflow,
        margin,
      }
    })

    items.sort((a, b) => {
      if (sortField === 'revenue') {
        return sortOrder === 'asc' ? a.revenue - b.revenue : b.revenue - a.revenue
      }
      if (sortField === 'netProfit') {
        return sortOrder === 'asc' ? a.netProfit - b.netProfit : b.netProfit - a.netProfit
      }
      return sortOrder === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)
    })

    return items
  }, [trends, sortField, sortOrder])

  // Total summary row
  const totals = useMemo(() => {
    const rev = trends.reduce((sum, t) => sum + t.revenue, 0)
    const exp = trends.reduce((sum, t) => sum + t.expenses, 0)
    const pur = trends.reduce((sum, t) => sum + t.purchases, 0)
    const outflow = exp + pur
    const profit = rev - outflow
    const margin = rev > 0 ? (profit / rev) * 100 : 0

    return { rev, exp, pur, outflow, profit, margin }
  }, [trends])

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
          <CardTitle className="text-base font-bold text-text">Bảng Báo cáo Lãi / Lỗ theo Ngày</CardTitle>
          <p className="text-xs text-muted mt-0.5">
            Bảng kê chi tiết doanh thu, chi phí vận hành, nhập hàng và lợi nhuận ròng hàng ngày.
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
            <DollarSign className="w-8 h-8 text-muted mb-2" />
            <span className="text-xs font-semibold text-text">Chưa có bản ghi tài chính</span>
            <p className="text-[11px] text-muted mt-0.5">Không tìm thấy dữ liệu phát sinh trong kỳ lọc này.</p>
          </div>
        )}

        {!isLoading && processedData.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface/30 border-b border-border text-text font-semibold">
                  <th
                    className="py-3 px-4 cursor-pointer hover:bg-surface/50 transition-colors w-32"
                    onClick={() => toggleSort('date')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Ngày</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-muted" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 text-right cursor-pointer hover:bg-surface/50 transition-colors w-36"
                    onClick={() => toggleSort('revenue')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Doanh thu (+)</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-muted" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right w-32 text-muted">Chi phí HĐ (-)</th>
                  <th className="py-3 px-4 text-right w-32 text-muted">Nhập hàng (-)</th>
                  <th className="py-3 px-4 text-right w-36 text-status-cancelled">Tổng chi (-)</th>
                  <th
                    className="py-3 px-4 text-right cursor-pointer hover:bg-surface/50 transition-colors w-36"
                    onClick={() => toggleSort('netProfit')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Lợi nhuận ròng</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-muted" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center w-28">Tỷ suất (%)</th>
                  <th className="py-3 px-4 text-center w-28">Đánh giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {processedData.map((row) => (
                  <tr key={row.date} className="hover:bg-surface/20 transition-colors">
                    {/* Date */}
                    <td className="py-3 px-4 font-medium text-text">
                      {formatDate(row.date)}
                    </td>

                    {/* Revenue */}
                    <td className="py-3 px-4 text-right font-bold font-mono text-sm text-[#3D92CB]">
                      {formatVND(row.revenue)}
                    </td>

                    {/* Expenses */}
                    <td className="py-3 px-4 text-right font-mono text-muted">
                      {formatVND(row.expenses)}
                    </td>

                    {/* Purchases */}
                    <td className="py-3 px-4 text-right font-mono text-muted">
                      {formatVND(row.purchases)}
                    </td>

                    {/* Total Outflow */}
                    <td className="py-3 px-4 text-right font-mono font-medium text-status-cancelled">
                      {formatVND(row.totalOutflow)}
                    </td>

                    {/* Net profit */}
                    <td className="py-3 px-4 text-right font-bold font-mono text-sm">
                      <span className={row.netProfit >= 0 ? 'text-status-ready' : 'text-status-cancelled'}>
                        {formatVND(row.netProfit)}
                      </span>
                    </td>

                    {/* Margin */}
                    <td className="py-3 px-4 text-center font-mono">
                      <span className={row.margin >= 0 ? 'text-status-ready font-semibold' : 'text-status-cancelled font-semibold'}>
                        {row.revenue > 0 ? `${row.margin.toFixed(1)}%` : '-'}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {row.netProfit > 0 && row.margin >= 25 ? (
                        <Badge variant="ready" className="bg-emerald-100 text-emerald-900 border-emerald-300">
                          Lãi cao
                        </Badge>
                      ) : row.netProfit > 0 ? (
                        <Badge variant="ready">Có lãi</Badge>
                      ) : row.netProfit === 0 ? (
                        <Badge variant="outline">Hòa vốn</Badge>
                      ) : (
                        <Badge variant="cancelled">Thua lỗ</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Totals Summary Footer */}
              <tfoot>
                <tr className="bg-surface/50 border-t-2 border-border font-bold text-text">
                  <td className="py-3.5 px-4 font-bold">TỔNG CỘNG ({trends.length} ngày)</td>
                  <td className="py-3.5 px-4 text-right font-mono text-sm text-[#3D92CB]">
                    {formatVND(totals.rev)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-muted">
                    {formatVND(totals.exp)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-muted">
                    {formatVND(totals.pur)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-status-cancelled">
                    {formatVND(totals.outflow)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-sm">
                    <span className={totals.profit >= 0 ? 'text-status-ready' : 'text-status-cancelled'}>
                      {formatVND(totals.profit)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono">
                    <span className={totals.margin >= 0 ? 'text-status-ready' : 'text-status-cancelled'}>
                      {totals.margin.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={totals.profit >= 0 ? 'text-status-ready' : 'text-status-cancelled'}>
                      {totals.profit >= 0 ? 'LÃI RÒNG' : 'LỖ RÒNG'}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
