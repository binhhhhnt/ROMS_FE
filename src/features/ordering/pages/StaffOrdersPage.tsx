import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ClipboardList,
  RefreshCw,
  Search,
  Filter,
  ArrowUpDown,
  Utensils,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BellRing,
} from 'lucide-react'

import { orderApi } from '@/features/ordering/api/orderApi'
import type { OrderStatus } from '@/features/ordering/types/ordering.types'
import { subscribeToTopic } from '@/shared/lib/stomp'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { StaffOrderCard } from '@/features/ordering/components/StaffOrderCard'

type SortOption = 'newest' | 'oldest' | 'highest_amount'

export function StaffOrdersPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [selectedTable, setSelectedTable] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  // Query all orders for service staff
  const {
    data: orders = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['orders', 'staff'],
    queryFn: () => orderApi.getOrders(),
  })

  // Realtime STOMP Subscription
  useEffect(() => {
    // Listen to session orders updates (authorized for SERVICE_STAFF)
    const unsubSession = subscribeToTopic('/topic/session/1/orders', () => {
      refetch()
    })

    return () => {
      unsubSession()
    }
  }, [refetch])

  // Extract unique tables from orders list
  const uniqueTables = useMemo(() => {
    const tableSet = new Set<string>()
    orders.forEach((o) => {
      if (o.tableCode) tableSet.add(o.tableCode)
      else if (o.tableId) tableSet.add(`Bàn ${o.tableId}`)
    })
    return Array.from(tableSet).sort()
  }, [orders])

  // Quick KPI counts
  const kpiCounts = useMemo(() => {
    const pending = orders.filter((o) => o.status === 'PENDING').length
    const cooking = orders.filter((o) => o.status === 'COOKING').length
    const completed = orders.filter((o) => o.status === 'COMPLETED').length
    const cancelled = orders.filter((o) => o.status === 'CANCELLED').length

    // Count items with READY status across all non-completed/non-cancelled orders
    let readyItems = 0
    orders.forEach((o) => {
      if (o.status !== 'CANCELLED') {
        o.items.forEach((item) => {
          if (item.status === 'READY') readyItems++
        })
      }
    })

    return { pending, cooking, completed, cancelled, readyItems }
  }, [orders])

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        // Status filter
        if (selectedStatus !== 'ALL' && order.status !== selectedStatus) {
          return false
        }

        // Table filter
        if (selectedTable !== 'ALL') {
          const matchTable =
            order.tableCode === selectedTable ||
            `Bàn ${order.tableId}` === selectedTable
          if (!matchTable) return false
        }

        // Search query filter
        if (searchQuery.trim()) {
          const query = searchQuery.trim().toLowerCase()
          const matchId = order.id.toString().includes(query)
          const matchTable = (order.tableCode || `Bàn ${order.tableId}`)
            .toLowerCase()
            .includes(query)
          const matchItem = order.items.some((item) =>
            item.menuItemName.toLowerCase().includes(query)
          )
          if (!matchId && !matchTable && !matchItem) return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        }
        if (sortBy === 'oldest') {
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
        }
        if (sortBy === 'highest_amount') {
          return b.totalAmount - a.totalAmount
        }
        return 0
      })
  }, [orders, selectedStatus, selectedTable, searchQuery, sortBy])

  const statusTabs = [
    { label: 'Tất cả', value: 'ALL', count: orders.length },
    {
      label: 'Chờ tiếp nhận',
      value: 'PENDING',
      count: kpiCounts.pending,
    },
    {
      label: 'Đang nấu',
      value: 'COOKING',
      count: kpiCounts.cooking,
    },
    {
      label: 'Hoàn thành',
      value: 'COMPLETED',
      count: kpiCounts.completed,
    },
    {
      label: 'Đã hủy',
      value: 'CANCELLED',
      count: kpiCounts.cancelled,
    },
  ]

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2.5">
            <ClipboardList className="w-7 h-7 text-primary" />
            Danh sách Order phục vụ
          </h1>
          <p className="text-xs text-muted mt-1">
            Theo dõi, tiếp nhận và điều phối đơn món ăn của khách tại các bàn
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="text-xs h-9 font-medium"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 mr-1.5 ${
                isRefetching ? 'animate-spin' : ''
              }`}
            />
            {isRefetching ? 'Đang tải...' : 'Làm mới'}
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Ready to Serve Alert Card */}
        <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
          kpiCounts.readyItems > 0
            ? 'bg-emerald-500/10 border-status-ready/60 ring-1 ring-status-ready/30'
            : 'bg-card border-border'
        }`}>
          <div>
            <div className="text-xs font-semibold text-muted flex items-center gap-1.5">
              <BellRing className={`w-4 h-4 ${kpiCounts.readyItems > 0 ? 'text-status-ready animate-bounce' : 'text-muted'}`} />
              Món sẵn sàng bưng
            </div>
            <div className="text-2xl font-extrabold text-status-ready mt-1">
              {kpiCounts.readyItems}
            </div>
          </div>
          <span className="text-[11px] font-bold text-status-ready bg-status-ready/15 px-2 py-0.5 rounded-full">
            Ưu tiên bưng
          </span>
        </div>

        {/* Pending Card */}
        <div className="bg-card p-4 rounded-xl border border-border flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-muted flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-status-pending" />
              Chờ tiếp nhận
            </div>
            <div className="text-2xl font-extrabold text-status-pending mt-1">
              {kpiCounts.pending}
            </div>
          </div>
          <span className="text-[11px] font-medium text-muted bg-surface px-2 py-0.5 rounded-full">
            Đơn mới
          </span>
        </div>

        {/* Cooking Card */}
        <div className="bg-card p-4 rounded-xl border border-border flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-muted flex items-center gap-1.5">
              <Utensils className="w-4 h-4 text-status-cooking" />
              Đang chế biến
            </div>
            <div className="text-2xl font-extrabold text-status-cooking mt-1">
              {kpiCounts.cooking}
            </div>
          </div>
          <span className="text-[11px] font-medium text-muted bg-surface px-2 py-0.5 rounded-full">
            Trong bếp
          </span>
        </div>

        {/* Completed Card */}
        <div className="bg-card p-4 rounded-xl border border-border flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-muted flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-status-completed" />
              Đã hoàn thành
            </div>
            <div className="text-2xl font-extrabold text-status-completed mt-1">
              {kpiCounts.completed}
            </div>
          </div>
          <span className="text-[11px] font-medium text-muted bg-surface px-2 py-0.5 rounded-full">
            Hôm nay
          </span>
        </div>
      </div>

      {/* Filter and Control Toolbar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-2xs flex flex-col gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border">
          {statusTabs.map((tab) => {
            const isActive = selectedStatus === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setSelectedStatus(tab.value as OrderStatus | 'ALL')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-muted hover:bg-surface/50 hover:text-text'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-surface text-muted'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Secondary Filters: Table, Search, Sort */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              placeholder="Tìm theo mã đơn #, tên bàn, tên món..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>

          {/* Table Selector */}
          <div className="sm:col-span-4 flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted shrink-0" />
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="w-full text-xs h-9 px-3 rounded-lg border border-border bg-card text-text focus:outline-none focus:border-accent"
            >
              <option value="ALL">Tất cả bàn ăn</option>
              {uniqueTables.map((tbl) => (
                <option key={tbl} value={tbl}>
                  {tbl}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Selector */}
          <div className="sm:col-span-3 flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-muted shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full text-xs h-9 px-3 rounded-lg border border-border bg-card text-text focus:outline-none focus:border-accent"
            >
              <option value="newest">Mới nhất trước</option>
              <option value="oldest">Cũ nhất trước</option>
              <option value="highest_amount">Tổng tiền cao nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl p-5 h-64 animate-pulse flex flex-col justify-between"
            >
              <div className="flex justify-between items-center">
                <div className="w-24 h-5 bg-surface rounded" />
                <div className="w-16 h-5 bg-surface rounded" />
              </div>
              <div className="space-y-3">
                <div className="w-full h-4 bg-surface rounded" />
                <div className="w-3/4 h-4 bg-surface rounded" />
                <div className="w-1/2 h-4 bg-surface rounded" />
              </div>
              <div className="w-full h-8 bg-surface rounded" />
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center flex flex-col items-center justify-center my-6">
          <div className="w-16 h-16 rounded-full bg-surface/80 flex items-center justify-center text-muted mb-3">
            <AlertTriangle className="w-8 h-8 text-muted" />
          </div>
          <h3 className="text-base font-bold text-text mb-1">
            Không tìm thấy order nào
          </h3>
          <p className="text-xs text-muted max-w-sm">
            {searchQuery || selectedTable !== 'ALL' || selectedStatus !== 'ALL'
              ? 'Không có đơn hàng nào khớp với các điều kiện lọc hiện tại. Hãy thử thay đổi bộ lọc hoặc tìm kiếm lại.'
              : 'Hiện chưa có đơn gọi món nào trong ca phục vụ.'}
          </p>
          {(searchQuery || selectedTable !== 'ALL' || selectedStatus !== 'ALL') && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedStatus('ALL')
                setSelectedTable('ALL')
                setSearchQuery('')
              }}
              className="mt-4 text-xs font-semibold"
            >
              Đặt lại tất cả bộ lọc
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <StaffOrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}
export default StaffOrdersPage
