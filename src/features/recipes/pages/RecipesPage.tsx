import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/app/store/authStore'
import { recipeApi } from '@/features/recipes/api/recipeApi'
import type { RecipeMenuItem } from '@/features/recipes/types/recipe.types'
import { RecipeEditorDrawer } from '@/features/recipes/components/RecipeEditorDrawer'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import {
  Search,
  Filter,
  RefreshCw,
  UtensilsCrossed,
  Layers,
  ChefHat,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Eye,
  SlidersHorizontal,
} from 'lucide-react'

export function RecipesPage() {
  const { user } = useAuthStore()
  const isOwner = user?.role === 'OWNER'

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')

  // Drawer state
  const [activeMenuItem, setActiveMenuItem] = useState<RecipeMenuItem | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Fetch Menu Items (size=100 for comprehensive catalog)
  const {
    data: menuData,
    isLoading: isLoadingMenu,
    isRefetching,
    refetch: refetchMenuItems,
  } = useQuery({
    queryKey: ['recipes', 'menu-items'],
    queryFn: () => recipeApi.getMenuItems({ page: 0, size: 100 }),
  })

  // Fetch Categories
  const { data: categoryData } = useQuery({
    queryKey: ['recipes', 'categories'],
    queryFn: () => recipeApi.getCategories(),
  })

  const categories = categoryData?.content || []
  const menuItems = menuData?.content || []

  // Filter menu items locally
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchName = item.name.toLowerCase().includes(query)
        const matchDesc = item.description?.toLowerCase().includes(query) || false
        if (!matchName && !matchDesc) return false
      }

      // Category
      if (selectedCategory !== 'ALL') {
        const catId = Number(selectedCategory)
        if (item.category?.id !== catId) return false
      }

      // Status
      if (selectedStatus !== 'ALL') {
        if (item.status !== selectedStatus) return false
      }

      return true
    })
  }, [menuItems, searchQuery, selectedCategory, selectedStatus])

  const handleOpenDrawer = (item: RecipeMenuItem) => {
    setActiveMenuItem(item)
    setIsDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
  }

  // Stats
  const totalCount = menuItems.length
  const availableCount = menuItems.filter((m) => m.status === 'AVAILABLE').length
  const sellableCount = menuItems.filter((m) => m.availability?.sellable).length

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text">
              Quản lý Công thức Món (BOM)
            </h1>
            <Badge
              variant="outline"
              className={
                isOwner
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-surface text-muted-foreground border-border'
              }
            >
              {isOwner ? (
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Quyền Quản lý (OWNER)
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  Chỉ đọc ({user?.role})
                </span>
              )}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Thiết lập định lượng nguyên vật liệu tiêu hao cho từng món ăn để tự động tính toán tồn kho và khấu trừ khi bán hàng.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchMenuItems()}
            disabled={isRefetching}
            className="text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-accent/15 border border-accent/20 flex items-center justify-center text-accent">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Tổng món trong thực đơn</div>
            <div className="text-xl font-bold text-text">{totalCount}</div>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Đang mở bán</div>
            <div className="text-xl font-bold text-text">{availableCount}</div>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-sky-500/15 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Đủ nguyên liệu phục vụ</div>
            <div className="text-xl font-bold text-text">{sellableCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card border border-border p-4 rounded-xl space-y-3 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search box */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm món ăn theo tên hoặc mô tả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Category dropdown */}
          <div className="sm:col-span-3">
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-card text-xs text-text focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="ALL">-- Tất cả danh mục --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status dropdown */}
          <div className="sm:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-input bg-card text-xs text-text focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="ALL">-- Tất cả trạng thái --</option>
              <option value="AVAILABLE">Đang phục vụ (AVAILABLE)</option>
              <option value="TEMPORARILY_UNAVAILABLE">Tạm ngưng (UNAVAILABLE)</option>
              <option value="DISCONTINUED">Ngừng bán (DISCONTINUED)</option>
            </select>
          </div>
        </div>

        {/* Applied filters summary */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-accent" />
            <span>
              Hiển thị <strong>{filteredMenuItems.length}</strong> / {totalCount} món ăn
            </span>
          </div>
          {(searchQuery || selectedCategory !== 'ALL' || selectedStatus !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('ALL')
                setSelectedStatus('ALL')
              }}
              className="text-accent hover:underline text-xs"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Menu Items Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-surface/50 border-b border-border text-muted-foreground font-medium">
              <tr>
                <th className="px-4 py-3 text-left w-16">ID</th>
                <th className="px-4 py-3 text-left">Món ăn</th>
                <th className="px-4 py-3 text-left">Danh mục</th>
                <th className="px-4 py-3 text-right">Giá bán</th>
                <th className="px-4 py-3 text-center">Trạng thái bán</th>
                <th className="px-4 py-3 text-center">Khả năng phục vụ</th>
                <th className="px-4 py-3 text-right">Định lượng (BOM)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoadingMenu ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-accent" />
                      <span>Đang tải danh sách món ăn...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredMenuItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <UtensilsCrossed className="w-8 h-8 text-muted-foreground/40" />
                      <span className="font-medium text-sm">Không tìm thấy món ăn nào phù hợp</span>
                      <span className="text-xs">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc danh mục.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMenuItems.map((item) => {
                  const isAvailable = item.status === 'AVAILABLE'
                  const isTempUnavailable = item.status === 'TEMPORARILY_UNAVAILABLE'
                  const isDiscontinued = item.status === 'DISCONTINUED'

                  const sellable = item.availability?.sellable ?? true
                  const maxPossible = item.availability?.maxPossibleQuantity

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-surface/40 transition-colors group cursor-pointer"
                      onClick={() => handleOpenDrawer(item)}
                    >
                      {/* ID */}
                      <td className="px-4 py-3 text-muted-foreground font-mono">
                        #{item.id}
                      </td>

                      {/* Name & Desc */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-text text-sm group-hover:text-accent transition-colors">
                          {item.name}
                        </div>
                        {item.description && (
                          <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                            {item.description}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        {item.category?.name ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-surface border border-border text-text">
                            {item.category.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic">—</span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3 text-right font-medium text-text">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(item.price)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        {isAvailable && (
                          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px]">
                            Đang bán
                          </Badge>
                        )}
                        {isTempUnavailable && (
                          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[10px]">
                            Tạm ngưng
                          </Badge>
                        )}
                        {isDiscontinued && (
                          <Badge className="bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-500/20 text-[10px]">
                            Ngừng bán
                          </Badge>
                        )}
                      </td>

                      {/* Availability based on stock */}
                      <td className="px-4 py-3 text-center">
                        {sellable ? (
                          <div className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>
                              {maxPossible !== undefined ? `Tối đa ${maxPossible} suất` : 'Sẵn sàng'}
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 text-rose-500 text-xs font-medium" title={item.availability?.reason || 'Hết nguyên liệu tồn kho'}>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Hết nguyên liệu</span>
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant={isOwner ? 'primary' : 'outline'}
                          onClick={() => handleOpenDrawer(item)}
                          className={
                            isOwner
                              ? 'h-8 px-3 text-xs bg-accent hover:bg-accent-hover text-white flex items-center gap-1.5'
                              : 'h-8 px-3 text-xs flex items-center gap-1.5'
                          }
                        >
                          {isOwner ? (
                            <>
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                              <span>Định lượng</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5 text-accent" />
                              <span>Xem công thức</span>
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recipe Editor Drawer */}
      <RecipeEditorDrawer
        menuItem={activeMenuItem}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onRecipeUpdated={() => {
          refetchMenuItems()
        }}
      />
    </div>
  )
}
