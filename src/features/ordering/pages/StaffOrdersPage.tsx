import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  RefreshCw,
  Search,
  ArrowUpDown,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react'

import { orderApi } from '@/features/ordering/api/orderApi'
import type { OrderStatus } from '@/features/ordering/types/ordering.types'
import { subscribeToTopic } from '@/shared/lib/stomp'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { StaffOrderCard } from '@/features/ordering/components/StaffOrderCard'

type SortOption = 'newest' | 'oldest'

const PAGE_SIZE = 21

const SORT_PARAM_MAP: Record<SortOption, string> = {
  newest: 'createdAt,desc',
  oldest: 'createdAt,asc',
}

export function StaffOrdersPage() {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'ALL'>('ALL')
  const [sessionInput, setSessionInput] = useState('')
  const [sessionQuery, setSessionQuery] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [page, setPage] = useState(0)

  // Query paged orders for service staff
  const {
    data: pageData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: [
      'orders',
      'staff',
      'paged',
      selectedStatus,
      sessionQuery,
      fromDate,
      toDate,
      sortBy,
      page,
    ],
    queryFn: () =>
      orderApi.getOrdersPaged({
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        session: sessionQuery || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page,
        size: PAGE_SIZE,
        sort: SORT_PARAM_MAP[sortBy],
      }),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  // Realtime STOMP Subscription
  useEffect(() => {
    const unsubKitchen = subscribeToTopic('/topic/kitchen/orders', () => {
      refetch()
    })
    const unsubReady = subscribeToTopic('/topic/service/ready-dishes', () => {
      refetch()
    })

    return () => {
      unsubKitchen()
      unsubReady()
    }
  }, [refetch])

  const orders = pageData?.content ?? []
  const totalElements = pageData?.totalElements ?? 0
  const totalPages = pageData?.totalPages ?? 0

  const hasActiveFilters =
    selectedStatus !== 'ALL' ||
    Boolean(sessionQuery) ||
    Boolean(fromDate) ||
    Boolean(toDate)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSessionQuery(sessionInput.trim())
    setPage(0)
  }

  const handleResetFilters = () => {
    setSelectedStatus('ALL')
    setSessionInput('')
    setSessionQuery('')
    setFromDate('')
    setToDate('')
    setSortBy('newest')
    setPage(0)
  }

  const statusTabs: { label: string; value: OrderStatus | 'ALL' }[] = [
    { label: 'Tất cả', value: 'ALL' },
    { label: 'Chờ tiếp nhận', value: 'PENDING' },
    { label: 'Đang nấu', value: 'COOKING' },
    { label: 'Hoàn thành', value: 'COMPLETED' },
    { label: 'Đã hủy', value: 'CANCELLED' },
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
            Theo dõi, tra cứu theo phiên bàn và khoảng ngày cho tất cả đơn món ăn
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
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
        </div>
      </div>

      {/* Tầng 2: Filter and Control Toolbar */}
      <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3.5">
        {/* Status Tabs + Total Count */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {statusTabs.map((tab) => {
              const isActive = selectedStatus === tab.value
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => {
                    setSelectedStatus(tab.value)
                    setPage(0)
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${isActive
                      ? 'bg-primary text-white border-primary'
                      : 'bg-card text-muted border-border hover:bg-muted-bg hover:text-text'
                    }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          <span className="text-xs text-muted tabular-nums">
            Tổng <strong className="text-text">{totalElements}</strong> order
          </span>
        </div>

        {/* Secondary Filters: Search by Session, Date Range, Sort */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <form
            onSubmit={handleSearchSubmit}
            className="md:col-span-4 flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="text"
                placeholder="Tìm theo mã phiên (VD: S-..., 123)..."
                value={sessionInput}
                onChange={(e) => setSessionInput(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>
            <Button type="submit" variant="primary" size="sm" className="h-9 px-3 text-xs shrink-0">
              Tìm
            </Button>
          </form>

          <div className="md:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted whitespace-nowrap">Từ</span>
              <Input
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(e) => {
                  setFromDate(e.target.value)
                  setPage(0)
                }}
                className="text-xs h-9"
                aria-label="Từ ngày"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted whitespace-nowrap">Đến</span>
              <Input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => {
                  setToDate(e.target.value)
                  setPage(0)
                }}
                className="text-xs h-9"
                aria-label="Đến ngày"
              />
            </div>
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-muted shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortOption)
                setPage(0)
              }}
              className="w-full text-xs h-9 px-3 rounded-md border border-border bg-card text-text focus:outline-none focus:border-accent"
            >
              <option value="newest">Mới nhất trước</option>
              <option value="oldest">Cũ nhất trước</option>
            </select>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 px-2.5 text-xs shrink-0"
                title="Đặt lại bộ lọc"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            )}
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
      ) : orders.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-lg p-12 text-center flex flex-col items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-muted/60 mb-3" />
          <h3 className="text-sm font-semibold text-text mb-1">
            Không tìm thấy order nào
          </h3>
          <p className="text-xs text-muted max-w-sm">
            {hasActiveFilters
              ? 'Không có đơn hàng nào khớp với các điều kiện lọc hiện tại.'
              : 'Hiện chưa có đơn gọi món nào trong hệ thống.'}
          </p>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="mt-4 text-xs h-9"
            >
              Đặt lại bộ lọc
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order) => (
              <StaffOrderCard key={order.id} order={order} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-card border border-border rounded-lg text-xs">
              <span className="text-muted">
                Trang <strong className="text-text tabular-nums">{page + 1}</strong> /{' '}
                <strong className="text-text tabular-nums">{totalPages}</strong> ({totalElements} order)
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="h-8 px-2.5 text-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Trước
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="h-8 px-2.5 text-xs"
                >
                  Sau
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
export default StaffOrdersPage
