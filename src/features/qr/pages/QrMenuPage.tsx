import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Minus, Plus, Search, X, Loader2 } from 'lucide-react'
import { qrApi } from '../api/qrApi'
import { useQrCartStore } from '../store/qrCartStore'
import { MenuImage } from '@/features/menu/components/MenuImage'
import type { MenuItemReadResponse } from '@/features/menu/types/menu.types'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/utils/cn'

const formatPrice = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

export function QrMenuPage() {
  const { qrToken = '' } = useParams<{ qrToken: string }>()

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItem, setSelectedItem] = useState<MenuItemReadResponse | null>(null)
  const [itemQty, setItemQty] = useState(1)
  const [itemNote, setItemNote] = useState('')

  const addItem = useQrCartStore((s) => s.addItem)

  const { data: categoriesData } = useQuery({
    queryKey: ['qrCategories', qrToken],
    queryFn: () => qrApi.getCategories(qrToken),
    enabled: Boolean(qrToken),
  })

  const { data: menuData, isLoading } = useQuery({
    queryKey: ['qrMenu', qrToken, selectedCategoryId],
    queryFn: () => qrApi.getMenu(qrToken, selectedCategoryId),
    enabled: Boolean(qrToken),
  })

  const categories = categoriesData?.content || []
  const menuItems = useMemo(() => {
    const list = menuData?.content || []
    const q = searchTerm.trim().toLowerCase()
    if (!q) return list
    return list.filter((item) => item.name.toLowerCase().includes(q))
  }, [menuData?.content, searchTerm])

  const openItemDetail = (item: MenuItemReadResponse) => {
    setSelectedItem(item)
    setItemQty(1)
    setItemNote('')
  }

  const handleAddFromModal = () => {
    if (!selectedItem) return
    addItem(selectedItem, itemQty, itemNote)
    setSelectedItem(null)
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Search + Category Pills */}
      <div className="sticky top-[60px] z-20 bg-background/95 backdrop-blur-xs border-b border-border px-3 md:px-5 pt-3 pb-2.5 space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm món ăn, đồ uống..."
            className="w-full h-10 pl-9 pr-8 rounded-full bg-card border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategoryId(undefined)}
            className={cn(
              'shrink-0 px-3.5 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-colors',
              selectedCategoryId === undefined
                ? 'bg-primary text-white'
                : 'bg-card border border-border text-text'
            )}
          >
            Tất cả
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoryId(cat.id)}
              className={cn(
                'shrink-0 px-3.5 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-colors',
                selectedCategoryId === cat.id
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border text-text'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* 2-Column Mobile Grid -> 3-4 Columns on Tablet/Desktop */}
      <div className="p-3 md:p-5">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center gap-2 text-muted">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
            <span className="text-sm">Đang tải thực đơn...</span>
          </div>
        ) : menuItems.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted">
            Không tìm thấy món ăn phù hợp.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {menuItems.map((item) => {
              const primaryImage = item.images?.[0]?.imageUrl
              const isAvailable =
                item.status === 'AVAILABLE' &&
                (item.availability ? item.availability.sellable : true)

              return (
                <div
                  key={item.id}
                  onClick={() => openItemDetail(item)}
                  className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col shadow-2xs active:scale-[0.99] transition-transform cursor-pointer"
                >
                  <div className="relative">
                    <MenuImage
                      src={primaryImage}
                      name={item.name}
                      className="w-full aspect-4/3"
                    />
                    {item.isFeatured && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-xs">
                        Bán chạy
                      </span>
                    )}
                    {!isAvailable && (
                      <div className="absolute inset-0 bg-slate-900/65 flex items-center justify-center p-2">
                        <span className="px-3 py-1 rounded-full bg-slate-900/80 border border-white/25 text-white text-xs sm:text-sm font-bold tracking-wide shadow-sm">
                          Tạm hết
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 md:p-3 flex-1 flex flex-col justify-between gap-2">
                    <h3 className="font-semibold text-xs sm:text-sm text-text line-clamp-2">
                      {item.name}
                    </h3>

                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs sm:text-sm text-primary truncate">
                        {formatPrice(item.price)}
                      </span>

                      {isAvailable && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            addItem(item, 1)
                          }}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-xs active:scale-95 shrink-0"
                          aria-label={`Thêm ${item.name}`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Item Detail Modal (Bottom-sheet on mobile, centered dialog on md+) */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 md:p-4">
          <div className="w-full md:max-w-lg bg-card rounded-t-3xl md:rounded-2xl p-4 md:p-5 pb-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="font-bold text-base text-text truncate">
                  {selectedItem.name}
                </h2>
                {selectedItem.isFeatured && (
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                    Bán chạy
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-full bg-surface text-muted shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <MenuImage
              src={selectedItem.images?.[0]?.imageUrl}
              name={selectedItem.name}
              className="w-full h-48 md:h-56 rounded-2xl"
            />

            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-primary">
                {formatPrice(selectedItem.price)}
              </span>
              {selectedItem.availability && !selectedItem.availability.sellable && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                  Tạm hết món
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Ghi chú cho bếp (tuỳ chọn)
              </label>
              <input
                type="text"
                value={itemNote}
                onChange={(e) => setItemNote(e.target.value)}
                maxLength={255}
                placeholder="Ví dụ: Ít cay, không hành..."
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center border border-border rounded-xl h-11 px-1">
                <button
                  type="button"
                  onClick={() => setItemQty((q) => Math.max(1, q - 1))}
                  className="p-2 text-text"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-bold text-sm">{itemQty}</span>
                <button
                  type="button"
                  onClick={() => setItemQty((q) => q + 1)}
                  className="p-2 text-text"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <Button
                className="flex-1 h-11 rounded-xl"
                disabled={
                  selectedItem.status !== 'AVAILABLE' ||
                  (selectedItem.availability ? !selectedItem.availability.sellable : false)
                }
                onClick={handleAddFromModal}
              >
                Thêm • {formatPrice(selectedItem.price * itemQty)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
