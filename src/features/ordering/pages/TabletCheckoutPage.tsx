import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, UtensilsCrossed, ShieldAlert } from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'

import { useCartStore } from '@/features/ordering/store/cartStore'
import { useAuthStore } from '@/app/store/authStore'
import { orderApi } from '@/features/ordering/api/orderApi'
import type {
  InsufficientStockDetails,
} from '@/features/ordering/types/ordering.types'
import { StockConflictAlert } from '@/features/ordering/components/StockConflictAlert'
import { Button } from '@/shared/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/shared/components/ui/card'

export function TabletCheckoutPage() {
  const { items, getTotalAmount, getTotalItemCount, clearCart } = useCartStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(false)
  const [conflictDetails, setConflictDetails] = useState<InsufficientStockDetails | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Default sessionId: fallback to 1 (active seed session) if not provided by user session context
  const [sessionId, setSessionId] = useState<number>(1)

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const isEmpty = items.length === 0

  const handleConfirmOrder = async () => {
    if (isEmpty) {
      toast.error('Giỏ hàng đang trống, không thể tạo đơn')
      return
    }

    setIsLoading(true)
    setConflictDetails(null)
    setErrorMessage(null)

    try {
      const orderPayload = {
        sessionId: Number(sessionId),
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          note: item.note || null,
        })),
      }

      const createdOrder = await orderApi.createOrder(orderPayload)

      toast.success(`Đã gửi đơn #${createdOrder.id} vào bếp thành công!`)
      clearCart()

      // Navigate to order-success screen (FE-004)
      navigate('/tablet/order-success', {
        state: {
          orderId: createdOrder.id,
          tableCode: createdOrder.tableCode || user?.tableName || `Bàn ${user?.tableId}`,
          totalAmount: createdOrder.totalAmount,
          itemCount: createdOrder.items?.length || items.length,
        },
      })
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        const errorData = err.response.data as {
          message?: string
          error?: {
            code?: string
            details?: InsufficientStockDetails
          }
        }

        // Handle 409 Conflict: Insufficient stock
        if (err.response.status === 409) {
          if (errorData.error?.code === 'INSUFFICIENT_STOCK' && errorData.error.details) {
            setConflictDetails(errorData.error.details)
          } else {
            setErrorMessage(errorData.message || 'Xung đột trạng thái đơn hàng hoặc phiên phục vụ.')
          }
          toast.error('Không thể tạo đơn do xung đột dữ liệu hoặc tồn kho.')
          return
        }

        if (err.response.status === 403) {
          setErrorMessage('Tài khoản bàn không có quyền đặt món cho phiên phục vụ này.')
          toast.error('Lỗi phân quyền đặt món.')
          return
        }

        setErrorMessage(errorData.message || 'Có lỗi xảy ra khi tạo đơn hàng.')
        toast.error(errorData.message || 'Gửi đơn hàng thất bại.')
      } else {
        const msg = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ.'
        setErrorMessage(msg)
        toast.error(msg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isEmpty) {
    return (
      <div className="max-w-xl mx-auto my-12 text-center bg-card border border-border rounded-2xl p-8 shadow-sm">
        <h3 className="text-xl font-bold text-text mb-2">Giỏ hàng của bạn đang trống</h3>
        <p className="text-sm text-muted mb-6">
          Vui lòng chọn món ăn từ thực đơn trước khi tiến hành xác nhận đặt món.
        </p>
        <Link to="/tablet/cart">
          <Button variant="primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Về giỏ hàng
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/tablet/cart">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-text">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-text">
              Xác nhận gửi đơn đặt món
            </h2>
            <p className="text-xs text-muted">
              Vui lòng rà soát lại danh sách món trước khi chuyển vào bếp
            </p>
          </div>
        </div>

        {/* Table Badge */}
        <div className="px-3.5 py-1.5 bg-surface text-primary rounded-lg font-bold text-sm border border-border shadow-sm">
          {user?.tableName ? `Bàn ${user.tableName}` : `Bàn #${user?.tableId || 'T01'}`}
        </div>
      </div>

      {/* Stock Conflict Alert if 409 Occurred */}
      {conflictDetails && (
        <StockConflictAlert
          details={conflictDetails}
          message="Một số món trong giỏ hàng không đủ nguyên liệu chế biến tại thời điểm này."
        />
      )}

      {/* General Error Alert if other error occurred */}
      {errorMessage && !conflictDetails && (
        <div className="bg-red-50 border border-status-cancelled/30 rounded-xl p-4 text-xs text-status-cancelled flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Order Review Card */}
      <Card className="shadow-md">
        <CardHeader className="border-b border-border bg-surface/20">
          <CardTitle className="text-base font-semibold flex items-center justify-between">
            <span>Chi tiết các món yêu cầu ({getTotalItemCount()} phần)</span>
            <span className="text-xs font-normal text-muted">
              Phiên phục vụ: #{sessionId}
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="divide-y divide-border p-0">
          {items.map((item) => (
            <div
              key={item.menuItemId}
              className="p-4 sm:p-5 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-text">
                    {item.name}
                  </span>
                  <span className="text-xs text-accent font-bold">
                    &times; {item.quantity}
                  </span>
                </div>
                {item.note && (
                  <p className="text-xs text-muted italic mt-0.5">
                    Ghi chú: {item.note}
                  </p>
                )}
              </div>

              <div className="text-right">
                <span className="font-bold text-sm text-text">
                  {formatPrice(item.price * item.quantity)}
                </span>
                <div className="text-[11px] text-muted">
                  {formatPrice(item.price)} / phần
                </div>
              </div>
            </div>
          ))}
        </CardContent>

        <CardFooter className="flex-col gap-4 bg-surface/30 border-t border-border p-6">
          {/* Total Row */}
          <div className="flex items-baseline justify-between w-full">
            <span className="font-bold text-base text-text">Tổng thanh toán dự kiến:</span>
            <span className="font-black text-2xl text-primary">
              {formatPrice(getTotalAmount())}
            </span>
          </div>

          {/* Session ID input for table / staff flexibility */}
          <div className="w-full flex items-center justify-between text-xs text-muted pt-2 border-t border-border/50">
            <span>Mã phiên phục vụ hiện tại:</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-text">Session ID:</span>
              <input
                type="number"
                min="1"
                value={sessionId}
                onChange={(e) => setSessionId(Number(e.target.value) || 1)}
                className="w-16 px-2 py-1 border border-border rounded bg-card text-center font-bold text-primary focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full mt-2">
            <Link to="/tablet/cart" className="w-full sm:w-1/3">
              <Button
                variant="outline"
                size="lg"
                disabled={isLoading}
                className="w-full font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Sửa giỏ hàng
              </Button>
            </Link>

            <Button
              variant="primary"
              size="lg"
              onClick={handleConfirmOrder}
              isLoading={isLoading}
              disabled={isLoading}
              className="w-full sm:w-2/3 font-bold uppercase tracking-wider shadow-lg text-sm"
            >
              <UtensilsCrossed className="w-4 h-4 mr-2" />
              Xác nhận gửi đơn vào bếp
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
export default TabletCheckoutPage
