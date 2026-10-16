import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { purchaseApi } from '@/features/purchasing/api/purchaseApi'
import type { PurchaseItemResponse } from '@/features/purchasing/types/purchase.types'
import { CorrectPurchaseItemModal } from '@/features/purchasing/components/CorrectPurchaseItemModal'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import {
  ArrowLeft,
  Receipt,
  Calendar,
  User,
  Clock,
  FileText,
  Boxes,
  DollarSign,
  Edit3,
  RefreshCw,
  History,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'

export function PurchaseDetailPage() {
  const { purchaseId } = useParams<{ purchaseId: string }>()
  const navigate = useNavigate()
  const id = Number(purchaseId)

  // Modal correction state
  const [selectedItem, setSelectedItem] = useState<PurchaseItemResponse | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fetch purchase detail
  const {
    data: purchase,
    isLoading,
    isRefetching,
    refetch,
    isError,
  } = useQuery({
    queryKey: ['purchase', id],
    queryFn: () => purchaseApi.getPurchaseById(id),
    enabled: !isNaN(id),
  })

  const handleOpenCorrection = (item: PurchaseItemResponse) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const handleCloseCorrection = () => {
    setIsModalOpen(false)
    setSelectedItem(null)
  }

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-muted-foreground gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-accent" />
        <span className="text-sm font-medium">Đang tải thông tin chi tiết phiếu nhập #{purchaseId}...</span>
      </div>
    )
  }

  if (isError || !purchase) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <Receipt className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-text">Không tìm thấy phiếu nhập</h2>
        <p className="text-xs text-muted-foreground">
          Phiếu nhập hàng #{purchaseId} không tồn tại hoặc bạn không có quyền truy cập.
        </p>
        <Button size="sm" onClick={() => navigate('/inventory/purchases')} className="text-xs">
          Quay lại danh sách
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header & Back Link */}
      <div>
        <Link
          to="/inventory/purchases"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại danh sách phiếu nhập</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-text flex items-center gap-2">
                <Receipt className="w-6 h-6 text-accent" />
                Phiếu Nhập Hàng #{purchase.id}
              </h1>
              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-xs">
                Đã nhập kho
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Mã giao dịch kho: #{purchase.id} • Tạo bởi: <strong>{purchase.createdByName || '—'}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>

            <Link
              to="/inventory/movements"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs text-text hover:bg-surface transition-colors"
            >
              <History className="w-3.5 h-3.5 text-accent" />
              <span>Xem biến động kho</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Total Amount */}
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            Tổng giá trị đơn nhập
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
              purchase.totalAmount
            )}
          </div>
        </div>

        {/* Purchase Date */}
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-accent" />
            Ngày nhập hàng
          </div>
          <div className="text-base font-semibold text-text mt-1">{purchase.purchaseDate}</div>
        </div>

        {/* Creator */}
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-accent" />
            Người lập phiếu
          </div>
          <div className="text-base font-semibold text-text mt-1">
            {purchase.createdByName || '—'}
          </div>
        </div>

        {/* Total Items */}
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <Boxes className="w-3.5 h-3.5 text-accent" />
            Số loại nguyên liệu
          </div>
          <div className="text-base font-semibold text-text mt-1">
            {purchase.items?.length || 0} nguyên liệu
          </div>
        </div>
      </div>

      {/* Note Banner (if any) */}
      {purchase.note && (
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm flex items-start gap-3">
          <FileText className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-xs font-semibold text-text uppercase tracking-wider">
              Ghi chú đơn nhập:
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{purchase.note}</p>
          </div>
        </div>
      )}

      {/* Purchase Items Table Card */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text uppercase tracking-wider flex items-center gap-2">
            <Boxes className="w-4 h-4 text-accent" />
            Chi tiết các mặt hàng trong phiếu
          </h2>
          <span className="text-xs text-muted-foreground">
            Bấm nút <strong>"Sửa"</strong> để điều chỉnh sai sót thực tế
          </span>
        </div>

        <div className="border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-surface/50 border-b border-border text-muted-foreground font-medium">
              <tr>
                <th className="px-3 py-2.5 text-center w-10">STT</th>
                <th className="px-4 py-2.5 text-left">Nguyên liệu</th>
                <th className="px-3 py-2.5 text-center w-20">ĐVT</th>
                <th className="px-4 py-2.5 text-right">Số lượng nhập</th>
                <th className="px-4 py-2.5 text-right">Đơn giá</th>
                <th className="px-4 py-2.5 text-right">Thành tiền</th>
                <th className="px-4 py-2.5 text-left">Cập nhật lần cuối</th>
                <th className="px-3 py-2.5 text-right w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {purchase.items && purchase.items.length > 0 ? (
                purchase.items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-surface/30 transition-colors">
                    {/* STT */}
                    <td className="px-3 py-3 text-center text-muted-foreground font-mono">
                      {idx + 1}
                    </td>

                    {/* Ingredient Name */}
                    <td className="px-4 py-3 font-semibold text-text">
                      {item.ingredientName}
                    </td>

                    {/* Unit */}
                    <td className="px-3 py-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-surface border border-border text-[11px]">
                        {item.unit}
                      </span>
                    </td>

                    {/* Quantity */}
                    <td className="px-4 py-3 text-right font-medium text-text">
                      {item.quantity} <span className="text-muted-foreground text-[11px]">{item.unit}</span>
                    </td>

                    {/* Unit Price */}
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(item.unitPrice)}
                    </td>

                    {/* Subtotal */}
                    <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(item.subtotal)}
                    </td>

                    {/* Updated At */}
                    <td className="px-4 py-3 text-muted-foreground text-[11px]">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted-foreground/60" />
                        <span>{new Date(item.updatedAt || item.createdAt).toLocaleString('vi-VN')}</span>
                      </div>
                    </td>

                    {/* Correction Action */}
                    <td className="px-3 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenCorrection(item)}
                        className="h-7 px-2.5 text-xs border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 flex items-center gap-1"
                        title="Điều chỉnh số lượng / đơn giá"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Sửa</span>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    Không có dòng nguyên liệu nào trong phiếu này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-border">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Tất cả dòng nguyên liệu đã được cộng dồn vào tồn kho thực tế.</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Tổng thanh toán:
            </span>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
              }).format(purchase.totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Traceability Notice Card */}
      <div className="p-4 rounded-xl border border-sky-500/20 bg-sky-500/5 flex items-start gap-3 text-xs text-muted-foreground">
        <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-text">Quy chế Bù trừ & Truy vết Tồn kho (Traceability):</span>
          <p>
            Khi bạn điều chỉnh số lượng của một dòng nguyên liệu trong phiếu nhập hàng, hệ thống Backend sẽ tự động tính toán mức chênh lệch ($\Delta Q$) và tạo giao dịch bù trừ tương ứng trong sổ kho (Stock Movement). Điều này đảm bảo số lượng tồn kho luôn đồng nhất và không thể bị sửa đổi ngầm.
          </p>
        </div>
      </div>

      {/* Item Correction Modal */}
      <CorrectPurchaseItemModal
        purchaseId={id}
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={handleCloseCorrection}
        onSuccess={() => refetch()}
      />
    </div>
  )
}
