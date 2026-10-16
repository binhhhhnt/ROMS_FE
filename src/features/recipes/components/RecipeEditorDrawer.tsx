import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/app/store/authStore'
import { recipeApi } from '@/features/recipes/api/recipeApi'
import { ingredientApi } from '@/features/inventory/api/ingredientApi'
import type { RecipeMenuItem } from '@/features/recipes/types/recipe.types'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
  ShieldAlert,
  Loader2,
  BookOpen,
  Scale,
  UtensilsCrossed,
} from 'lucide-react'
import { toast } from 'sonner'
import type { AxiosError } from 'axios'
import type { ApiResponse } from '@/shared/types/api.types'

interface RecipeEditorDrawerProps {
  menuItem: RecipeMenuItem | null
  isOpen: boolean
  onClose: () => void
  onRecipeUpdated?: () => void
}

export function RecipeEditorDrawer({
  menuItem,
  isOpen,
  onClose,
  onRecipeUpdated,
}: RecipeEditorDrawerProps) {
  const { user } = useAuthStore()
  const isOwner = user?.role === 'OWNER'
  const queryClient = useQueryClient()

  // Add Item Form State
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>('')
  const [quantityRequired, setQuantityRequired] = useState<string>('')

  // Inline Editing State: ingredientId -> string value
  const [editingIngredientId, setEditingIngredientId] = useState<number | null>(null)
  const [editingQuantity, setEditingQuantity] = useState<string>('')

  // Fetch current recipe
  const {
    data: recipe,
    isLoading: isLoadingRecipe,
    isError,
  } = useQuery({
    queryKey: ['recipe', menuItem?.id],
    queryFn: () => recipeApi.getRecipe(menuItem!.id),
    enabled: isOpen && !!menuItem?.id,
  })

  // Fetch active ingredients list
  const { data: ingredientsData, isLoading: isLoadingIngredients } = useQuery({
    queryKey: ['ingredients', 'active-for-recipe'],
    queryFn: () => ingredientApi.getIngredients({ isActive: true, size: 300 }),
    enabled: isOpen && isOwner,
  })

  const availableIngredients = ingredientsData?.content || []

  // Filter out ingredients already in recipe
  const existingIngredientIds = new Set(recipe?.items.map((i) => i.ingredientId) || [])
  const selectableIngredients = availableIngredients.filter(
    (ing) => !existingIngredientIds.has(ing.id)
  )

  const selectedIngredientObj = availableIngredients.find(
    (i) => i.id === Number(selectedIngredientId)
  )

  // Invalidate queries helper
  const refreshRecipe = () => {
    queryClient.invalidateQueries({ queryKey: ['recipe', menuItem?.id] })
    queryClient.invalidateQueries({ queryKey: ['recipes', 'menu-items'] })
    if (onRecipeUpdated) {
      onRecipeUpdated()
    }
  }

  // Add Recipe Item Mutation
  const addMutation = useMutation({
    mutationFn: (vars: { ingredientId: number; quantity: number }) =>
      recipeApi.addRecipeItem(menuItem!.id, {
        ingredientId: vars.ingredientId,
        quantityRequired: vars.quantity,
      }),
    onSuccess: () => {
      toast.success('Đã thêm nguyên liệu vào công thức')
      setSelectedIngredientId('')
      setQuantityRequired('')
      refreshRecipe()
    },
    onError: (err: AxiosError<ApiResponse<unknown>>) => {
      const msg = err.response?.data?.message || 'Không thể thêm nguyên liệu'
      toast.error(msg)
    },
  })

  // Update Recipe Item Quantity Mutation
  const updateMutation = useMutation({
    mutationFn: (vars: { ingredientId: number; quantity: number }) =>
      recipeApi.updateRecipeItem(menuItem!.id, vars.ingredientId, vars.quantity),
    onSuccess: () => {
      toast.success('Đã cập nhật định lượng thành công')
      setEditingIngredientId(null)
      setEditingQuantity('')
      refreshRecipe()
    },
    onError: (err: AxiosError<ApiResponse<unknown>>) => {
      const msg = err.response?.data?.message || 'Không thể cập nhật định lượng'
      toast.error(msg)
    },
  })

  // Delete Recipe Item Mutation
  const deleteMutation = useMutation({
    mutationFn: (ingredientId: number) =>
      recipeApi.deleteRecipeItem(menuItem!.id, ingredientId),
    onSuccess: () => {
      toast.success('Đã xóa nguyên liệu khỏi công thức')
      refreshRecipe()
    },
    onError: (err: AxiosError<ApiResponse<unknown>>) => {
      const msg = err.response?.data?.message || 'Không thể xóa nguyên liệu'
      toast.error(msg)
    },
  })

  if (!isOpen || !menuItem) return null

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedIngredientId) {
      toast.error('Vui lòng chọn nguyên liệu')
      return
    }
    const qty = parseFloat(quantityRequired)
    if (isNaN(qty) || qty <= 0) {
      toast.error('Định lượng phải lớn hơn 0 (tối thiểu 0.001)')
      return
    }

    addMutation.mutate({
      ingredientId: Number(selectedIngredientId),
      quantity: qty,
    })
  }

  const handleStartEdit = (ingredientId: number, currentQty: number) => {
    setEditingIngredientId(ingredientId)
    setEditingQuantity(currentQty.toString())
  }

  const handleCancelEdit = () => {
    setEditingIngredientId(null)
    setEditingQuantity('')
  }

  const handleSaveEdit = (ingredientId: number) => {
    const qty = parseFloat(editingQuantity)
    if (isNaN(qty) || qty <= 0) {
      toast.error('Định lượng phải lớn hơn 0 (tối thiểu 0.001)')
      return
    }
    updateMutation.mutate({ ingredientId, quantity: qty })
  }

  const handleDelete = (ingredientId: number, ingredientName: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa nguyên liệu "${ingredientName}" khỏi công thức món này?`)) {
      deleteMutation.mutate(ingredientId)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-card border-l border-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border bg-surface/30 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/15 border border-accent/20 flex items-center justify-center text-accent mt-0.5">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-text">Công thức (BOM): {menuItem.name}</h2>
                <Badge variant="outline" className="text-xs bg-card">
                  #{menuItem.id}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span>Danh mục: <strong className="text-text">{menuItem.category?.name || 'Chưa phân loại'}</strong></span>
                <span>•</span>
                <span>Giá bán: <strong className="text-text">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(menuItem.price)}</strong></span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-surface hover:text-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Permission notice */}
          {!isOwner && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Chế độ Chỉ đọc:</strong> Chỉ Quản lý/Chủ nhà hàng (OWNER) mới có quyền thêm, sửa hoặc xóa định lượng nguyên liệu cho món này.
              </span>
            </div>
          )}

          {/* Add Item Card (OWNER only) */}
          {isOwner && (
            <div className="p-4 rounded-xl border border-accent/20 bg-accent/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-accent uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Thêm nguyên liệu vào định lượng
                </span>
                {selectableIngredients.length === 0 && !isLoadingIngredients && (
                  <span className="text-xs text-muted-foreground">Tất cả nguyên liệu khả dụng đã được thêm</span>
                )}
              </div>

              <form onSubmit={handleAddSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                {/* Ingredient select */}
                <div className="sm:col-span-6 space-y-1">
                  <label className="text-xs font-medium text-text">Chọn nguyên liệu</label>
                  <select
                    value={selectedIngredientId}
                    onChange={(e) => setSelectedIngredientId(e.target.value)}
                    disabled={isLoadingIngredients || selectableIngredients.length === 0}
                    className="w-full h-9 px-3 rounded-md border border-input bg-card text-xs text-text focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">-- Chọn nguyên liệu kho --</option>
                    {selectableIngredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} ({ing.unit}) — Còn: {ing.currentStock} {ing.unit}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div className="sm:col-span-4 space-y-1">
                  <label className="text-xs font-medium text-text flex items-center justify-between">
                    <span>Định lượng cần</span>
                    {selectedIngredientObj && (
                      <span className="text-accent font-semibold">({selectedIngredientObj.unit})</span>
                    )}
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.001"
                      min="0.001"
                      placeholder="VD: 0.25"
                      value={quantityRequired}
                      onChange={(e) => setQuantityRequired(e.target.value)}
                      className="h-9 text-xs pr-10"
                    />
                    {selectedIngredientObj && (
                      <span className="absolute right-2.5 top-2 text-[10px] text-muted-foreground font-medium uppercase">
                        {selectedIngredientObj.unit}
                      </span>
                    )}
                  </div>
                </div>

                {/* Add button */}
                <div className="sm:col-span-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={addMutation.isPending || !selectedIngredientId}
                    className="w-full h-9 bg-accent hover:bg-accent-hover text-white text-xs font-medium flex items-center justify-center gap-1"
                  >
                    {addMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        Thêm
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Current Recipe Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-semibold text-text">Danh sách nguyên vật liệu cấu thành</h3>
              </div>
              <Badge variant="secondary" className="text-xs font-mono">
                {recipe?.items.length || 0} nguyên liệu
              </Badge>
            </div>

            {isLoadingRecipe ? (
              <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
                <span className="text-xs">Đang tải công thức...</span>
              </div>
            ) : isError ? (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                Không thể tải công thức của món ăn này. Vui lòng thử lại.
              </div>
            ) : recipe && recipe.items.length > 0 ? (
              <div className="border border-border rounded-lg overflow-hidden bg-card">
                <table className="w-full text-xs">
                  <thead className="bg-surface/50 border-b border-border text-muted-foreground font-medium">
                    <tr>
                      <th className="px-4 py-2.5 text-left">Nguyên liệu</th>
                      <th className="px-3 py-2.5 text-center">Đơn vị</th>
                      <th className="px-3 py-2.5 text-right">Định lượng / phần</th>
                      {isOwner && <th className="px-4 py-2.5 text-right">Thao tác</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recipe.items.map((item) => {
                      const isEditing = editingIngredientId === item.ingredientId

                      return (
                        <tr key={item.id} className="hover:bg-surface/30 transition-colors">
                          <td className="px-4 py-3 font-medium text-text">
                            {item.ingredientName}
                          </td>
                          <td className="px-3 py-3 text-center text-muted-foreground">
                            <span className="px-2 py-0.5 rounded bg-surface border border-border text-[11px]">
                              {item.unit}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <Input
                                  type="number"
                                  step="0.001"
                                  min="0.001"
                                  value={editingQuantity}
                                  onChange={(e) => setEditingQuantity(e.target.value)}
                                  className="w-20 h-7 text-xs text-right py-0 px-2"
                                  autoFocus
                                />
                                <span className="text-muted-foreground">{item.unit}</span>
                              </div>
                            ) : (
                              <span className="font-semibold text-text text-sm">
                                {item.quantityRequired} <span className="text-xs text-muted-foreground font-normal">{item.unit}</span>
                              </span>
                            )}
                          </td>
                          {isOwner && (
                            <td className="px-4 py-3 text-right">
                              {isEditing ? (
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleSaveEdit(item.ingredientId)}
                                    disabled={updateMutation.isPending}
                                    className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                    title="Lưu số lượng"
                                  >
                                    {updateMutation.isPending ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Check className="w-3.5 h-3.5" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleCancelEdit}
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-text hover:bg-surface"
                                    title="Hủy"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleStartEdit(item.ingredientId, item.quantityRequired)}
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-accent hover:bg-accent/10"
                                    title="Chỉnh sửa định lượng"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDelete(item.ingredientId, item.ingredientName)}
                                    disabled={deleteMutation.isPending}
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    title="Xóa khỏi công thức"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-border rounded-xl p-6 bg-card/50">
                <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center mx-auto text-muted-foreground/60 mb-3">
                  <UtensilsCrossed className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-text text-sm">Chưa có công thức định lượng (BOM)</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                  Món ăn này chưa được gán nguyên vật liệu tiêu hao. Khi bán món, hệ thống sẽ không thể tự động trừ kho.
                </p>
                {isOwner && (
                  <p className="text-xs text-accent font-medium mt-3">
                    ↑ Hãy chọn nguyên liệu và định lượng ở phía trên để thêm mới.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-surface/30 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {recipe?.items.length
              ? `Định lượng cho 1 suất phục vụ của món "${menuItem.name}"`
              : 'Chưa có định lượng nguyên liệu'}
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  )
}
