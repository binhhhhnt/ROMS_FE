import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  UtensilsCrossed,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Ban,
} from 'lucide-react'

import { kitchenApi } from '@/features/kitchen/api/kitchenApi'
import type {
  MenuItemReadItem,
  MenuItemAvailabilityStatus,
} from '@/features/kitchen/types/kitchen.types'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { MenuAvailabilityCard } from '@/features/kitchen/components/MenuAvailabilityCard'
import { MenuStatusConfirmModal } from '@/features/kitchen/components/MenuStatusConfirmModal'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

export function KitchenMenuAvailabilityPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')

  // Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    item: MenuItemReadItem | null
    targetStatus: MenuItemAvailabilityStatus
  }>({
    isOpen: false,
    item: null,
    targetStatus: 'AVAILABLE',
  })
  const [isUpdating, setIsUpdating] = useState(false)

  // Fetch Menu Items
  const {
    data: menuData,
    isLoading: isLoadingMenu,
    isRefetching: isRefetchingMenu,
    refetch: refetchMenu,
  } = useQuery({
    queryKey: ['kitchen', 'menu-items'],
    queryFn: () => kitchenApi.getMenuItems(undefined, 0, 100),
  })

  // Fetch Categories for Filter
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => kitchenApi.getCategories(),
  })

  const menuItems = useMemo(() => {
    return menuData?.content || []
  }, [menuData])

  const categories = useMemo(() => {
    return categoriesData?.content || []
  }, [categoriesData])

  // KPI Counts
  const kpiCounts = useMemo(() => {
    const total = menuItems.length
    const available = menuItems.filter((i) => i.status === 'AVAILABLE').length
    const tempUnavailable = menuItems.filter(
      (i) => i.status === 'TEMPORARILY_UNAVAILABLE'
    ).length
    const discontinued = menuItems.filter(
      (i) => i.status === 'DISCONTINUED'
    ).length
    return { total, available, tempUnavailable, discontinued }
  }, [menuItems])

  // Filtered Menu Items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Category filter
      if (selectedCategory !== 'ALL') {
        const catId = Number(selectedCategory)
        if (item.category?.id !== catId) return false
      }

      // Status filter
      if (selectedStatus !== 'ALL') {
        if (item.status !== selectedStatus) return false
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase()
        const matchName = item.name.toLowerCase().includes(query)
        const matchCat = item.category?.name?.toLowerCase().includes(query)
        if (!matchName && !matchCat) return false
      }

      return true
    })
  }, [menuItems, selectedCategory, selectedStatus, searchQuery])

  // Open modal on toggle button click
  const handleToggleClick = (item: MenuItemReadItem) => {
    const nextStatus: MenuItemAvailabilityStatus =
      item.status === 'AVAILABLE' ? 'TEMPORARILY_UNAVAILABLE' : 'AVAILABLE'

    setModalState({
      isOpen: true,
      item,
      targetStatus: nextStatus,
    })
  }

  // Execute status update on modal confirm
  const handleConfirmStatusChange = async () => {
    if (!modalState.item) return

    setIsUpdating(true)
    try {
      await kitchenApi.updateMenuStatus(
        modalState.item.id,
        modalState.targetStatus
      )
      toast.success(
        modalState.targetStatus === 'AVAILABLE'
          ? `Đã mở bán lại món "${modalState.item.name}"!`
          : `Đã tạm ngưng món "${modalState.item.name}"!`
      )
      await refetchMenu()
      setModalState((prev) => ({ ...prev, isOpen: false, item: null }))
    } catch (err) {
      const msg = getApiErrorMessage(err)
      toast.error(msg)
      // Per spec: Keep old state and inform user if error
    } finally {
      setIsUpdating(false)
    }
  }

  const statusTabs = [
    { label: 'Tất cả món', value: 'ALL', count: kpiCounts.total },
    {
      label: 'Đang phục vụ',
      value: 'AVAILABLE',
      count: kpiCounts.available,
    },
    {
      label: 'Tạm ngưng',
      value: 'TEMPORARILY_UNAVAILABLE',
      count: kpiCounts.tempUnavailable,
    },
    {
      label: 'Ngừng kinh doanh',
      value: 'DISCONTINUED',
      count: kpiCounts.discontinued,
    },
  ]

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold shrink-0">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
              Quản lý Trạng thái Món ăn (Menu Availability)
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Bật / tắt nhanh khả năng đặt món tại bếp khi hết nguyên liệu đột xuất hoặc mở bán lại
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => refetchMenu()}
          disabled={isLoadingMenu || isRefetchingMenu}
          className="text-xs h-10 border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white self-start sm:self-auto"
        >
          <RefreshCw
            className={`w-4 h-4 mr-1.5 ${isRefetchingMenu ? 'animate-spin text-sky-400' : ''}`}
          />
          {isRefetchingMenu ? 'Đang tải...' : 'Làm mới'}
        </Button>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase">
              Tổng số món
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {kpiCounts.total}
            </div>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Đang phục vụ
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {kpiCounts.available}
            </div>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-amber-400 uppercase flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Tạm ngưng bán
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {kpiCounts.tempUnavailable}
            </div>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
              <Ban className="w-3.5 h-3.5" />
              Ngừng vĩnh viễn
            </div>
            <div className="text-2xl font-black text-slate-500 mt-1">
              {kpiCounts.discontinued}
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800/80">
          {statusTabs.map((tab) => {
            const isActive = selectedStatus === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setSelectedStatus(tab.value)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-850 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search & Category Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên món ăn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-10 bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus:border-sky-500"
            />
          </div>

          <div className="sm:col-span-4 flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs h-10 px-3 rounded-xl border border-slate-800 bg-slate-900 text-white focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">Tất cả danh mục món</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      {isLoadingMenu ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-slate-800/60 border border-slate-700 rounded-2xl h-72 animate-pulse"
            />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-slate-950 border border-dashed border-slate-800 rounded-3xl p-16 text-center flex flex-col items-center justify-center my-8">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            Không tìm thấy món ăn nào
          </h3>
          <p className="text-xs text-slate-400 max-w-sm">
            Không có món ăn nào phù hợp với bộ lọc hiện tại. Thử thay đổi từ khóa hoặc đặt lại bộ lọc.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredItems.map((item) => (
            <MenuAvailabilityCard
              key={item.id}
              item={item}
              onToggleClick={handleToggleClick}
            />
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      <MenuStatusConfirmModal
        isOpen={modalState.isOpen}
        onClose={() =>
          setModalState((prev) => ({ ...prev, isOpen: false, item: null }))
        }
        onConfirm={handleConfirmStatusChange}
        item={modalState.item}
        targetStatus={modalState.targetStatus}
        isLoading={isUpdating}
      />
    </div>
  )
}
export default KitchenMenuAvailabilityPage
