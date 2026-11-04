import { useState, useMemo, type ChangeEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { purchaseApi } from '@/features/purchasing/api/purchaseApi'
import { ImportPurchaseModal } from '@/features/purchasing/components/ImportPurchaseModal'
import { ingredientApi } from '@/features/inventory/api/ingredientApi'
import type { IngredientResponse } from '@/features/inventory/types/ingredient.types'
import {
  downloadPurchaseTemplate, getPurchaseRowIssues, matchPurchaseRows, readPurchaseExcel,
  MAX_PURCHASE_IMPORT_BYTES, MAX_PURCHASE_IMPORT_ROWS, type PurchaseFormRow,
} from '@/features/purchasing/utils/purchaseImport'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  FileText,
  Boxes,
  Loader2,
  AlertCircle,
  Receipt,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react'
import { toast } from 'sonner'
import type { AxiosError } from 'axios'
import type { ApiResponse } from '@/shared/types/api.types'

const EMPTY_INGREDIENTS: IngredientResponse[] = []

export function CreatePurchasePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [importError, setImportError] = useState('')
  const [importFileName, setImportFileName] = useState('')

  // Form general state
  const [purchaseDate, setPurchaseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [note, setNote] = useState<string>('')

  // Item rows state (starts with 1 empty row)
  const [rows, setRows] = useState<PurchaseFormRow[]>([
    {
      tempId: 'row-1',
      ingredientId: '',
      quantity: '',
      unitPrice: '',
    },
  ])

  // Load every page, including inactive ingredients so imports can explain invalid matches.
  const { data: ingredientsData, isLoading: isLoadingIngredients, isError: ingredientLoadError,
    refetch: refetchIngredients } = useQuery({
    queryKey: ['ingredients', 'purchase-catalog'],
    queryFn: async () => {
      const first = await ingredientApi.getIngredients({ page: 0, size: 200, sort: 'id,asc' })
      const all = [...first.content]
      for (let page = 1; page < first.totalPages; page++) {
        const next = await ingredientApi.getIngredients({ page, size: 200, sort: 'id,asc' })
        all.push(...next.content)
      }
      return all
    },
  })

  const allIngredients = ingredientsData ?? EMPTY_INGREDIENTS
  const ingredients = useMemo(() => allIngredients.filter((item) => item.isActive), [allIngredients])
  const rowIssues = useMemo(() => rows.map((row) => getPurchaseRowIssues(row, allIngredients)), [rows, allIngredients])
  const invalidRowCount = rowIssues.filter((issues) => issues.length > 0).length

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setImportError('')
    if (!/\.xlsx$/i.test(file.name) || file.size > MAX_PURCHASE_IMPORT_BYTES) {
      setImportError('Vui lòng chọn file .xlsx tối đa 5 MB. Với file .xls, hãy lưu lại dưới dạng .xlsx.')
      return
    }
    setIsImporting(true)
    try {
      const imported = await readPurchaseExcel(await file.arrayBuffer())
      const catalog = await refetchIngredients()
      if (catalog.error || !catalog.data) throw new Error('Không tải được danh mục kho để đối chiếu. Vui lòng thử lại.')
      const added = matchPurchaseRows(imported, catalog.data)
      const kept = rows.filter((row) => row.ingredientId !== '' || row.quantity || row.unitPrice || row.imported)
      if (kept.length + added.length > MAX_PURCHASE_IMPORT_ROWS) {
        throw new Error(`Phiếu nhập tối đa ${MAX_PURCHASE_IMPORT_ROWS} dòng. Hãy chia nhỏ file hoặc xóa bớt dòng hiện tại.`)
      }
      setRows([...kept, ...added])
      setImportFileName(file.name)
      setIsImportModalOpen(false)
      toast.success(`Đã đưa ${added.length} dòng vào phiếu nháp. Kiểm tra danh sách trước khi xác nhận nhập kho.`)
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Không đọc được file Excel.')
    } finally {
      setIsImporting(false)
    }
  }

  const handleDownloadTemplate = async () => {
    setIsDownloading(true)
    try {
      await downloadPurchaseTemplate()
    } catch {
      toast.error('Không tải được file mẫu. Vui lòng thử lại.')
    } finally {
      setIsDownloading(false)
    }
  }

  // Map ingredients by ID for quick lookup
  const ingredientMap = useMemo(() => {
    const map = new Map<number, (typeof ingredients)[0]>()
    ingredients.forEach((ing) => map.set(ing.id, ing))
    return map
  }, [ingredients])

  // Calculate row subtotal and grand total
  const totals = useMemo(() => {
    const rowSubtotals = rows.map((row) => {
      const q = Number(row.quantity)
      const p = Number(row.unitPrice)
      if (Number.isFinite(q) && q > 0 && Number.isFinite(p) && p >= 0) {
        return q * p
      }
      return 0
    })
    return { rowSubtotals, grandTotal: rowSubtotals.reduce((total, subtotal) => total + subtotal, 0) }
  }, [rows])

  // Add row
  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        tempId: `row-${Date.now()}-${Math.random()}`,
        ingredientId: '',
        quantity: '',
        unitPrice: '',
      },
    ])
  }

  // Remove row
  const handleRemoveRow = (tempId: string) => {
    if (rows.length === 1) {
      toast.warning('Phiếu nhập hàng cần ít nhất 1 dòng nguyên liệu')
      return
    }
    setRows((prev) => prev.filter((r) => r.tempId !== tempId))
  }

  // Update row field
  const handleUpdateRow = (
    tempId: string,
    field: 'ingredientId' | 'quantity' | 'unitPrice',
    value: string | number
  ) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.tempId === tempId) {
          const issue = field === 'ingredientId' ? 'ingredientIssue' : `${field}Issue` as const
          return { ...r, [field]: value, [issue]: undefined }
        }
        return r
      })
    )
  }

  // Mutation
  const createMutation = useMutation({
    mutationFn: purchaseApi.createPurchase,
    onSuccess: (res) => {
      toast.success('Tạo phiếu nhập hàng thành công! Đã tự động cập nhật kho.')
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      navigate(`/inventory/purchases/${res.id}`)
    },
    onError: (err: AxiosError<ApiResponse<unknown>>) => {
      const msg = getApiErrorMessage(err)
      toast.error(msg)
    },
  })

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (createMutation.isPending || isImporting || isLoadingIngredients || ingredientLoadError) return

    if (!purchaseDate) {
      toast.error('Vui lòng chọn ngày nhập hàng')
      return
    }

    if (rows.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 nguyên liệu vào phiếu nhập')
      return
    }

    // Validate rows
    const itemsPayload: { ingredientId: number; quantity: number; unitPrice: number }[] = []
    const seenIngredientIds = new Set<number>()

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (rowIssues[i].length) {
        toast.error(`Dòng ${i + 1}: ${rowIssues[i].join(' ')}`)
        return
      }
      if (row.ingredientId === '') {
        toast.error(`Dòng ${i + 1}: Vui lòng chọn nguyên liệu`)
        return
      }

      const q = Number(row.quantity)
      if (isNaN(q) || q <= 0) {
        toast.error(`Dòng ${i + 1}: Số lượng nhập phải lớn hơn 0`)
        return
      }

      const p = Number(row.unitPrice)
      if (isNaN(p) || p < 0) {
        toast.error(`Dòng ${i + 1}: Đơn giá không được âm`)
        return
      }

      if (seenIngredientIds.has(row.ingredientId)) {
        const ingName = ingredientMap.get(row.ingredientId)?.name || `ID ${row.ingredientId}`
        toast.warning(
          `Nguyên liệu "${ingName}" bị lặp lại ở nhiều dòng. Bạn có thể gộp số lượng vào 1 dòng duy nhất.`
        )
      }
      seenIngredientIds.add(row.ingredientId)

      itemsPayload.push({
        ingredientId: row.ingredientId,
        quantity: q,
        unitPrice: p,
      })
    }

    createMutation.mutate({
      purchaseDate,
      note: note.trim() || undefined,
      items: itemsPayload,
    })
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header & Back link */}
      <div>
        <Link
          to="/inventory/purchases"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại danh sách phiếu nhập</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text flex items-center gap-2">
              <Receipt className="w-6 h-6 text-accent" />
              Tạo Phiếu Nhập Hàng Mới
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Ghi nhận nguyên vật liệu mua vào thực tế để tăng số lượng tồn kho tương ứng.
            </p>
          </div>
          <Button type="button" variant="outline" disabled={isImporting || createMutation.isPending}
            onClick={() => { setImportError(''); setIsImportModalOpen(true) }}>
            <FileSpreadsheet className="w-4 h-4 mr-1.5" />Nhập Excel
          </Button>
        </div>
        {ingredientLoadError && <div role="alert" className="mt-3 flex items-center gap-3 text-sm text-status-cancelled">
          Không tải được danh mục nguyên liệu.
          <Button type="button" variant="outline" size="sm" onClick={() => refetchIngredients()}>Thử lại</Button>
        </div>}
      </div>

      {isImportModalOpen && (
        <ImportPurchaseModal
          isImporting={isImporting} isDownloading={isDownloading} error={importError}
          onFileChange={handleImportFile} onDownload={handleDownloadTemplate}
          onClose={() => setIsImportModalOpen(false)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset disabled={isImporting || createMutation.isPending} className="space-y-6 min-w-0">
        {/* Card 1: General Info */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-text uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent" />
            Thông tin chung phiếu nhập
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            {/* Purchase Date */}
            <div className="sm:col-span-4 space-y-1.5">
              <label className="text-xs font-medium text-text flex items-center gap-1">
                <span>Ngày nhập kho</span>
                <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            {/* Note */}
            <div className="sm:col-span-8 space-y-1.5">
              <label className="text-xs font-medium text-text flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Ghi chú / Nguồn nhập (Tối đa 255 ký tự)</span>
              </label>
              <Input
                type="text"
                placeholder="VD: Nhập thịt bò tươi sáng sớm từ chợ đầu mối..."
                maxLength={255}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Items List */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-text uppercase tracking-wider flex items-center gap-2">
                <Boxes className="w-4 h-4 text-accent" />
                Danh sách nguyên vật liệu nhập
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Mỗi dòng nguyên liệu sẽ được tự động cộng dồn vào tồn kho ngay khi lưu phiếu.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddRow}
              disabled={rows.length >= MAX_PURCHASE_IMPORT_ROWS}
              className="text-xs flex items-center gap-1 border-accent/30 text-accent hover:bg-accent/10"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm dòng
            </Button>
          </div>

          {importFileName && <p role="status" className="rounded-lg bg-surface/40 p-3 text-xs text-text">
            File gần nhất: <strong>{importFileName}</strong>. Các dòng có sẵn được giữ lại; dòng trống ban đầu được thay bằng dữ liệu Excel.
            {invalidRowCount > 0 ? ` Có ${invalidRowCount} dòng chưa hợp lệ. Hãy sửa, chọn lại nguyên liệu hoặc xóa dòng.` : ' Tất cả dòng đã đủ thông tin để nhập kho.'}
          </p>}

          {/* Table */}
          <div className="border border-border rounded-lg overflow-x-auto bg-surface/10">
            <table className="w-full text-xs">
              <thead className="bg-surface/50 border-b border-border text-muted-foreground font-medium">
                <tr>
                  <th className="px-3 py-2.5 text-center w-10">STT</th>
                  <th className="px-3 py-2.5 text-left min-w-[200px]">Nguyên liệu</th>
                  <th className="px-3 py-2.5 text-center w-20">ĐVT</th>
                  <th className="px-3 py-2.5 text-right w-24">Tồn hiện tại</th>
                  <th className="px-3 py-2.5 text-right min-w-[110px]">Số lượng nhập</th>
                  <th className="px-3 py-2.5 text-right min-w-[130px]">Đơn giá (VNĐ)</th>
                  <th className="px-3 py-2.5 text-right min-w-[130px]">Thành tiền (VNĐ)</th>
                  <th className="px-2 py-2.5 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row, idx) => {
                  const selectedIng =
                    row.ingredientId !== '' ? ingredientMap.get(row.ingredientId) : null
                  const rowSubtotal = totals.rowSubtotals[idx] || 0

                  return (
                    <tr key={row.tempId} className={`hover:bg-surface/30 transition-colors ${row.imported && rowIssues[idx].length ? 'bg-status-cancelled/5' : ''}`}>
                      {/* STT */}
                      <td className="px-3 py-2.5 text-center text-muted-foreground font-mono">
                        {idx + 1}
                      </td>

                      {/* Ingredient Selector */}
                      <td className="px-3 py-2.5">
                        <select
                          aria-label={`Nguyên liệu dòng ${idx + 1}`}
                          value={row.ingredientId}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Number(e.target.value)
                            handleUpdateRow(row.tempId, 'ingredientId', val)
                          }}
                          disabled={isLoadingIngredients}
                          className="w-full h-8 px-2.5 rounded border border-input bg-card text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                        >
                          <option value="">-- Chọn nguyên liệu kho --</option>
                          {ingredients.map((ing) => (
                            <option key={ing.id} value={ing.id}>
                              {ing.name} ({ing.unit})
                            </option>
                          ))}
                        </select>
                        {row.imported && <p className="mt-1 break-words text-[11px] text-muted">Excel dòng {row.imported.rowNumber}: {row.imported.name || '(trống tên)'}{row.imported.unit ? ` (${row.imported.unit})` : ''}</p>}
                        {!isLoadingIngredients && (row.imported || row.ingredientId !== '') && (
                          <div className="mt-1 text-[11px]" aria-live="polite">
                            {rowIssues[idx].length > 0 ? <ul className="space-y-0.5 text-status-cancelled">
                              {rowIssues[idx].map((issue) => <li key={issue}>{issue}</li>)}
                            </ul> : <span className="inline-flex items-center gap-1 text-status-ready"><CheckCircle2 className="h-3 w-3" />Hợp lệ</span>}
                          </div>
                        )}
                      </td>

                      {/* Unit */}
                      <td className="px-3 py-2.5 text-center">
                        {selectedIng ? (
                          <Badge variant="outline" className="text-[11px] bg-card">
                            {selectedIng.unit}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground italic">—</span>
                        )}
                      </td>

                      {/* Current Stock */}
                      <td className="px-3 py-2.5 text-right text-muted-foreground font-mono">
                        {selectedIng ? (
                          <span>{selectedIng.currentStock}</span>
                        ) : (
                          <span className="italic">—</span>
                        )}
                      </td>

                      {/* Quantity */}
                      <td className="px-3 py-2.5 text-right">
                        <Input
                          aria-label={`Số lượng nhập dòng ${idx + 1}`}
                          type="number"
                          step="0.001"
                          min="0.001"
                          placeholder="0.0"
                          value={row.quantity}
                          onChange={(e) =>
                            handleUpdateRow(row.tempId, 'quantity', e.target.value)
                          }
                          className="h-8 text-xs text-right py-0"
                          required
                        />
                      </td>

                      {/* Unit Price */}
                      <td className="px-3 py-2.5 text-right">
                        <Input
                          aria-label={`Đơn giá dòng ${idx + 1}`}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0"
                          value={row.unitPrice}
                          onChange={(e) =>
                            handleUpdateRow(row.tempId, 'unitPrice', e.target.value)
                          }
                          className="h-8 text-xs text-right py-0"
                          required
                        />
                      </td>

                      {/* Subtotal */}
                      <td className="px-3 py-2.5 text-right font-semibold text-text">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(rowSubtotal)}
                      </td>

                      {/* Delete */}
                      <td className="px-2 py-2.5 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRow(row.tempId)}
                          disabled={rows.length === 1}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Xóa dòng"
                          aria-label={`Xóa dòng ${idx + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Table Summary Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-accent" />
              <span>
                Tổng cộng: <strong>{rows.length}</strong> dòng nguyên liệu
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Tổng tiền phiếu nhập:
              </span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(totals.grandTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/inventory/purchases')}
            disabled={createMutation.isPending || isImporting}
            className="text-xs"
          >
            Hủy bỏ
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={createMutation.isPending || isImporting || isLoadingIngredients || ingredientLoadError || invalidRowCount > 0}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang ghi nhận nhập kho...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác nhận Nhập kho</span>
              </>
            )}
          </Button>
        </div>
        </fieldset>
      </form>
    </div>
  )
}
