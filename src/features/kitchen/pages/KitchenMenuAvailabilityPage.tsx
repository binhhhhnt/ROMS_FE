import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search, Filter } from 'lucide-react'

import { kitchenApi } from '@/features/kitchen/api/kitchenApi'
import type {
  MenuItemReadItem,
  MenuItemAvailabilityStatus,
} from '@/features/kitchen/types/kitchen.types'
import type { PageResponse } from '@/shared/types/api.types'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { MenuAvailabilityCard } from '@/features/kitchen/components/MenuAvailabilityCard'
import { MenuStatusConfirmModal } from '@/features/kitchen/components/MenuStatusConfirmModal'
import { Input } from '@/shared/components/ui/input'

export function KitchenMenuAvailabilityPage() {
  const queryClient = useQueryClient()
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

  // Execute status update with instant Optimistic Update
  const handleConfirmStatusChange = async () => {
    if (!modalState.item) return

    const targetItem = modalState.item
    const targetStatus = modalState.targetStatus

    // Close modal immediately for instant UI feedback
    setModalState({ isOpen: false, item: null, targetStatus: 'AVAILABLE' })

    // Optimistically update React Query cache immediately
    queryClient.setQueryData(
      ['kitchen', 'menu-items'],
      (oldData: PageResponse<MenuItemReadItem> | undefined) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          content: oldData.content.map((item) =>
            item.id === targetItem.id ? { ...item, status: targetStatus } : item
          ),
        }
      }
    )

    setIsUpdating(true)
    try {
      await kitchenApi.updateMenuStatus(targetItem.id, targetStatus)
      toast.success(
        targetStatus === 'AVAILABLE'
          ? `Đã mở bán lại món "${targetItem.name}"!`
          : `Đã tạm ngưng món "${targetItem.name}"!`
      )
    } catch (err) {
      // Rollback cache on error
      queryClient.setQueryData(
        ['kitchen', 'menu-items'],
        (oldData: PageResponse<MenuItemReadItem> | undefined) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            content: oldData.content.map((item) =>
              item.id === targetItem.id
                ? { ...item, status: targetItem.status }
                : item
            ),
          }
        }
      )
      const msg = getApiErrorMessage(err)
      toast.error(msg)
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
    <div className="max-w-7xl mx-auto flex flex-col gap-5">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-card px-5 py-4 rounded-xl border border-border shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-text tracking-tight">
            TRẠNG THÁI MÓN ĂN (MENU AVAILABILITY)
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Bật / tắt nhanh khả năng đặt món tại bếp khi hết nguyên liệu đột xuất hoặc mở bán lại
          </p>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-xs flex flex-col gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border">
          {statusTabs.map((tab) => {
            const isActive = selectedStatus === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setSelectedStatus(tab.value)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-muted hover:bg-surface hover:text-text'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
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

        {/* Search & Category Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên món ăn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-10 bg-background border-border text-text placeholder:text-muted focus:border-primary"
            />
          </div>

          <div className="sm:col-span-4 flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs h-10 px-3 rounded-xl border border-border bg-background text-text focus:outline-none focus:border-primary"
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
              className="bg-card border border-border rounded-2xl h-72 animate-pulse shadow-xs"
            />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-16 text-center flex flex-col items-center justify-center my-8 shadow-xs">
          <h3 className="text-base font-bold text-text mb-1">
            Không tìm thấy món ăn nào
          </h3>
          <p className="text-xs text-muted max-w-sm">
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
