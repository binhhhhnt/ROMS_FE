import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  X,
  Search,
  Utensils,
  Plus,
  Minus,
  Trash2,
  Send,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import { toast } from 'sonner'
import { menuApi } from '@/features/menu/api/menuApi'
import { categoryApi } from '@/features/menu/api/categoryApi'
import { tableApi } from '@/features/tables/api/tableApi'
import { orderApi } from '@/features/ordering/api/orderApi'
import { useMenuRealtime } from '@/features/menu/hooks/useMenuRealtime'
import { fetchAllPages } from '@/shared/utils/pagination'
import { getApiErrorMessage } from '@/shared/lib/axios'
import type { OrderResponse } from '@/features/ordering/types/ordering.types'

interface CartItem {
  menuItemId: number
  name: string
  price: number
  quantity: number
  note: string
}

interface StaffOrderModalProps {
  isOpen: boolean
  onClose: () => void
  initialSessionId?: number
  initialTableCode?: string
  onSuccess?: (order: OrderResponse) => void
}

export function StaffOrderModal({
  isOpen,
  onClose,
  initialSessionId,
  initialTableCode,
  onSuccess,
}: StaffOrderModalProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<number | undefined>(initialSessionId)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Realtime menu updates sync
  useMenuRealtime(isOpen)

  // 1. Fetch menu items (returns AVAILABLE and TEMPORARILY_UNAVAILABLE with BOM)
  const { data: menuData, isLoading: isLoadingMenu } = useQuery({
    queryKey: ['menu-items', 'staff-order'],
    queryFn: () =>
      fetchAllPages((page) =>
        menuApi.list({ page, size: 100, sort: 'name,asc', forOrder: true })
      ),
    enabled: isOpen,
  })

  // 2. Fetch active categories
  const { data: categoryData } = useQuery({
    queryKey: ['categories', 'active'],
    queryFn: () => fetchAllPages((page) => categoryApi.list(page, 100)),
    enabled: isOpen,
  })

  // 3. Fetch tables with active sessions (only needed if initialSessionId not provided)
  const { data: tablesData } = useQuery({
    queryKey: ['tables', 'active-sessions'],
    queryFn: () => tableApi.getTables({ size: 100 }),
    enabled: isOpen && !initialSessionId,
  })

  const menuItems = useMemo(() => menuData?.content || [], [menuData])
  const categories = useMemo(
    () => (categoryData?.content || []).filter((cat) => cat.isActive),
    [categoryData]
  )
  const activeTables = useMemo(() => {
    return (tablesData?.content || []).filter(
      (t) => t.activeSessionId !== null && t.activeSessionId !== undefined
    )
  }, [tablesData])

  // Filtered menu items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (item.status === 'DISCONTINUED') {
        return false
      }
      // Category filter
      if (selectedCategory !== 'ALL' && item.category?.id?.toString() !== selectedCategory) {
        return false
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = item.name.toLowerCase().includes(q)
        const matchDesc = item.description?.toLowerCase().includes(q)
        if (!matchName && !matchDesc) return false
      }
      return true
    })
  }, [menuItems, selectedCategory, searchQuery])

  // Cart operations
  const handleAddToCart = (item: { id: number; name: string; price: number }) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id)
      if (existing) {
        return prev.map((c) =>
          c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      } else {
        return [
          ...prev,
          {
            menuItemId: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            note: '',
          },
        ]
      }
    })
  }

  const handleUpdateQuantity = (menuItemId: number, delta: number) => {
    setCart((prev) => {
      return prev
        .map((c) => {
          if (c.menuItemId === menuItemId) {
            const newQty = c.quantity + delta
            return newQty > 0 ? { ...c, quantity: newQty } : null
          }
          return c
        })
        .filter(Boolean) as CartItem[]
    })
  }

  const handleRemoveFromCart = (menuItemId: number) => {
    setCart((prev) => prev.filter((c) => c.menuItemId !== menuItemId))
  }

  const handleUpdateNote = (menuItemId: number, note: string) => {
    setCart((prev) =>
      prev.map((c) => (c.menuItemId === menuItemId ? { ...c, note } : c))
    )
  }

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [cart])

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const handleSubmitOrder = async () => {
    const targetSessionId = initialSessionId || selectedSessionId
    if (!targetSessionId) {
      toast.error('Vui lòng chọn bàn đang phục vụ để tạo order')
      return
    }

    if (cart.length === 0) {
      toast.error('Vui lòng chọn ít nhất một món ăn')
      return
    }

    try {
      setIsSubmitting(true)
      const payload = {
        sessionId: targetSessionId,
        items: cart.map((c) => ({
          menuItemId: c.menuItemId,
          quantity: c.quantity,
          note: c.note.trim() || undefined,
        })),
      }

      const createdOrder = await orderApi.createOrder(payload)
      toast.success(
        `Đã tạo thành công Đơn #${createdOrder.id} gửi trực tiếp vào bếp!`
      )
      setCart([])
      if (onSuccess) onSuccess(createdOrder)
      onClose()
    } catch (err) {
      toast.error(getApiErrorMessage(err) || 'Không thể tạo đơn hàng')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50">
      <div className="bg-card border border-border rounded-lg w-full max-w-5xl h-[92vh] max-h-[820px] shadow-md flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border bg-surface/60 flex items-center justify-between shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-text">Đặt món tại bàn</h2>
              {initialTableCode && (
                <Badge variant="cooking">Bàn {initialTableCode}</Badge>
              )}
            </div>
            <p className="text-xs text-muted mt-0.5">
              Chọn món và gửi trực tiếp vào bếp
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-muted hover:text-text p-1.5 rounded-md border border-border bg-card hover:bg-muted-bg transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Left (Menu selection) & Right (Cart preview) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
          {/* Left Column: Menu Items Catalog */}
          <div className="flex-1 min-h-[300px] lg:min-h-0 flex flex-col p-4 sm:p-5 overflow-hidden border-b lg:border-b-0 lg:border-r border-border">
            {/* Table Selector (if not preselected) */}
            {!initialSessionId && (
              <div className="mb-4">
                <label className="text-xs font-semibold text-text block mb-1.5">
                  Chọn bàn đang phục vụ (*):
                </label>
                {activeTables.length === 0 ? (
                  <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    Hiện chưa có bàn nào đang mở phiên phục vụ. Vui lòng mở phiên bàn trước.
                  </div>
                ) : (
                  <select
                    value={selectedSessionId || ''}
                    onChange={(e) => setSelectedSessionId(Number(e.target.value) || undefined)}
                    className="w-full text-xs font-semibold p-2.5 rounded-lg border border-border bg-card text-text focus:outline-none focus:border-accent"
                  >
                    <option value="">-- Chọn bàn phục vụ --</option>
                    {activeTables.map((t) => (
                      <option key={t.id} value={t.activeSessionId!}>
                        Bàn {t.tableCode} (Khu vực: {t.area})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Filter and Search Bar */}
            <div className="flex flex-col gap-3 mb-4 shrink-0">

              {/* Search Bar - Nằm phía trên */}
              <div className="relative w-full">
                <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Tìm món ăn nhanh..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs w-full"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 w-full">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('ALL')}
                  className={`text-xs px-3 py-1.5 rounded-md border whitespace-nowrap font-medium transition-colors cursor-pointer ${selectedCategory === 'ALL'
                      ? 'bg-primary text-white border-primary'
                      : 'bg-card border-border hover:bg-muted-bg text-text'
                    }`}
                >
                  Tất cả
                </button>

                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id.toString())}
                    className={`text-xs px-3 py-1.5 rounded-md border whitespace-nowrap font-medium transition-colors cursor-pointer ${selectedCategory === cat.id.toString()
                        ? 'bg-primary text-white border-primary'
                        : 'bg-card border-border hover:bg-muted-bg text-text'
                      }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="flex-1 overflow-y-auto pr-1">
              {isLoadingMenu ? (
                <div className="h-64 flex items-center justify-center text-xs text-muted">
                  Đang tải danh sách món ăn...
                </div>
              ) : filteredMenuItems.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-muted">
                  <Utensils className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-xs">Không tìm thấy món ăn nào phù hợp</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredMenuItems.map((item) => {
                    const inCartItem = cart.find((c) => c.menuItemId === item.id)
                    const qty = inCartItem?.quantity || 0
                    const isOutOfStock = item.status === 'TEMPORARILY_UNAVAILABLE' || item.availability?.sellable === false

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-lg border flex flex-col justify-between gap-2.5 transition-colors ${isOutOfStock
                            ? 'border-border bg-card opacity-60'
                            : qty > 0
                              ? 'border-primary bg-surface/40'
                              : 'border-border bg-card hover:border-primary/40'
                          }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`font-semibold text-sm leading-snug ${isOutOfStock ? 'text-muted' : 'text-text'}`}>
                              {item.name}
                            </h4>
                            {item.isFeatured && (
                              <Badge variant="pending" className="shrink-0">Nổi bật</Badge>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-muted line-clamp-1 mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <span className={`font-semibold font-mono text-sm tabular-nums ${isOutOfStock ? 'text-muted line-through' : 'text-text'}`}>
                            {formatPrice(item.price)}
                          </span>

                          {isOutOfStock && qty === 0 ? (
                            <Badge variant="cancelled">Hết món</Badge>
                          ) : qty === 0 ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddToCart(item)}
                              className="h-9 text-xs px-3"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" />
                              Thêm
                            </Button>
                          ) : (
                            <div className="flex items-center gap-1 bg-card border border-border rounded-md p-0.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(item.id, -1)}
                                className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted-bg text-text cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-mono font-bold text-text w-6 text-center tabular-nums">
                                {qty}
                              </span>
                              <button
                                type="button"
                                disabled={isOutOfStock}
                                onClick={() => handleUpdateQuantity(item.id, 1)}
                                className={`w-7 h-7 rounded flex items-center justify-center text-text ${isOutOfStock ? 'opacity-30 cursor-not-allowed' : 'hover:bg-muted-bg cursor-pointer'
                                  }`}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Cart Summary & Send to Kitchen */}
          <div className="w-full lg:w-96 flex flex-col bg-card p-4 sm:p-5 overflow-hidden shrink-0">
            <div className="flex items-center justify-between pb-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-accent" />
                <h3 className="font-bold text-sm text-text">
                  Món đã chọn ({cart.reduce((s, c) => s + c.quantity, 0)})
                </h3>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="text-xs text-status-cancelled hover:underline"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted">
                  <ShoppingBag className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-xs">Chưa có món nào được chọn</p>
                  <p className="text-[11px] text-muted/80 mt-1">
                    Nhấn nút &ldquo;Thêm&rdquo; bên thực đơn để ghi món vào đơn
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.menuItemId}
                    className="p-3 rounded-xl border border-border bg-card shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="font-bold text-xs text-text">{item.name}</h5>
                        <span className="text-[11px] text-muted">
                          {formatPrice(item.price)} &times; {item.quantity}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-primary">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(item.menuItemId)}
                          className="text-muted hover:text-status-cancelled p-1 rounded transition-colors"
                          title="Xóa món"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Quantity Adjustment & Note */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
                      <div className="flex items-center gap-1.5 border border-border rounded-md bg-surface/30">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.menuItemId, -1)}
                          className="w-5 h-5 flex items-center justify-center hover:bg-surface text-muted"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-text w-5 text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.menuItemId, 1)}
                          className="w-5 h-5 flex items-center justify-center hover:bg-surface text-muted"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex-1">
                        <Input
                          placeholder="Ghi chú (ít cay, không hành...)"
                          value={item.note}
                          onChange={(e) => handleUpdateNote(item.menuItemId, e.target.value)}
                          className="h-7 text-[11px] px-2"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total and Submit Button */}
            <div className="pt-3 border-t border-border space-y-3 shrink-0">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-muted">Tổng cộng:</span>
                <span className="font-extrabold text-base text-primary">
                  {formatPrice(totalAmount)}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 h-11 text-xs"
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting || cart.length === 0}
                  className="flex-2 h-11 text-sm font-semibold gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  Gửi bếp
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
