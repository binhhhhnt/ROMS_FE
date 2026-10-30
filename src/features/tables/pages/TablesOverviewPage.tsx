import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Layers,
  Plus,
  RefreshCw,
  Search,
  Filter,
  LayoutGrid,
  List,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

import { tableApi } from '@/features/tables/api/tableApi'
import { kitchenApi } from '@/features/kitchen/api/kitchenApi'
import { subscribeToTopic } from '@/shared/lib/stomp'
import type { TableItem } from '@/features/tables/types/table.types'
import { TableCard } from '@/features/tables/components/TableCard'
import { TableModal } from '@/features/tables/components/TableModal'
import { TransferTableModal } from '@/features/tables/components/TransferTableModal'
import { useAuthStore } from '@/app/store/authStore'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'

interface TablesOverviewPageProps {
  initialActiveOnly?: boolean
}

export function TablesOverviewPage({ initialActiveOnly = false }: TablesOverviewPageProps) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const isOwner = user?.role === 'OWNER'

  const [selectedArea, setSelectedArea] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>(initialActiveOnly ? 'OCCUPIED' : '')
  const [search, setSearch] = useState<string>('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // Modals state
  const [isTableModalOpen, setIsTableModalOpen] = useState(false)
  const [tableToEdit, setTableToEdit] = useState<TableItem | null>(null)
  const [transferringTable, setTransferringTable] = useState<TableItem | null>(null)
  const [closeSessionTarget, setCloseSessionTarget] = useState<TableItem | null>(null)
  const [statusTargetTable, setStatusTargetTable] = useState<TableItem | null>(null)

  // Fetch tables
  const {
    data: tablesData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['tablesOverview'],
    queryFn: () => tableApi.getTables({ size: 100 }),
    refetchInterval: 10000, // Poll every 10s for real-time table state
  })

  // Fetch areas
  const { data: areas = [] } = useQuery({
    queryKey: ['tableAreas'],
    queryFn: () => tableApi.getAreas(),
  })

  // Fetch active kitchen orders to count dishes waiting to be served
  const { data: readyKitchenOrders = [], refetch: refetchReadyOrders } = useQuery({
    queryKey: ['tablesOverviewReadyOrders'],
    queryFn: () => kitchenApi.getKitchenOrders(),
    refetchInterval: 10000,
  })

  // Realtime subscription for kitchen orders
  useEffect(() => {
    const unsub = subscribeToTopic('/topic/kitchen/orders', () => {
      refetchReadyOrders()
      refetch()
    })
    return () => unsub()
  }, [refetch, refetchReadyOrders])

  const tables = tablesData?.content || []

  // Count ready items by tableId
  const readyCountByTableId = useMemo(() => {
    const map: Record<number, number> = {}
    readyKitchenOrders.forEach((order) => {
      const readyCount = order.items
        .filter((i) => i.status === 'READY')
        .reduce((sum, i) => sum + i.quantity, 0)
      if (readyCount > 0) {
        map[order.tableId] = (map[order.tableId] || 0) + readyCount
      }
    })
    return map
  }, [readyKitchenOrders])

  // KPI calculations
  const totalTables = tables.length
  const occupiedCount = tables.filter((t) => t.realtimeStatus === 'OCCUPIED').length
  const emptyCount = tables.filter((t) => t.realtimeStatus === 'EMPTY' && t.isActive).length
  const outOfServiceCount = tables.filter(
    (t) => !t.isActive || t.realtimeStatus === 'OUT_OF_SERVICE'
  ).length

  // Filtered tables
  const filteredTables = tables.filter((t) => {
    if (selectedArea && t.area !== selectedArea) return false
    if (selectedStatus === 'OCCUPIED' && t.realtimeStatus !== 'OCCUPIED') return false
    if (selectedStatus === 'EMPTY' && (t.realtimeStatus !== 'EMPTY' || !t.isActive)) return false
    if (selectedStatus === 'OUT_OF_SERVICE' && (t.isActive && t.realtimeStatus !== 'OUT_OF_SERVICE')) return false
    if (search.trim() && !t.tableCode.toLowerCase().includes(search.trim().toLowerCase())) return false
    return true
  })

  // Open session mutation
  const openSessionMutation = useMutation({
    mutationFn: (tableId: number) => tableApi.openSession(tableId),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['tablesOverview'] })
      toast.success(`Đã mở phiên phục vụ #${session.id} cho Bàn ${session.tableCode}!`)
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err))
    },
  })

  // Close session mutation
  const closeSessionMutation = useMutation({
    mutationFn: (sessionId: number) => tableApi.closeSession(sessionId),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['tablesOverview'] })
      toast.success(`Đã đóng phiên phục vụ #${session.id} cho Bàn ${session.tableCode}!`)
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err))
    },
  })

  // Toggle table status mutation (Owner only)
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      tableApi.updateTableStatus(id, isActive),
    onSuccess: (table) => {
      queryClient.invalidateQueries({ queryKey: ['tablesOverview'] })
      toast.success(`Bàn ${table.tableCode} đã ${table.isActive ? 'hoạt động' : 'tạm tắt'}!`)
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err))
    },
  })

  const handleOpenSession = (table: TableItem) => {
    openSessionMutation.mutate(table.id)
  }

  const handleCloseSession = (table: TableItem) => {
    if (!table.activeSessionId) return
    setCloseSessionTarget(table)
  }

  const handleConfirmCloseSession = () => {
    if (!closeSessionTarget?.activeSessionId) return
    closeSessionMutation.mutate(closeSessionTarget.activeSessionId, {
      onSettled: () => setCloseSessionTarget(null),
    })
  }

  const handleToggleStatus = (table: TableItem) => {
    setStatusTargetTable(table)
  }

  const handleConfirmToggleStatus = () => {
    if (!statusTargetTable) return
    toggleStatusMutation.mutate(
      { id: statusTargetTable.id, isActive: !statusTargetTable.isActive },
      {
        onSettled: () => setStatusTargetTable(null),
      }
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-text">
                Sơ đồ bàn & Trạng thái phục vụ
              </h1>
              <p className="text-xs text-muted">
                Theo dõi trạng thái thời gian thực, mở bàn đón khách, chuyển bàn và đóng phiên.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>

          {isOwner && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setTableToEdit(null)
                setIsTableModalOpen(true)
              }}
              className="text-xs shadow-md font-semibold"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Thêm bàn mới
            </Button>
          )}
        </div>
      </div>

      {/* KPI Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-card border border-border rounded-xl shadow-xs flex items-center justify-between text-left">
          <div>
            <span className="text-[11px] text-muted block uppercase font-medium">Tổng số bàn</span>
            <span className="text-2xl font-black text-text">{totalTables}</span>
          </div>
          <Layers className="w-7 h-7 text-muted/40" />
        </div>

        <div className="p-4 bg-status-cooking/10 border border-status-cooking/20 rounded-xl shadow-xs flex items-center justify-between text-left">
          <div>
            <span className="text-[11px] text-status-cooking block uppercase font-medium">
              Đang phục vụ
            </span>
            <span className="text-2xl font-black text-status-cooking">{occupiedCount}</span>
          </div>
          <Clock className="w-7 h-7 text-status-cooking/40" />
        </div>

        <div className="p-4 bg-status-completed/10 border border-status-completed/20 rounded-xl shadow-xs flex items-center justify-between text-left">
          <div>
            <span className="text-[11px] text-status-completed block uppercase font-medium">
              Bàn trống
            </span>
            <span className="text-2xl font-black text-status-completed">{emptyCount}</span>
          </div>
          <CheckCircle2 className="w-7 h-7 text-status-completed/40" />
        </div>

        <div className="p-4 bg-surface/50 border border-border rounded-xl shadow-xs flex items-center justify-between text-left">
          <div>
            <span className="text-[11px] text-muted block uppercase font-medium">
              Tạm ngừng / Bảo trì
            </span>
            <span className="text-2xl font-black text-muted">{outOfServiceCount}</span>
          </div>
          <AlertTriangle className="w-7 h-7 text-muted/40" />
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 bg-card border border-border rounded-xl shadow-xs">
        {/* Search by code */}
        <div className="relative">
          <Input
            placeholder="Tìm theo mã bàn (ví dụ: T01)..."
            leftIcon={<Search className="w-4 h-4 text-muted" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Area */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted shrink-0" />
          <select
            className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-text shadow-xs focus:outline-hidden focus:ring-2 focus:ring-accent"
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
          >
            <option value="">Tất cả khu vực</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                Khu vực: {a}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Status */}
        <div>
          <select
            className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-text shadow-xs focus:outline-hidden focus:ring-2 focus:ring-accent"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="OCCUPIED">Đang phục vụ</option>
            <option value="EMPTY">Bàn trống</option>
            <option value="OUT_OF_SERVICE">Tạm ngừng / Tắt</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-end gap-1">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-10 px-3 text-xs"
            title="Dạng sơ đồ lưới"
          >
            <LayoutGrid className="w-4 h-4 mr-1" />
            Sơ đồ
          </Button>
          <Button
            variant={viewMode === 'table' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="h-10 px-3 text-xs"
            title="Dạng danh sách"
          >
            <List className="w-4 h-4 mr-1" />
            Danh sách
          </Button>
        </div>
      </div>

      {/* Main Display Area */}
      {isLoading ? (
        <div className="py-16 text-center text-muted">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Đang tải dữ liệu bàn ăn...
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="py-16 text-center text-muted bg-card border border-border rounded-xl">
          Không tìm thấy bàn nào phù hợp với bộ lọc hiện tại.
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              isOwner={isOwner}
              readyItemsCount={readyCountByTableId[table.id] || 0}
              onOpenSession={handleOpenSession}
              onCloseSession={handleCloseSession}
              onTransferTable={(t) => setTransferringTable(t)}
              onEditTable={(t) => {
                setTableToEdit(t)
                setIsTableModalOpen(true)
              }}
              onToggleStatus={handleToggleStatus}
              onViewDetail={(t) => navigate(`/tables/${t.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border shadow-md rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/50 text-muted uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Mã bàn</th>
                <th className="py-3 px-4">Sức chứa</th>
                <th className="py-3 px-4">Khu vực</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Phiên hiện tại</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTables.map((t) => (
                <tr key={t.id} className="hover:bg-surface/30 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-text uppercase">Bàn {t.tableCode}</td>
                  <td className="py-3.5 px-4 text-muted">{t.capacity} người</td>
                  <td className="py-3.5 px-4 text-muted">{t.area || '-'}</td>
                  <td className="py-3.5 px-4">
                    {readyCountByTableId[t.id] && readyCountByTableId[t.id] > 0 ? (
                      <Badge variant="ready" className="bg-status-ready text-white animate-pulse">
                        {readyCountByTableId[t.id]} món cần bưng
                      </Badge>
                    ) : t.realtimeStatus === 'OCCUPIED' ? (
                      <Badge variant="cooking">Đang phục vụ</Badge>
                    ) : t.realtimeStatus === 'EMPTY' && t.isActive ? (
                      <Badge variant="completed">Bàn trống</Badge>
                    ) : (
                      <Badge variant="secondary">Bảo trì</Badge>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-muted">
                    {t.activeSessionId ? `#${t.activeSessionId}` : '-'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/tables/${t.id}`)}
                        className="h-8 px-2"
                      >
                        Chi tiết
                      </Button>
                      {t.realtimeStatus === 'EMPTY' && t.isActive && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenSession(t)}
                          className="h-8 px-2 text-xs"
                        >
                          Mở bàn
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Table Create/Edit Modal */}
      <TableModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        onSuccess={() => refetch()}
        tableToEdit={tableToEdit}
        existingAreas={areas}
      />

      {/* Transfer Table Modal */}
      <TransferTableModal
        isOpen={!!transferringTable}
        onClose={() => setTransferringTable(null)}
        onSuccess={() => refetch()}
        currentTable={transferringTable}
        availableEmptyTables={tables}
      />

      {/* Confirm Close Session Modal */}
      <ConfirmDialog
        isOpen={!!closeSessionTarget}
        onClose={() => setCloseSessionTarget(null)}
        onConfirm={handleConfirmCloseSession}
        isLoading={closeSessionMutation.isPending}
        title={`Xác nhận đóng phiên Bàn ${closeSessionTarget?.tableCode}`}
        description={
          <span>
            Bạn có chắc chắn muốn đóng phiên phục vụ cho{' '}
            <strong className="text-text">Bàn {closeSessionTarget?.tableCode}</strong>?
            <span className="block mt-1 text-[11px] text-muted">
              Lưu ý: Không thể đóng bàn nếu còn món ăn đang chế biến hoặc chưa hoàn tất thanh toán.
            </span>
          </span>
        }
        confirmText="Đóng phiên"
        cancelText="Hủy bỏ"
        variant="warning"
      />

      {/* Confirm Toggle Table Status Modal */}
      <ConfirmDialog
        isOpen={!!statusTargetTable}
        onClose={() => setStatusTargetTable(null)}
        onConfirm={handleConfirmToggleStatus}
        isLoading={toggleStatusMutation.isPending}
        title={
          statusTargetTable?.isActive
            ? `Tạm ngưng hoạt động Bàn ${statusTargetTable?.tableCode}`
            : `Kích hoạt Bàn ${statusTargetTable?.tableCode}`
        }
        description={
          <span>
            Bạn có chắc chắn muốn{' '}
            <strong className={statusTargetTable?.isActive ? 'text-status-cancelled' : 'text-status-completed'}>
              {statusTargetTable?.isActive ? 'tạm tắt / bảo trì' : 'bật hoạt động trở lại'}
            </strong>{' '}
            cho <strong className="text-text">Bàn {statusTargetTable?.tableCode}</strong>?
          </span>
        }
        confirmText={statusTargetTable?.isActive ? 'Tạm ngưng' : 'Kích hoạt'}
        cancelText="Hủy bỏ"
        variant={statusTargetTable?.isActive ? 'danger' : 'primary'}
      />
    </div>
  )
}
export default TablesOverviewPage
