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

  // 1. Fetch menu items
  const { data: menuData, isLoading: isLoadingMenu } = useQuery({
    queryKey: ['menu-items', 'available'],
    queryFn: () => menuApi.list({ status: 'AVAILABLE', page: 0, size: 100, sort: 'name,asc' }),
    enabled: isOpen,
  })

  // 2. Fetch categories
  const { data: categoryData } = useQuery({
    queryKey: ['categories', 'active'],
    queryFn: () => categoryApi.list(0, 50),
    enabled: isOpen,
  })

  // 3. Fetch tables with active sessions (only needed if initialSessionId not provided)
  const { data: tablesData } = useQuery({
    queryKey: ['tables', 'active-sessions'],
    queryFn: () => tableApi.getTables({ size: 100 }),
    enabled: isOpen && !initialSessionId,
  })

  const menuItems = menuData?.content || []
  const categories = categoryData?.content || []
  const activeTables = useMemo(() => {
    return (tablesData?.content || []).filter(
      (t) => t.activeSessionId !== null && t.activeSessionId !== undefined
    )
  }, [tablesData])

  // Filtered menu items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl w-full max-w-5xl h-[92vh] max-h-[820px] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:px-6 sm:py-4 border-b border-border bg-surface/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-text">Đặt món tại bàn cho Phục vụ</h2>
                {initialTableCode && (
                  <Badge variant="cooking" className="font-bold text-xs">
                    Bàn {initialTableCode}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted">
                Nhân viên phục vụ ghi nhận món ăn và gửi trực tiếp vào bếp (PENDING)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-muted hover:text-text p-1.5 rounded-lg hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left (Menu selection) & Right (Cart preview) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Column: Menu Items Catalog */}
          <div className="flex-1 flex flex-col p-4 sm:p-5 overflow-hidden border-b lg:border-b-0 lg:border-r border-border">
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
            <div className="flex flex-col sm:flex-row gap-2.5 mb-4 shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Tìm món ăn nhanh..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('ALL')}
                  className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${selectedCategory === 'ALL'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface hover:bg-surface/80 text-muted'
                    }`}
                >
                  Tất cả
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id.toString())}
                    className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${selectedCategory === cat.id.toString()
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-surface hover:bg-surface/80 text-muted'
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

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border flex flex-col justify-between gap-2.5 transition-all ${qty > 0
                            ? 'border-primary/50 bg-primary/5 shadow-xs'
                            : 'border-border bg-card hover:border-accent/40'
                          }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-sm text-text leading-tight">
                              {item.name}
                            </h4>
                            {item.isFeatured && (
                              <span className="text-[10px] bg-amber-500/15 text-amber-600 font-bold px-1.5 py-0.5 rounded shrink-0">
                                HOT
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-muted line-clamp-1 mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-border/50">
                          <span className="font-extrabold text-sm text-primary">
                            {formatPrice(item.price)}
                          </span>

                          {qty === 0 ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddToCart(item)}
                              className="h-7 text-xs px-2.5 text-primary border-primary/30 hover:bg-primary hover:text-white"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" />
                              Thêm
                            </Button>
                          ) : (
                            <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(item.id, -1)}
                                className="w-6 h-6 rounded flex items-center justify-center hover:bg-surface text-muted hover:text-text"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-bold text-text w-5 text-center">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(item.id, 1)}
                                className="w-6 h-6 rounded flex items-center justify-center hover:bg-surface text-muted hover:text-text"
                              >
                                <Plus className="w-3 h-3" />
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
          <div className="w-full lg:w-96 flex flex-col bg-surface/20 p-4 sm:p-5 overflow-hidden shrink-0">
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
                  className="flex-1 text-xs"
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting || cart.length === 0}
                  className="flex-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Đang gửi...' : 'Gửi bếp'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
