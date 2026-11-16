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
  FileText,
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
    <div className="space-y-5 max-w-5xl mx-auto pb-12">
      {/* Tầng 1: Top Header & Back Link */}
      <div className="pb-3 border-b border-border">
        <Link to="/inventory/purchases" className="inline-block mb-3">
          <Button type="button" variant="outline" size="sm" className="h-9 px-3 text-xs font-medium gap-1.5">
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Quay lại danh sách phiếu nhập</span>
          </Button>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-text">
                Phiếu Nhập Hàng #{purchase.id}
              </h1>
              <Badge variant="completed">Đã nhập kho</Badge>
            </div>
            <p className="text-xs text-muted">
              Mã giao dịch kho: #{purchase.id} • Tạo bởi: <strong className="text-text">{purchase.createdByName || '—'}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="h-9 px-3 text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>

            <Link to="/inventory/movements">
              <Button variant="outline" size="sm" className="h-9 px-3 text-xs gap-1.5">
                <History className="w-3.5 h-3.5" />
                <span>Xem biến động kho</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tầng 2: Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border p-4 rounded-lg">
          <div className="text-xs text-muted font-medium">Tổng giá trị đơn nhập</div>
          <div className="text-xl font-bold text-status-completed tabular-nums mt-1">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
              purchase.totalAmount
            )}
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-lg">
          <div className="text-xs text-muted font-medium">Ngày nhập hàng</div>
          <div className="text-base font-semibold text-text tabular-nums mt-1">{purchase.purchaseDate}</div>
        </div>

        <div className="bg-card border border-border p-4 rounded-lg">
          <div className="text-xs text-muted font-medium">Người lập phiếu</div>
          <div className="text-base font-semibold text-text mt-1">
            {purchase.createdByName || '—'}
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-lg">
          <div className="text-xs text-muted font-medium">Số loại nguyên liệu</div>
          <div className="text-base font-semibold text-text tabular-nums mt-1">
            {purchase.items?.length || 0} nguyên liệu
          </div>
        </div>
      </div>

      {/* Note Banner */}
      {purchase.note && (
        <div className="bg-card border border-border p-4 rounded-lg flex items-start gap-3">
          <FileText className="w-4 h-4 text-muted mt-0.5 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-semibold text-text">Ghi chú đơn nhập</div>
            <p className="text-xs text-muted mt-0.5">{purchase.note}</p>
          </div>
        </div>
      )}

      {/* Tầng 3: Purchase Items Table Card */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 sm:px-5 border-b border-border flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-text">
            Chi tiết các mặt hàng trong phiếu
          </h2>
          <span className="text-xs text-muted">
            Bấm <strong className="text-text">&ldquo;Sửa&rdquo;</strong> để điều chỉnh thực tế
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-surface/60 border-b border-border text-muted font-medium">
              <tr>
                <th className="px-3 py-2.5 text-center w-10">STT</th>
                <th className="px-4 py-2.5 text-left">Nguyên liệu</th>
                <th className="px-3 py-2.5 text-center w-20 whitespace-nowrap">ĐVT</th>
                <th className="px-4 py-2.5 text-right whitespace-nowrap">Số lượng nhập</th>
                <th className="px-4 py-2.5 text-right whitespace-nowrap">Đơn giá</th>
                <th className="px-4 py-2.5 text-right whitespace-nowrap">Thành tiền</th>
                <th className="px-4 py-2.5 text-left whitespace-nowrap">Cập nhật lần cuối</th>
                <th className="px-3 py-2.5 text-right w-24 whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {purchase.items && purchase.items.length > 0 ? (
                purchase.items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-muted-bg/40 transition-colors">
                    <td className="px-3 py-3 text-center text-muted tabular-nums">
                      {idx + 1}
                    </td>

                    <td className="px-4 py-3 font-semibold text-text">
                      {item.ingredientName}
                    </td>

                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <Badge variant="outline">{item.unit}</Badge>
                    </td>

                    <td className="px-4 py-3 text-right font-medium text-text tabular-nums whitespace-nowrap">
                      {item.quantity} <span className="text-muted">{item.unit}</span>
                    </td>

                    <td className="px-4 py-3 text-right text-muted tabular-nums whitespace-nowrap">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(item.unitPrice)}
                    </td>

                    <td className="px-4 py-3 text-right font-semibold text-status-completed tabular-nums whitespace-nowrap">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(item.subtotal)}
                    </td>

                    <td className="px-4 py-3 text-muted tabular-nums whitespace-nowrap">
                      {new Date(item.updatedAt || item.createdAt).toLocaleString('vi-VN')}
                    </td>

                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenCorrection(item)}
                        className="h-8 px-2.5 text-xs gap-1"
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
                  <td colSpan={8} className="py-8 text-center text-muted">
                    Không có dòng nguyên liệu nào trong phiếu này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="px-4 py-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-border bg-card">
          <div className="text-xs text-muted flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-status-completed shrink-0" />
            <span>Tất cả dòng nguyên liệu đã được cộng dồn vào tồn kho thực tế.</span>
          </div>

          <div className="flex items-center gap-3 tabular-nums">
            <span className="text-xs text-muted font-medium">
              Tổng thanh toán:
            </span>
            <span className="text-lg font-bold text-status-completed">
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
              }).format(purchase.totalAmount)}
            </span>
          </div>
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
