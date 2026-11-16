import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  RefreshCw,
  Search,
  Filter,
  ArrowUpDown,
  AlertTriangle,
  Plus,
} from 'lucide-react'

import { orderApi } from '@/features/ordering/api/orderApi'
import type { OrderStatus } from '@/features/ordering/types/ordering.types'
import { subscribeToTopic } from '@/shared/lib/stomp'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { StaffOrderCard } from '@/features/ordering/components/StaffOrderCard'
import { StaffOrderModal } from '@/features/ordering/components/StaffOrderModal'

type SortOption = 'newest' | 'oldest' | 'highest_amount'

export function StaffOrdersPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [selectedTable, setSelectedTable] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)

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
    <div className="w-full flex flex-col gap-5">
      {/* Tầng 1: Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-text">
            Danh sách Order phục vụ
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Theo dõi, tiếp nhận và điều phối đơn món ăn của khách tại các bàn
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="text-xs h-9 px-3"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 mr-1.5 ${isRefetching ? 'animate-spin' : ''}`}
            />
            Làm mới
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setIsOrderModalOpen(true)}
            className="text-xs h-9 px-3.5 font-semibold"
          >
            <Plus className="w-4 h-4 mr-1" />
            Đặt món tại bàn
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards (Nền trắng phẳng, số liệu tabular-nums) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          className={`bg-card p-4 rounded-lg border border-border flex items-center justify-between ${
            kpiCounts.readyItems > 0 ? 'border-t-4 border-t-status-ready' : ''
          }`}
        >
          <div>
            <span className="text-xs font-medium text-muted block">
              Món sẵn sàng bưng
            </span>
            <span className="text-2xl font-bold font-mono text-status-ready tabular-nums mt-0.5 block">
              {kpiCounts.readyItems}
            </span>
          </div>
        </div>

        <div className="bg-card p-4 rounded-lg border border-border flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-muted block">
              Chờ tiếp nhận
            </span>
            <span className="text-2xl font-bold font-mono text-status-pending tabular-nums mt-0.5 block">
              {kpiCounts.pending}
            </span>
          </div>
        </div>

        <div className="bg-card p-4 rounded-lg border border-border flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-muted block">
              Đang chế biến
            </span>
            <span className="text-2xl font-bold font-mono text-status-cooking tabular-nums mt-0.5 block">
              {kpiCounts.cooking}
            </span>
          </div>
        </div>

        <div className="bg-card p-4 rounded-lg border border-border flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-muted block">
              Đã hoàn thành
            </span>
            <span className="text-2xl font-bold font-mono text-status-completed tabular-nums mt-0.5 block">
              {kpiCounts.completed}
            </span>
          </div>
        </div>
      </div>

      {/* Tầng 2: Filter and Control Toolbar */}
      <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3.5">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border">
          {statusTabs.map((tab) => {
            const isActive = selectedStatus === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setSelectedStatus(tab.value as OrderStatus | 'ALL')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer border ${
                  isActive
                    ? 'bg-primary text-white border-primary'
                    : 'bg-card text-muted border-border hover:bg-muted-bg hover:text-text'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`font-mono text-[11px] tabular-nums ${
                    isActive ? 'text-white/80' : 'text-muted'
                  }`}
                >
                  ({tab.count})
                </span>
              </button>
            )
          })}
        </div>

        {/* Secondary Filters: Search, Table, Sort */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
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

          <div className="sm:col-span-4 flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted shrink-0" />
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="w-full text-xs h-9 px-3 rounded-md border border-border bg-card text-text focus:outline-none focus:border-accent"
            >
              <option value="ALL">Tất cả bàn ăn</option>
              {uniqueTables.map((tbl) => (
                <option key={tbl} value={tbl}>
                  {tbl}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3 flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-muted shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full text-xs h-9 px-3 rounded-md border border-border bg-card text-text focus:outline-none focus:border-accent"
            >
              <option value="newest">Mới nhất trước</option>
              <option value="oldest">Cũ nhất trước</option>
              <option value="highest_amount">Tổng tiền cao nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tầng 3: Orders Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-lg p-4 h-56 animate-pulse flex flex-col justify-between"
            >
              <div className="flex justify-between items-center">
                <div className="w-24 h-5 bg-surface rounded" />
                <div className="w-16 h-5 bg-surface rounded" />
              </div>
              <div className="space-y-2.5">
                <div className="w-full h-4 bg-surface rounded" />
                <div className="w-3/4 h-4 bg-surface rounded" />
                <div className="w-1/2 h-4 bg-surface rounded" />
              </div>
              <div className="w-full h-8 bg-surface rounded" />
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-lg p-12 text-center flex flex-col items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-muted/60 mb-3" />
          <h3 className="text-sm font-semibold text-text mb-1">
            Không tìm thấy order nào
          </h3>
          <p className="text-xs text-muted max-w-sm">
            {searchQuery || selectedTable !== 'ALL' || selectedStatus !== 'ALL'
              ? 'Không có đơn hàng nào khớp với các điều kiện lọc hiện tại.'
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
              className="mt-4 text-xs h-9"
            >
              Đặt lại bộ lọc
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

      {/* Staff Direct Ordering Modal */}
      <StaffOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  )
}
export default StaffOrdersPage
